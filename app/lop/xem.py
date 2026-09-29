from flask import render_template, request, jsonify
from . import lop_bp
from models import Lop, db
from auth import login_required, role_required

@lop_bp.route('/lop', methods=['GET'])
@login_required
@role_required(2)
def get_lop_list():
    if request.headers.get('Accept') == 'application/json' or request.is_json or request.headers.get('Sec-Fetch-Dest') == 'empty':
        search_name = request.args.get('name', '').strip().lower()
        search_code = request.args.get('ml', '').strip()

        query = Lop.query
        if search_name:
            query = query.filter(db.func.lower(Lop.name).like(f"%{search_name}%"))
        if search_code:
            query = query.filter(Lop.class_code == search_code)

        items = query.all()
        return jsonify([item.to_dict() for item in items]), 200

    return render_template('lop.html')

@lop_bp.route('/lop/<int:id>', methods=['GET'])
@login_required
@role_required(2)
def get_lop_by_id(id):
    try:
        item = Lop.query.get(id)
        if not item:
            return jsonify({"error": "Lop not found"}), 404
        return jsonify(item.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
