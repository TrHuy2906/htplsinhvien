import os
import time
from flask import Flask, render_template, jsonify
from sqlalchemy import text
from prometheus_flask_exporter import PrometheusMetrics

from database import db
from models import Student, User
from auth import auth_bp, create_user, login_required, role_required
from sinhvien import sinhvien_bp
from giangvien import giangvien_bp
from khoa import khoa_bp
from bomon import bomon_bp
from chuyennganh import chuyennganh_bp
from nienkhoa import nienkhoa_bp

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

# Khởi tạo database với app
db.init_app(app)

# Đăng ký các module Blueprint
app.register_blueprint(auth_bp)
app.register_blueprint(sinhvien_bp)
app.register_blueprint(giangvien_bp)
app.register_blueprint(khoa_bp)
app.register_blueprint(bomon_bp)
app.register_blueprint(chuyennganh_bp)
app.register_blueprint(nienkhoa_bp)

def init_db():
    retries = 20
    while retries > 0:
        try:
            with app.app_context():
                db.create_all()
                if Student.query.count() == 0:
                    # Tạo tài khoản admin mặc định (role = 2: Quản trị viên)
                    if not User.query.filter_by(username='admin').first():
                        create_user('admin', 'admin123', role=2)
                    # Dữ liệu sinh viên mẫu
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

# Giao diện Web Quản lý Sinh viên chính
@app.route('/')
@login_required
@role_required(2)
def index():
    return render_template('index.html')

# Giao diện Web Quản lý Giảng viên
@app.route('/giangvien')
@login_required
@role_required(2)
def giangvien_index():
    return render_template('giangvien.html')

# Giao diện Web Quản lý Khoa & Bộ Môn
@app.route('/khoa_bomon')
@login_required
@role_required(2)
def khoa_bomon_index():
    return render_template('khoa_bomon.html')

# Giao diện Web Quản lý Chuyên Ngành
@app.route('/chuyennganh')
@login_required
@role_required(2)
def chuyennganh_index():
    return render_template('chuyennganh.html')

# API Giám sát kiểm tra sức khoẻ hệ thống (Health Check)
@app.route('/health', methods=['GET'])
@metrics.do_not_track()
def health():
    try:
        db.session.execute(text('SELECT 1'))
        return jsonify({'status': 'healthy', 'database': 'connected'}), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'database': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
