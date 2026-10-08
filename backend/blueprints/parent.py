from flask import Blueprint, render_template, jsonify
from flask_login import current_user, login_required

from decorators import role_required
from models.assignment import AssignmentModel
from models.attendance import AttendanceModel
from models.db import get_db
from models.prediction import PredictionModel
from models.marks import MarksModel
from models.alert import AlertModel
from models.report import ReportModel

parent_bp = Blueprint('parent', __name__, url_prefix='/parent')


@parent_bp.route('/dashboard')
@login_required
@role_required('parent')
def dashboard():
    db = get_db()
    children = list(db.students.find({'parent_ids': current_user._id}).sort('name', 1))
    for child in children:
        user = db.users.find_one({'_id': child.get('user_id')})
        child['name'] = user.get('name', 'Student') if user else 'Student'
        child['assignments'] = AssignmentModel.get_by_student(child['_id'])[:6]
        child['attendance_records'] = AttendanceModel.get_records(child['_id'], limit=10)
        child['latest_prediction'] = PredictionModel.get_latest_by_student(child['_id'])
        child['marks_analytics'] = MarksModel.get_analytics(child['_id'])
        child['alerts'] = AlertModel.get_by_student(child['_id'], limit=5)
        # Subject-level attendance
        subjects = AttendanceModel.get_subjects(child['_id'])
        child['subjects'] = [{
            'subject': s.get('subject', ''),
            'total_classes': s.get('total_classes', 0),
            'attended': s.get('attended', 0),
            'percentage': round((s.get('attended', 0) / s.get('total_classes', 1)) * 100, 1)
                          if s.get('total_classes', 0) > 0 else 0.0
        } for s in subjects]
    return render_template('parent/dashboard.html', parent=current_user, children=children)


@parent_bp.route('/api/child/<student_id>/report')
@login_required
@role_required('parent')
def child_report(student_id):
    """Parent can view their child's full report."""
    db = get_db()
    from bson.objectid import ObjectId
    try:
        sid = ObjectId(student_id)
    except Exception:
        return jsonify({'error': 'Invalid student ID'}), 400

    # Verify this child belongs to this parent
    child = db.students.find_one({'_id': sid, 'parent_ids': current_user._id})
    if not child:
        return jsonify({'error': 'Access denied'}), 403

    report = ReportModel.get_student_report(sid)
    return jsonify({'report': report})


@parent_bp.route('/api/alerts')
@login_required
@role_required('parent')
def parent_alerts():
    """Get all alerts for children linked to this parent."""
    alerts = AlertModel.get_parent_alerts(current_user._id)
    return jsonify({'alerts': alerts})


@parent_bp.route('/api/child/<student_id>/marks')
@login_required
@role_required('parent')
def child_marks(student_id):
    db = get_db()
    from bson.objectid import ObjectId
    try:
        sid = ObjectId(student_id)
    except Exception:
        return jsonify({'error': 'Invalid student ID'}), 400

    child = db.students.find_one({'_id': sid, 'parent_ids': current_user._id})
    if not child:
        return jsonify({'error': 'Access denied'}), 403

    marks = MarksModel.get_by_student(sid)
    analytics = MarksModel.get_analytics(sid)
    return jsonify({
        'marks': [{
            **m,
            '_id': str(m['_id']),
            'student_id': str(m['student_id']),
            'teacher_id': str(m.get('teacher_id') or ''),
            'created_at': m['created_at'].strftime('%Y-%m-%d') if m.get('created_at') else ''
        } for m in marks],
        'analytics': analytics
    })
