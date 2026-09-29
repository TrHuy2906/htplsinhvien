from database import db
from werkzeug.security import generate_password_hash, check_password_hash

# Model Sinh viên (CRUD hiện tại)
class Student(db.Model):
    __tablename__ = 'student'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    class_name = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Float, nullable=False)
    student_code = db.Column(db.String(50), unique=True, nullable=True)
    gender = db.Column(db.String(10), nullable=True)
    email = db.Column(db.String(100), nullable=True)
    dob = db.Column(db.Date, nullable=True)
    account_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='SET NULL'), unique=True, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'class': self.class_name,
            'class_name': self.class_name,
            'score': round(self.score, 2),
            'student_code': self.student_code,
            'gender': self.gender,
            'email': self.email,
            'dob': self.dob.isoformat() if self.dob else None,
            'account_id': self.account_id
        }

# Model Tài khoản người dùng (Xác thực hiện tại)
class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Integer, default=0, nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Model Giảng viên
class Lecturer(db.Model):
    __tablename__ = 'lecturer'
    id = db.Column(db.Integer, primary_key=True)
    lecturer_code = db.Column(db.String(50), unique=True, nullable=True) # MGV
    name = db.Column(db.String(100), nullable=False) # HoTen
    email = db.Column(db.String(100), unique=True, nullable=True) # Email
    phone = db.Column(db.String(20), nullable=True) # SDT
    department_id = db.Column(db.Integer, db.ForeignKey('bomon.id', ondelete='SET NULL'), nullable=True) # MBM
    specialization = db.Column(db.String(100), nullable=True) # ChuyenMon
    account_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='SET NULL'), unique=True, nullable=True) # MTK
    gender = db.Column(db.String(10), nullable=True) # Gioitinh
    research_direction = db.Column(db.String(255), nullable=True) # HuongNghienCuu
    education_level = db.Column(db.String(50), nullable=True) # TrinhDoHocVan

    def to_dict(self):
        return {
            'id': self.id,
            'lecturer_code': self.lecturer_code,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'department_id': self.department_id,
            'specialization': self.specialization,
            'account_id': self.account_id,
            'gender': self.gender,
            'research_direction': self.research_direction,
            'education_level': self.education_level
        }

# Model Khoa
class Khoa(db.Model):
    __tablename__ = 'khoa'
    id = db.Column(db.Integer, primary_key=True)
    khoa_code = db.Column(db.String(50), unique=True, nullable=False) # MK
    name = db.Column(db.String(150), nullable=False) # TenKhoa

    def to_dict(self):
        return {
            'id': self.id,
            'khoa_code': self.khoa_code,
            'name': self.name
        }

# Model Bộ Môn
class BoMon(db.Model):
    __tablename__ = 'bomon'
    id = db.Column(db.Integer, primary_key=True)
    bomon_code = db.Column(db.String(50), unique=True, nullable=False) # MBM
    name = db.Column(db.String(150), nullable=False) # TenBM
    khoa_id = db.Column(db.Integer, db.ForeignKey('khoa.id', ondelete='CASCADE'), nullable=False) # MK

    def to_dict(self):
        return {
            'id': self.id,
            'bomon_code': self.bomon_code,
            'name': self.name,
            'khoa_id': self.khoa_id
        }

# Model Chuyên Ngành
class ChuyenNganh(db.Model):
    __tablename__ = 'chuyen_nganh'
    id = db.Column(db.Integer, primary_key=True)
    major_code = db.Column(db.String(50), unique=True, nullable=False) # MCN
    name = db.Column(db.String(150), nullable=False) # TenNganh
    faculty_id = db.Column(db.Integer, db.ForeignKey('khoa.id', ondelete='CASCADE'), nullable=False) # MK

    def to_dict(self):
        return {
            'id': self.id,
            'major_code': self.major_code,
            'name': self.name,
            'faculty_id': self.faculty_id
        }
