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

    new_student = Student(name=name, class_name=class_name, score=score)
    db.session.add(new_student)
    db.session.commit()
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

    db.session.commit()
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
