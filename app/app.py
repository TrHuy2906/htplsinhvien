from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from prometheus_flask_exporter import PrometheusMetrics
import os

app = Flask(__name__)

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
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    class_name = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Float, nullable=False)

# Tự động tạo bảng trước request đầu tiên
with app.app_context():
    db.create_all()

# API Lấy danh sách sinh viên
@app.route('/students', methods=['GET'])
def get_students():
    students = Student.query.all()
    return jsonify([{'id': s.id, 'name': s.name, 'class': s.class_name, 'score': s.score} for s in students])

# API Thêm sinh viên mới
@app.route('/students', methods=['POST'])
def add_student():
    data = request.json
    new_student = Student(name=data['name'], class_name=data['class'], score=data['score'])
    db.session.add(new_student)
    db.session.commit()
    return jsonify({'message': 'Student added successfully'}), 201

# API Giám sát kiểm tra sức khoẻ hệ thống (Health Check)
@app.route('/health', methods=['GET'])
@metrics.do_not_track()
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
