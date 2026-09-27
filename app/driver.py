import traceback
from flask import current_app

def create_user(username: str, password: str) -> bool:
    """Create a new user with the given username and password.
    Returns True if the user was created, False if the user already exists or on error.
    """
    try:
        # Import inside function to avoid circular imports
        from app import db, User
        if User.query.filter_by(username=username).first():
            return False
        user = User(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return True
    except Exception as e:
        # Log the error for debugging purposes
        current_app.logger.error(f"Error creating user: {e}\n{traceback.format_exc()}")
        return False

def authenticate(username: str, password: str):
    """Authenticate a user. Returns the User object if credentials are valid, otherwise None."""
    try:
        from app import User
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            return user
        return None
    except Exception as e:
        current_app.logger.error(f"Authentication error: {e}\n{traceback.format_exc()}")
        return None
