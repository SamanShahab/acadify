import datetime
from bson.objectid import ObjectId
from models.db import get_db


class ActivityModel:

    @staticmethod
    def log(event_type, title, description, student_id=None, meta=None):
        """
        event_type: 'registration' | 'prediction' | 'attendance' | 'counseling' | 'assignment' | 'login'
        """
        db = get_db()
        doc = {
            'event_type': event_type,
            'title': title,
            'description': description,
            'student_id': ObjectId(student_id) if student_id else None,
            'meta': meta or {},
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }
        db.activity_feed.insert_one(doc)

    @staticmethod
    def get_recent(limit=20):
        db = get_db()
        events = list(db.activity_feed.find().sort('created_at', -1).limit(limit))
        for e in events:
            e['_id'] = str(e['_id'])
            if e.get('student_id'):
                student = db.students.find_one({'_id': e['student_id']})
                if student:
                    user = db.users.find_one({'_id': student.get('user_id')})
                    e['student_name'] = user.get('name', 'Unknown') if user else 'Unknown'
                    e['roll_no'] = student.get('roll_no', '')
                else:
                    e['student_name'] = 'Unknown'
                    e['roll_no'] = ''
            e['created_at'] = e['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        return events

    @staticmethod
    def get_stats_last_7_days():
        """Returns daily event counts for last 7 days."""
        db = get_db()
        from datetime import timedelta
        today = datetime.datetime.now(datetime.timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        result = []
        for i in range(6, -1, -1):
            day_start = today - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            count = db.activity_feed.count_documents({'created_at': {'$gte': day_start, '$lt': day_end}})
            result.append({'date': day_start.strftime('%b %d'), 'count': count})
        return result
