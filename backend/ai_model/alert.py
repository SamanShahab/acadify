"""
Attendance Alert Engine
Checks:
  - attendance < 75% → warning alert
  - attendance < 70% → critical alert
  - 3 consecutive absences → parent notification
Prevents duplicate alerts for the same event.
"""
import datetime
from bson.objectid import ObjectId
from models.db import get_db

WARNING_THRESHOLD = 75.0
CRITICAL_THRESHOLD = 70.0
CONSECUTIVE_ABSENCE_LIMIT = 3


class AlertModel:

    @staticmethod
    def _already_sent(student_id, alert_type, window_days=7):
        """Prevent duplicate alerts within a time window."""
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=window_days)
        return db.attendance_alerts.find_one({
            'student_id': sid,
            'alert_type': alert_type,
            'created_at': {'$gte': cutoff}
        }) is not None

    @staticmethod
    def create_alert(student_id, alert_type, message, severity='warning'):
        """severity: 'warning' | 'critical' | 'info'"""
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        doc = {
            'student_id': sid,
            'alert_type': alert_type,
            'message': message,
            'severity': severity,
            'read': False,
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }
        db.attendance_alerts.insert_one(doc)
        return doc

    @staticmethod
    def get_by_student(student_id, limit=20):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        alerts = list(db.attendance_alerts.find({'student_id': sid}).sort('created_at', -1).limit(limit))
        for a in alerts:
            a['_id'] = str(a['_id'])
            if a.get('created_at'):
                a['created_at'] = a['created_at'].strftime('%Y-%m-%d %H:%M')
        return alerts

    @staticmethod
    def get_unread_count(student_id):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        return db.attendance_alerts.count_documents({'student_id': sid, 'read': False})

    @staticmethod
    def mark_read(student_id):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        db.attendance_alerts.update_many({'student_id': sid, 'read': False}, {'$set': {'read': True}})

    @staticmethod
    def check_and_fire(student_id):
        """
        Run all alert checks for a student after attendance is updated.
        Returns list of new alerts fired.
        """
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        student = db.students.find_one({'_id': sid})
        if not student:
            return []

        fired = []
        att_pct = float(student.get('attendance_pct', 100.0))

        # ── Critical alert < 70% ──────────────────────────────────────────────
        if att_pct < CRITICAL_THRESHOLD:
            if not AlertModel._already_sent(sid, 'critical_attendance', window_days=3):
                msg = (f"CRITICAL: Your attendance is {att_pct:.1f}%, which is below the "
                       f"{CRITICAL_THRESHOLD}% minimum requirement. Immediate action required.")
                AlertModel.create_alert(sid, 'critical_attendance', msg, severity='critical')
                # Also push to notifications
                from models.notification import NotificationModel
                NotificationModel.create(sid, msg, 'warning')
                fired.append({'type': 'critical_attendance', 'message': msg})

        # ── Warning alert < 75% ───────────────────────────────────────────────
        elif att_pct < WARNING_THRESHOLD:
            if not AlertModel._already_sent(sid, 'warning_attendance', window_days=3):
                msg = (f"WARNING: Your attendance is {att_pct:.1f}%, which is below the "
                       f"{WARNING_THRESHOLD}% recommended threshold.")
                AlertModel.create_alert(sid, 'warning_attendance', msg, severity='warning')
                from models.notification import NotificationModel
                NotificationModel.create(sid, msg, 'warning')
                fired.append({'type': 'warning_attendance', 'message': msg})

        # ── 3 consecutive absences ────────────────────────────────────────────
        consecutive = AlertModel._count_consecutive_absences(sid)
        if consecutive >= CONSECUTIVE_ABSENCE_LIMIT:
            if not AlertModel._already_sent(sid, 'consecutive_absence', window_days=2):
                msg = (f"ALERT: {consecutive} consecutive absences detected. "
                       f"Parents/guardians have been notified.")
                AlertModel.create_alert(sid, 'consecutive_absence', msg, severity='critical')
                from models.notification import NotificationModel
                NotificationModel.create(sid, msg, 'warning')
                # Notify parents
                AlertModel._notify_parents(sid, student, consecutive)
                fired.append({'type': 'consecutive_absence', 'message': msg})

        return fired

    @staticmethod
    def _count_consecutive_absences(student_id):
        """Count how many consecutive absences the student has (most recent first)."""
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        records = list(db.attendance_records.find({'student_id': sid}).sort('date', -1).limit(20))
        if not records:
            return 0
        # Group by date, check if all subjects on that date were absent
        from collections import defaultdict
        by_date = defaultdict(list)
        for r in records:
            date_key = r['date'].strftime('%Y-%m-%d') if hasattr(r['date'], 'strftime') else str(r['date'])[:10]
            by_date[date_key].append(r.get('status', 'absent'))

        consecutive = 0
        for date_key in sorted(by_date.keys(), reverse=True):
            statuses = by_date[date_key]
            if all(s == 'absent' for s in statuses):
                consecutive += 1
            else:
                break
        return consecutive

    @staticmethod
    def _notify_parents(student_id, student, consecutive_count):
        """Send notification to all linked parents."""
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        user = db.users.find_one({'_id': student.get('user_id')})
        student_name = user.get('name', 'Your child') if user else 'Your child'

        parent_ids = student.get('parent_ids', [])
        if not parent_ids:
            return

        from models.notification import NotificationModel
        msg = (f"Parent Alert: {student_name} ({student.get('roll_no', '')}) has been absent "
               f"for {consecutive_count} consecutive classes. Please contact the school.")
        # Store as a parent-targeted notification using student_id as reference
        # (parents see their child's notifications via the parent dashboard)
        db.parent_alerts.insert_one({
            'student_id': sid,
            'parent_ids': parent_ids,
            'message': msg,
            'severity': 'critical',
            'read': False,
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        })

    @staticmethod
    def get_parent_alerts(parent_id, limit=20):
        """Get alerts for all children of a parent."""
        db = get_db()
        pid = ObjectId(parent_id) if isinstance(parent_id, str) else parent_id
        # Find all students linked to this parent
        children = list(db.students.find({'parent_ids': pid}))
        if not children:
            return []
        child_ids = [c['_id'] for c in children]
        alerts = list(db.parent_alerts.find(
            {'student_id': {'$in': child_ids}}
        ).sort('created_at', -1).limit(limit))
        for a in alerts:
            a['_id'] = str(a['_id'])
            if a.get('created_at'):
                a['created_at'] = a['created_at'].strftime('%Y-%m-%d %H:%M')
            # Attach student name
            child = next((c for c in children if c['_id'] == a.get('student_id')), None)
            if child:
                user = db.users.find_one({'_id': child.get('user_id')})
                a['student_name'] = user.get('name', 'Unknown') if user else 'Unknown'
                a['roll_no'] = child.get('roll_no', '')
        return alerts

    @staticmethod
    def get_at_risk_students(limit=50):
        """Return students with attendance below warning threshold."""
        db = get_db()
        students = list(db.students.find(
            {'attendance_pct': {'$lt': WARNING_THRESHOLD}}
        ).sort('attendance_pct', 1).limit(limit))
        result = []
        for s in students:
            user = db.users.find_one({'_id': s.get('user_id')})
            result.append({
                '_id': str(s['_id']),
                'name': user.get('name', 'Unknown') if user else 'Unknown',
                'roll_no': s.get('roll_no', ''),
                'department': s.get('department', ''),
                'attendance_pct': round(s.get('attendance_pct', 0), 2),
                'risk_level': s.get('risk_level', 'LOW'),
                'severity': 'critical' if s.get('attendance_pct', 0) < CRITICAL_THRESHOLD else 'warning'
            })
        return result
