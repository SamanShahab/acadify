import datetime
from bson.objectid import ObjectId
from models.db import get_db

DEFAULT_SUBJECTS = {
    'Computer Science': ['Data Structures', 'Algorithms', 'DBMS', 'Operating Systems', 'Computer Networks', 'Software Engineering'],
    'Electrical Engineering': ['Circuit Theory', 'Signals & Systems', 'Power Systems', 'Control Systems', 'Electronics', 'Electromagnetics'],
    'Mechanical Engineering': ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing', 'Dynamics', 'Heat Transfer'],
    'Civil Engineering': ['Structural Analysis', 'Geotechnics', 'Fluid Mechanics', 'Surveying', 'Construction Management', 'Environmental Engg'],
    'Business Administration': ['Management', 'Accounting', 'Marketing', 'Finance', 'HRM', 'Business Law'],
}
DEFAULT_FALLBACK = ['Mathematics', 'Physics', 'English', 'Programming', 'Statistics', 'Project Work']


class AttendanceModel:

    @staticmethod
    def seed_subjects(student_id, department, semester):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        subjects = DEFAULT_SUBJECTS.get(department, DEFAULT_FALLBACK)
        for subj in subjects:
            existing = db.attendance_subjects.find_one({'student_id': sid, 'subject': subj})
            if not existing:
                db.attendance_subjects.insert_one({
                    'student_id': sid,
                    'subject': subj,
                    'semester': semester,
                    'total_classes': 0,
                    'attended': 0,
                    'created_at': datetime.datetime.now(datetime.timezone.utc)
                })

    @staticmethod
    def get_subjects(student_id):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        return list(db.attendance_subjects.find({'student_id': sid}).sort('subject', 1))

    @staticmethod
    def mark_attendance(student_id, subject, status, date_str=None):
        """status: 'present' or 'absent'"""
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else datetime.date.today()
        date_dt = datetime.datetime(date.year, date.month, date.day, tzinfo=datetime.timezone.utc)

        # Prevent duplicate for same subject+date
        existing = db.attendance_records.find_one({'student_id': sid, 'subject': subject, 'date': date_dt})
        if existing:
            return False, 'Attendance already marked for this subject on this date.'

        db.attendance_records.insert_one({
            'student_id': sid,
            'subject': subject,
            'status': status,
            'date': date_dt,
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        })

        # Update subject totals
        inc = {'total_classes': 1}
        if status == 'present':
            inc['attended'] = 1
        db.attendance_subjects.update_one(
            {'student_id': sid, 'subject': subject},
            {'$inc': inc}
        )

        # Recalculate overall attendance_pct on student doc
        AttendanceModel._recalculate_overall(sid)
        return True, 'Attendance marked successfully.'

    @staticmethod
    def mark_face_attendance(student_id, subject, marked_at=None):
        """Record a verified face scan in the normal attendance tracker."""
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        marked_at = marked_at or datetime.datetime.now(datetime.timezone.utc)
        date_dt = marked_at.replace(hour=0, minute=0, second=0, microsecond=0)

        subject_doc = db.attendance_subjects.find_one({'student_id': sid, 'subject': subject})
        if not subject_doc:
            db.attendance_subjects.insert_one({
                'student_id': sid,
                'subject': subject,
                'semester': 0,
                'total_classes': 0,
                'attended': 0,
                'created_at': marked_at
            })

        existing = db.attendance_records.find_one({
            'student_id': sid,
            'subject': subject,
            'date': date_dt
        })
        if existing:
            return False, 'Attendance already marked for this subject today.', existing

        record = {
            'student_id': sid,
            'subject': subject,
            'status': 'present',
            'date': date_dt,
            'marked_at': marked_at,
            'source': 'face_recognition',
            'created_at': marked_at
        }
        db.attendance_records.insert_one(record)
        db.attendance_subjects.update_one(
            {'student_id': sid, 'subject': subject},
            {'$inc': {'total_classes': 1, 'attended': 1}}
        )
        AttendanceModel._recalculate_overall(sid)
        return True, 'Attendance marked successfully.', record

    @staticmethod
    def _recalculate_overall(student_id):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        subjects = list(db.attendance_subjects.find({'student_id': sid}))
        total = sum(s.get('total_classes', 0) for s in subjects)
        attended = sum(s.get('attended', 0) for s in subjects)
        pct = round((attended / total * 100), 2) if total > 0 else 0.0
        db.students.update_one({'_id': sid}, {'$set': {'attendance_pct': pct}})

    @staticmethod
    def get_records(student_id, subject=None, limit=60):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        query = {'student_id': sid}
        if subject:
            query['subject'] = subject
        return list(db.attendance_records.find(query).sort('date', -1).limit(limit))

    @staticmethod
    def get_calendar_data(student_id):
        """Returns dict of {date_str: 'present'/'absent'} for heatmap."""
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        records = list(db.attendance_records.find({'student_id': sid}).sort('date', 1))
        cal = {}
        for r in records:
            d = r['date'].strftime('%Y-%m-%d')
            # If any present on that day, mark present
            if cal.get(d) != 'present':
                cal[d] = r['status']
        return cal

    @staticmethod
    def get_streak(student_id):
        """Returns current consecutive present-days streak."""
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        cal = AttendanceModel.get_calendar_data(sid)
        if not cal:
            return 0
        today = datetime.date.today()
        streak = 0
        check = today
        while True:
            s = cal.get(check.strftime('%Y-%m-%d'))
            if s == 'present':
                streak += 1
                check -= datetime.timedelta(days=1)
            else:
                break
        return streak
