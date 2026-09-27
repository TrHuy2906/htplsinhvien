from flask import Flask, request, jsonify, render_template, session, redirect, url_for
import driver
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from prometheus_flask_exporter import PrometheusMetrics
import os
import time

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secure secret key for session management

# Tích hợp Prometheus tự động thu thập metrics (đáp ứng Tiêu chí 4)
metrics = PrometheusMetrics(app)

# Cấu hình kết nối MySQL (Đọc từ biến môi trường của Docker)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL', 
    'mysql+pymysql://root:rootpassword@db:3306/student_db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Khởi tạo bảng Sinh viên (CRUD)
class Student(db.Model):
    __tablename__ = 'student'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    class_name = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Float, nullable=False)

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    score = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'class': self.class_name,
            'class_name': self.class_name,
            'score': round(self.score, 2)
        }

def init_db():
    retries = 20
    while retries > 0:
        try:
            with app.app_context():
                db.create_all()
                if Student.query.count() == 0:
                    # Create default admin user
                    if not User.query.filter_by(username='admin').first():
                        driver.create_user('admin', 'admin123')
                    # Sample students
                    samples = [
                    samples = [
                        Student(name="Nguyễn Văn An", class_name="CNTT-K15", score=8.8),
                        Student(name="Trần Thị Bình", class_name="KTPM-K16", score=9.2),
                        Student(name="Lê Hoàng Cường", class_name="CNTT-K15", score=7.5),
                        Student(name="Phạm Minh Đức", class_name="HTTT-K14", score=6.4),
                        Student(name="Vũ Hải Yến", class_name="KTPM-K16", score=8.5),
                        Student(name="Đặng Quốc Huy", class_name="CNTT-K15", score=9.6)
                    ]
                    db.session.bulk_save_objects(samples)
                    db.session.commit()
                    print("Sample students created!")
                print("Database tables initialized successfully!")
                return
        except Exception as e:
            retries -= 1
            print(f"Waiting for database to be ready... ({retries} retries left): {e}")
            time.sleep(2)
    print("Warning: Database initialization retries exhausted.")

# Giao diện Web Quản lý Sinh viên
@app.route('/')
def index():
    return render_template('index.html')

# API Lấy danh sách sinh viên
@app.route('/students', methods=['GET'])
def get_students():
    students = Student.query.order_by(Student.id.desc()).all()
    return jsonify([s.to_dict() for s in students])

# API Lấy thông tin 1 sinh viên
@app.route('/students/<int:id>', methods=['GET'])
def get_student(id):
    student = Student.query.get(id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    return jsonify(student.to_dict())

# API Thêm sinh viên mới
@app.route('/students', methods=['POST'])
def add_student():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data or 'name' not in data:
        return jsonify({'error': 'Missing student name'}), 400
    
    name = data.get('name', '').strip()
    class_name = (data.get('class') or data.get('class_name', '')).strip()
    try:
        score = float(data.get('score', 0))
    except (ValueError, TypeError):
        score = 0.0

    if not name or not class_name:
        return jsonify({'error': 'Name and class are required'}), 400

    new_student = Student(name=name, class_name=class_name, score=score)
    db.session.add(new_student)
    db.session.commit()
    return jsonify({
        'message': 'Student added successfully',
        'student': new_student.to_dict()
    }), 201

# API Cập nhật sinh viên
@app.route('/students/<int:id>', methods=['PUT'])
def update_student(id):
    student = Student.query.get(id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'name' in data and data['name']:
        student.name = data['name'].strip()
    if 'class' in data and data['class']:
        student.class_name = data['class'].strip()
    elif 'class_name' in data and data['class_name']:
        student.class_name = data['class_name'].strip()
    if 'score' in data:
        try:
            student.score = float(data['score'])
        except (ValueError, TypeError):
            pass

    db.session.commit()
    return jsonify({
        'message': 'Student updated successfully',
        'student': student.to_dict()
    }), 200

# API Xóa sinh viên
@app.route('/students/<int:id>', methods=['DELETE'])
def delete_student(id):
    student = Student.query.get(id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    db.session.delete(student)
    db.session.commit()
    return jsonify({'message': 'Student deleted successfully'}), 200

# API Giám sát kiểm tra sức khoẻ hệ thống (Health Check)
@app.route('/health', methods=['GET'])
@metrics.do_not_track()
def health():
    try:
        db.session.execute(text('SELECT 1'))
        return jsonify({'status': 'healthy', 'database': 'connected'}), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'database': str(e)}), 500

# Login routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json(force=True, silent=True) or request.form
        username = data.get('username', '').strip()
        password = data.get('password', '')
        user = driver.authenticate(username, password)
        if user:
            session['user_id'] = user.id
            session['username'] = user.username
            return jsonify({'message': 'Login successful'}), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    else:
        return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
