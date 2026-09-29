from flask import render_template, request, jsonify
from . import lop_bp
from models import Lop
from auth import login_required, role_required
from sqlalchemy import and_

@lop_bp.route('/lop', methods=['GET'])
@login_required
@role_required(2)
def get_lop_list():
    if request.headers.get('Accept') == 'application/json' or request.is_json:
        ml = request.args.get('ml', '').strip()
        name = request.args.get('name', '').strip()

        query = Lop.query
        conditions = []
        if ml:
            conditions.append(Lop.class_code.ilike(f"%{ml}%"))
        if name:
            conditions.append(Lop.name.ilike(f"%{name}%"))

        if conditions:
            query = query.filter(and_(*conditions))

        items = query.all()
        return jsonify([item.to_dict() for item in items]), 200

    return render_template('lop.html')

@lop_bp.route('/lop/<int:id>', methods=['GET'])
@login_required
@role_required(2)
def get_lop_detail(id):
    item = Lop.query.get(id)
    if item:
        return jsonify(item.to_dict()), 200
    return jsonify({'error': 'Lop not found'}), 404
