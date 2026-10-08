import datetime
from bson.objectid import ObjectId
from models.db import get_db


class AssignmentModel:

    @staticmethod
    def create(student_id, title, subject, due_date_str, priority='medium', description=''):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        due = datetime.datetime.strptime(due_date_str, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
        doc = {
            'student_id': sid,
            'title': title,
            'subject': subject,
            'due_date': due,
            'priority': priority,  # low / medium / high
            'description': description,
            'status': 'pending',   # pending / in_progress / completed
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }
        res = db.assignments.insert_one(doc)
        doc['_id'] = res.inserted_id
        return doc

    @staticmethod
    def get_by_student(student_id):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        return list(db.assignments.find({'student_id': sid}).sort('due_date', 1))

    @staticmethod
    def update_status(assignment_id, status):
        db = get_db()
        db.assignments.update_one({'_id': ObjectId(assignment_id)}, {'$set': {'status': status}})

    @staticmethod
    def delete(assignment_id):
        db = get_db()
        db.assignments.delete_one({'_id': ObjectId(assignment_id)})

    @staticmethod
    def get_upcoming(student_id, days=7):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        now = datetime.datetime.now(datetime.timezone.utc)
        deadline = now + datetime.timedelta(days=days)
        return list(db.assignments.find({
            'student_id': sid,
            'status': {'$ne': 'completed'},
            'due_date': {'$gte': now, '$lte': deadline}
        }).sort('due_date', 1))
