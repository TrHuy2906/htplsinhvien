from flask import request, jsonify
from . import giangvien_bp
from models import Lecturer, User, db
from auth import login_required, role_required

@giangvien_bp.route('/lecturers', methods=['POST'])
@login_required
@role_required(2)
def add_lecturer():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"error": "Missing required field: name"}), 400

    lecturer_code = data.get('lecturer_code')
    account_id = data.get('account_id')
    
    if lecturer_code:
        if Lecturer.query.filter_by(lecturer_code=lecturer_code).first():
            return jsonify({"error": "Duplicate lecturer_code"}), 400
            
    if account_id:
        if not User.query.get(account_id):
            return jsonify({"error": "Invalid account_id, User does not exist"}), 400
        if Lecturer.query.filter_by(account_id=account_id).first():
            return jsonify({"error": "Duplicate account_id, User already linked"}), 400

    try:
        new_lecturer = Lecturer(
            lecturer_code=lecturer_code,
            name=data.get('name').strip(),
            email=data.get('email'),
            phone=data.get('phone'),
            department_id=data.get('department_id'),
            specialization=data.get('specialization'),
            account_id=account_id,
            gender=data.get('gender'),
            research_direction=data.get('research_direction'),
            education_level=data.get('education_level')
        )
        db.session.add(new_lecturer)
        db.session.commit()
        return jsonify({"message": "Lecturer created successfully", "lecturer": new_lecturer.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@giangvien_bp.route('/lecturers/<int:id>', methods=['PUT'])
@login_required
@role_required(2)
def update_lecturer(id):
    lecturer = Lecturer.query.get(id)
    if not lecturer:
        return jsonify({"error": "Lecturer not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if 'lecturer_code' in data and data['lecturer_code'] is not None and data['lecturer_code'] != lecturer.lecturer_code:
        if Lecturer.query.filter_by(lecturer_code=data['lecturer_code']).first():
            return jsonify({"error": "Duplicate lecturer_code"}), 400
            
    if 'account_id' in data and data['account_id'] is not None and data['account_id'] != lecturer.account_id:
        if not User.query.get(data['account_id']):
            return jsonify({"error": "Invalid account_id, User does not exist"}), 400
        if Lecturer.query.filter_by(account_id=data['account_id']).first():
            return jsonify({"error": "Duplicate account_id, User already linked"}), 400

    try:
        if 'name' in data and data['name']:
            lecturer.name = data['name'].strip()
        if 'lecturer_code' in data:
            lecturer.lecturer_code = data['lecturer_code']
        if 'email' in data:
            lecturer.email = data['email']
        if 'phone' in data:
            lecturer.phone = data['phone']
        if 'department_id' in data:
            lecturer.department_id = data['department_id']
        if 'specialization' in data:
            lecturer.specialization = data['specialization']
        if 'account_id' in data:
            lecturer.account_id = data['account_id']
        if 'gender' in data:
            lecturer.gender = data['gender']
        if 'research_direction' in data:
            lecturer.research_direction = data['research_direction']
        if 'education_level' in data:
            lecturer.education_level = data['education_level']

        db.session.commit()
        return jsonify({"message": "Lecturer updated successfully", "lecturer": lecturer.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@giangvien_bp.route('/lecturers/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_lecturer(id):
    lecturer = Lecturer.query.get(id)
    if not lecturer:
        return jsonify({"error": "Lecturer not found"}), 404

    try:
        db.session.delete(lecturer)
        db.session.commit()
        return jsonify({"message": "Lecturer deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
