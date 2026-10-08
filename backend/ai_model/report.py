"""
ReportModel — generates daily, weekly, monthly attendance/performance reports.
Reports are calculated dynamically from real DB data.
"""
import datetime
from bson.objectid import ObjectId
from models.db import get_db


class ReportModel:

    @staticmethod
    def generate_daily(date_str=None, class_filter=None):
        """Generate a daily attendance report."""
        db = get_db()
        if not date_str:
            date_str = datetime.date.today().strftime('%Y-%m-%d')
        date_dt = datetime.datetime.strptime(date_str, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)

        records = list(db.attendance_records.find({'date': date_dt}))
        student_ids = list({r['student_id'] for r in records})

        present_ids = {r['student_id'] for r in records if r.get('status') == 'present'}
        absent_ids = {r['student_id'] for r in records if r.get('status') == 'absent'}

        total_classes = len(records)
        present_count = len([r for r in records if r.get('status') == 'present'])
        absent_count = len([r for r in records if r.get('status') == 'absent'])
        att_pct = round((present_count / total_classes * 100), 2) if total_classes > 0 else 0.0

        # Face recognition exceptions (low confidence or unrecognized)
        exceptions = list(db.face_attendance.find({
            'date': date_str,
            'status': {'$ne': 'present'}
        }).limit(20))

        return {
            'type': 'daily',
            'date': date_str,
            'total_records': total_classes,
            'present_count': present_count,
            'absent_count': absent_count,
            'attendance_percentage': att_pct,
            'unique_students': len(student_ids),
            'exceptions_count': len(exceptions),
            'generated_at': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
        }

    @staticmethod
    def generate_weekly(student_id=None):
        """Generate a weekly attendance/performance summary."""
        db = get_db()
        today = datetime.datetime.now(datetime.timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today - datetime.timedelta(days=today.weekday())
        week_end = week_start + datetime.timedelta(days=7)

        query = {'date': {'$gte': week_start, '$lt': week_end}}
        if student_id:
            sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
            query['student_id'] = sid

        records = list(db.attendance_records.find(query))
        total = len(records)
        present = len([r for r in records if r.get('status') == 'present'])
        att_pct = round((present / total * 100), 2) if total > 0 else 0.0

        # Daily breakdown
        daily = {}
        for r in records:
            d = r['date'].strftime('%A') if hasattr(r['date'], 'strftime') else 'Unknown'
            if d not in daily:
                daily[d] = {'present': 0, 'absent': 0}
            daily[d][r.get('status', 'absent')] += 1

        # Absence patterns
        absence_days = [d for d, v in daily.items() if v.get('absent', 0) > v.get('present', 0)]

        return {
            'type': 'weekly',
            'week_start': week_start.strftime('%Y-%m-%d'),
            'week_end': (week_end - datetime.timedelta(days=1)).strftime('%Y-%m-%d'),
            'total_records': total,
            'present_count': present,
            'absent_count': total - present,
            'attendance_percentage': att_pct,
            'daily_breakdown': daily,
            'absence_patterns': absence_days,
            'generated_at': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
        }

    @staticmethod
    def generate_monthly(student_id=None, year=None, month=None):
        """Generate a monthly attendance and performance report."""
        db = get_db()
        now = datetime.datetime.now(datetime.timezone.utc)
        year = year or now.year
        month = month or now.month

        month_start = datetime.datetime(year, month, 1, tzinfo=datetime.timezone.utc)
        if month == 12:
            month_end = datetime.datetime(year + 1, 1, 1, tzinfo=datetime.timezone.utc)
        else:
            month_end = datetime.datetime(year, month + 1, 1, tzinfo=datetime.timezone.utc)

        query = {'date': {'$gte': month_start, '$lt': month_end}}
        if student_id:
            sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
            query['student_id'] = sid

        records = list(db.attendance_records.find(query))
        total = len(records)
        present = len([r for r in records if r.get('status') == 'present'])
        att_pct = round((present / total * 100), 2) if total > 0 else 0.0

        # At-risk students this month
        at_risk_pipeline = [
            {'$match': {'attendance_pct': {'$lt': 75.0}}},
            {'$count': 'count'}
        ]
        at_risk_result = list(db.students.aggregate(at_risk_pipeline))
        at_risk_count = at_risk_result[0]['count'] if at_risk_result else 0

        # Frequent absences (students with > 3 absences this month)
        if not student_id:
            absence_pipeline = [
                {'$match': {'date': {'$gte': month_start, '$lt': month_end}, 'status': 'absent'}},
                {'$group': {'_id': '$student_id', 'count': {'$sum': 1}}},
                {'$match': {'count': {'$gt': 3}}},
                {'$sort': {'count': -1}},
                {'$limit': 10}
            ]
            frequent_absences = list(db.attendance_records.aggregate(absence_pipeline))
            for fa in frequent_absences:
                student = db.students.find_one({'_id': fa['_id']})
                if student:
                    user = db.users.find_one({'_id': student.get('user_id')})
                    fa['student_name'] = user.get('name', 'Unknown') if user else 'Unknown'
                    fa['roll_no'] = student.get('roll_no', '')
                fa['_id'] = str(fa['_id'])
        else:
            frequent_absences = []

        return {
            'type': 'monthly',
            'year': year,
            'month': month,
            'month_name': month_start.strftime('%B %Y'),
            'total_records': total,
            'present_count': present,
            'absent_count': total - present,
            'attendance_percentage': att_pct,
            'at_risk_students': at_risk_count,
            'frequent_absences': frequent_absences,
            'generated_at': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
        }

    @staticmethod
    def get_student_report(student_id):
        """Full report for a single student (for parent/student view)."""
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        student = db.students.find_one({'_id': sid})
        if not student:
            return None

        user = db.users.find_one({'_id': student.get('user_id')})
        subjects = list(db.attendance_subjects.find({'student_id': sid}))

        # Subject-level attendance
        subject_data = []
        for s in subjects:
            total = s.get('total_classes', 0)
            attended = s.get('attended', 0)
            pct = round((attended / total * 100), 2) if total > 0 else 0.0
            subject_data.append({
                'subject': s.get('subject', ''),
                'total_classes': total,
                'attended': attended,
                'percentage': pct,
                'status': 'critical' if pct < 70 else ('warning' if pct < 75 else 'good')
            })

        # Marks analytics
        from models.marks import MarksModel
        marks_analytics = MarksModel.get_analytics(sid)

        # Recent alerts
        from models.alert import AlertModel
        alerts = AlertModel.get_by_student(sid, limit=10)

        return {
            'student_name': user.get('name', 'Unknown') if user else 'Unknown',
            'roll_no': student.get('roll_no', ''),
            'department': student.get('department', ''),
            'semester': student.get('semester', 1),
            'overall_attendance': round(student.get('attendance_pct', 0), 2),
            'risk_level': student.get('risk_level', 'LOW'),
            'subjects': subject_data,
            'marks_analytics': marks_analytics,
            'alerts': alerts,
            'generated_at': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
        }
