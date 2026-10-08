from functools import wraps
from flask import flash, redirect, url_for, request, jsonify
from flask_login import current_user

def role_required(*roles):
    """
    Decorator to restrict route access to specific roles.
    Example: @role_required('admin') or @role_required('admin', 'student')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                if request.is_json or request.headers.get('Accept') == 'application/json' or request.path.startswith('/api/'):
                    return jsonify({'error': 'Authentication required', 'redirect': '/login'}), 401
                flash('Please log in to access this page.', 'warning')
                return redirect(url_for('auth.login', next=request.url))
            
            if current_user.role not in roles:
                if request.is_json or request.headers.get('Accept') == 'application/json' or request.path.startswith('/api/'):
                    return jsonify({'error': 'Access denied', 'required_roles': list(roles)}), 403
                flash('Access denied. You do not have permission to view this resource.', 'danger')
                if current_user.role == 'admin':
                    return redirect(url_for('admin.dashboard'))
                elif current_user.role == 'student':
                    return redirect(url_for('student.dashboard'))
                elif current_user.role == 'teacher':
                    return redirect(url_for('teacher.dashboard'))
                elif current_user.role == 'parent':
                    return redirect(url_for('parent.dashboard'))
                return redirect(url_for('main.index'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
