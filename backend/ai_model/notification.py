import datetime
from bson.objectid import ObjectId
from models.db import get_db

class NotificationModel:
    @staticmethod
    def create(student_id, message, notif_type="info"):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        doc = {
            'student_id': sid,
            'message': message,
            'type': notif_type,  # 'info', 'warning', 'alert', 'success'
            'read': False,
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }
        res = db.notifications.insert_one(doc)
        doc['_id'] = res.inserted_id
        return doc

    @staticmethod
    def get_by_student(student_id, limit=20):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        return list(db.notifications.find({'student_id': sid}).sort('created_at', -1).limit(limit))

    @staticmethod
    def mark_as_read(notification_id):
        db = get_db()
        try:
            nid = ObjectId(notification_id) if isinstance(notification_id, str) else notification_id
            db.notifications.update_one({'_id': nid}, {'$set': {'read': True}})
            return True
        except Exception:
            return False

    @staticmethod
    def get_unread_count(student_id):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        return db.notifications.count_documents({'student_id': sid, 'read': False})
