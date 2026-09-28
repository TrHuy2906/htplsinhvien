import traceback
from functools import wraps
from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for, current_app
from database import db
from models import User

auth_bp = Blueprint('auth', __name__)

def login_required(f):
    """Decorator yêu cầu người dùng phải đăng nhập trước khi truy cập route."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            if request.is_json or request.path.startswith('/students') or 'application/json' in request.headers.get('Accept', ''):
                return jsonify({'error': 'Unauthorized: Login required'}), 401
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(*allowed_roles):
    """Decorator yêu cầu người dùng phải có vai trò (role) được chỉ định."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not session.get('user_id'):
                if request.is_json or request.path.startswith('/students') or 'application/json' in request.headers.get('Accept', ''):
                    return jsonify({'error': 'Unauthorized: Login required'}), 401
                return redirect(url_for('auth.login'))
            user_role = session.get('role')
            if user_role not in allowed_roles:
                return jsonify({'error': 'Forbidden: Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def create_user(username: str, password: str, role: int = 0) -> bool:
    """Tạo người dùng mới với username, password và role đã cho.
    Trả về True nếu tạo thành công, False nếu user đã tồn tại hoặc có lỗi.
    """
    try:
        if User.query.filter_by(username=username).first():
            return False
        user = User(username=username, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return True
    except Exception as e:
        current_app.logger.error(f"Error creating user: {e}\n{traceback.format_exc()}")
        return False

def authenticate(username: str, password: str):
    """Xác thực người dùng. Trả về đối tượng User nếu hợp lệ, ngược lại trả về None."""
    try:
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            return user
        return None
    except Exception as e:
        current_app.logger.error(f"Authentication error: {e}\n{traceback.format_exc()}")
        return None

# Route xử lý Đăng nhập
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json(force=True, silent=True) or request.form
        username = data.get('username', '').strip()
        password = data.get('password', '')
        user = authenticate(username, password)
        if user:
            session['user_id'] = user.id
            session['username'] = user.username
            session['role'] = user.role
            return jsonify({'message': 'Login successful'}), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    else:
        return render_template('login.html')

# Route xử lý Đăng xuất
@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))
