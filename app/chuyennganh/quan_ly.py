from flask import request, jsonify
from . import chuyennganh_bp
from models import ChuyenNganh, Khoa, db
from auth import login_required, role_required

@chuyennganh_bp.route('/chuyennganh', methods=['POST'])
@login_required
@role_required(2)
def add_chuyennganh():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('major_code') or not data.get('faculty_id'):
        return jsonify({"error": "Missing required field: major_code, name, faculty_id"}), 400

    major_code = data.get('major_code').strip()
    name = data.get('name').strip()
    faculty_id = data.get('faculty_id')

    if ChuyenNganh.query.filter_by(major_code=major_code).first():
        return jsonify({"error": "Duplicate major_code"}), 400

    if not Khoa.query.get(faculty_id):
        return jsonify({"error": "faculty_id does not exist"}), 400

    try:
        new_item = ChuyenNganh(
            major_code=major_code,
            name=name,
            faculty_id=faculty_id
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify({"message": "ChuyenNganh created successfully", "chuyennganh": new_item.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@chuyennganh_bp.route('/chuyennganh/<int:id>', methods=['PUT'])
@login_required
@role_required(2)
def update_chuyennganh(id):
    item = ChuyenNganh.query.get(id)
    if not item:
        return jsonify({"error": "ChuyenNganh not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if 'major_code' in data and data['major_code'] and data['major_code'] != item.major_code:
        if ChuyenNganh.query.filter_by(major_code=data['major_code']).first():
            return jsonify({"error": "Duplicate major_code"}), 400

    if 'faculty_id' in data and data['faculty_id'] and data['faculty_id'] != item.faculty_id:
        if not Khoa.query.get(data['faculty_id']):
            return jsonify({"error": "faculty_id does not exist"}), 400

    try:
        if 'name' in data and data['name']:
            item.name = data['name'].strip()
        if 'major_code' in data and data['major_code']:
            item.major_code = data['major_code'].strip()
        if 'faculty_id' in data and data['faculty_id']:
            item.faculty_id = data['faculty_id']

        db.session.commit()
        return jsonify({"message": "ChuyenNganh updated successfully", "chuyennganh": item.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
