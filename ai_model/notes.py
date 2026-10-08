import datetime
from bson.objectid import ObjectId
from models.db import get_db


class NotesModel:

    @staticmethod
    def save(student_id, subject, content):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        db.notes.update_one(
            {'student_id': sid, 'subject': subject},
            {'$set': {
                'content': content,
                'updated_at': datetime.datetime.now(datetime.timezone.utc)
            }, '$setOnInsert': {
                'student_id': sid,
                'subject': subject,
                'created_at': datetime.datetime.now(datetime.timezone.utc)
            }},
            upsert=True
        )

    @staticmethod
    def get_by_student(student_id):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        return list(db.notes.find({'student_id': sid}).sort('updated_at', -1))

    @staticmethod
    def get_by_subject(student_id, subject):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        return db.notes.find_one({'student_id': sid, 'subject': subject})

    @staticmethod
    def delete(student_id, subject):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        db.notes.delete_one({'student_id': sid, 'subject': subject})
