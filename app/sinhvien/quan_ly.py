from flask import request, jsonify
from database import db
from models import Student
from auth import login_required, role_required
from . import sinhvien_bp

# API Thêm sinh viên mới
@sinhvien_bp.route('/students', methods=['POST'])
@login_required
@role_required(2)
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

    student_code = data.get('student_code')
    if student_code:
        student_code = student_code.strip()
        if Student.query.filter_by(student_code=student_code).first():
            return jsonify({'error': 'Student code already exists'}), 400

    account_id = data.get('account_id')
    if account_id is not None:
        try:
            account_id = int(account_id)
            from models import User
            if not User.query.get(account_id):
                return jsonify({'error': 'Account not found'}), 400
            if Student.query.filter_by(account_id=account_id).first():
                return jsonify({'error': 'Account ID already linked to another student'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid account_id'}), 400

    dob = data.get('dob')
    parsed_dob = None
    if dob:
        try:
            from datetime import datetime
            parsed_dob = datetime.strptime(dob.strip(), '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid dob format, must be YYYY-MM-DD'}), 400

    gender = data.get('gender')
    email = data.get('email')

    new_student = Student(
        name=name, class_name=class_name, score=score,
        student_code=student_code if student_code else None,
        gender=gender.strip() if gender else None,
        email=email.strip() if email else None,
        dob=parsed_dob,
        account_id=account_id
    )
    db.session.add(new_student)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Database error'}), 500

    return jsonify({
        'message': 'Student added successfully',
        'student': new_student.to_dict()
    }), 201

# API Cập nhật sinh viên
@sinhvien_bp.route('/students/<int:id>', methods=['PUT'])
@login_required
@role_required(2)
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

    if 'student_code' in data:
        code = data['student_code']
        if code is None:
            student.student_code = None
        else:
            code = code.strip()
            existing = Student.query.filter_by(student_code=code).first()
            if existing and existing.id != student.id:
                return jsonify({'error': 'Student code already exists'}), 400
            student.student_code = code

    if 'account_id' in data:
        acc_id = data['account_id']
        if acc_id is None:
            student.account_id = None
        else:
            try:
                acc_id = int(acc_id)
                from models import User
                if not User.query.get(acc_id):
                    return jsonify({'error': 'Account not found'}), 400
                existing = Student.query.filter_by(account_id=acc_id).first()
                if existing and existing.id != student.id:
                    return jsonify({'error': 'Account ID already linked to another student'}), 400
                student.account_id = acc_id
            except ValueError:
                return jsonify({'error': 'Invalid account_id'}), 400

    if 'dob' in data:
        dob = data['dob']
        if dob is None:
            student.dob = None
        else:
            try:
                from datetime import datetime
                student.dob = datetime.strptime(dob.strip(), '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid dob format, must be YYYY-MM-DD'}), 400

    if 'gender' in data:
        gender = data['gender']
        student.gender = gender.strip() if gender else None

    if 'email' in data:
        email = data['email']
        student.email = email.strip() if email else None

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Database error'}), 500

    return jsonify({
        'message': 'Student updated successfully',
        'student': student.to_dict()
    }), 200

# API Xóa sinh viên
@sinhvien_bp.route('/students/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_student(id):
    student = Student.query.get(id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    db.session.delete(student)
    db.session.commit()
    return jsonify({'message': 'Student deleted successfully'}), 200
