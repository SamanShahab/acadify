import datetime
from bson.objectid import ObjectId
from models.db import get_db


class CounselingModel:

    @staticmethod
    def create(student_id, subject, message, urgency='normal', metadata=None):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        doc = {
            'student_id': sid,
            'subject': subject,
            'message': message,
            'urgency': urgency,          # low / normal / high
            'status': 'open',            # open / in_review / resolved
            'admin_reply': None,
            'replied_by': None,
            'replied_at': None,
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }
        if metadata:
            doc.update(metadata)
        res = db.counseling.insert_one(doc)
        doc['_id'] = res.inserted_id
        return doc

    @staticmethod
    def get_by_student(student_id, limit=20):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        return list(db.counseling.find({'student_id': sid}).sort('created_at', -1).limit(limit))

    @staticmethod
    def get_all(status=None, limit=100):
        db = get_db()
        query = {}
        if status:
            query['status'] = status
        requests = list(db.counseling.find(query).sort('created_at', -1).limit(limit))
        for r in requests:
            student = db.students.find_one({'_id': r['student_id']})
            if student:
                user = db.users.find_one({'_id': student.get('user_id')})
                r['student_name'] = user.get('name', 'Unknown') if user else 'Unknown'
                r['roll_no'] = student.get('roll_no', '')
                r['department'] = student.get('department', '')
            else:
                r['student_name'] = 'Unknown'
                r['roll_no'] = ''
                r['department'] = ''
        return requests

    @staticmethod
    def reply(request_id, admin_reply, replied_by):
        db = get_db()
        rid = ObjectId(request_id) if isinstance(request_id, str) else request_id
        db.counseling.update_one({'_id': rid}, {'$set': {
            'admin_reply': admin_reply,
            'replied_by': replied_by,
            'replied_at': datetime.datetime.now(datetime.timezone.utc),
            'status': 'resolved'
        }})

    @staticmethod
    def update_status(request_id, status):
        db = get_db()
        rid = ObjectId(request_id) if isinstance(request_id, str) else request_id
        db.counseling.update_one({'_id': rid}, {'$set': {'status': status}})

    @staticmethod
    def count_open():
        db = get_db()
        return db.counseling.count_documents({'status': 'open'})
