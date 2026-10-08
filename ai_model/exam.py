import datetime
from bson.objectid import ObjectId
from models.db import get_db


class ExamModel:

    @staticmethod
    def create(student_id, subject, exam_type, exam_date, venue='', notes=''):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        doc = {
            'student_id': sid,
            'subject': subject,
            'exam_type': exam_type,   # mid / final / quiz / lab
            'exam_date': exam_date,   # stored as string YYYY-MM-DD HH:MM
            'venue': venue,
            'notes': notes,
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }
        res = db.exams.insert_one(doc)
        doc['_id'] = res.inserted_id
        return doc

    @staticmethod
    def get_by_student(student_id, upcoming_only=False):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        query = {'student_id': sid}
        exams = list(db.exams.find(query).sort('exam_date', 1))
        if upcoming_only:
            today = datetime.date.today().strftime('%Y-%m-%d')
            exams = [e for e in exams if e.get('exam_date', '') >= today]
        return exams

    @staticmethod
    def delete(exam_id):
        db = get_db()
        eid = ObjectId(exam_id) if isinstance(exam_id, str) else exam_id
        db.exams.delete_one({'_id': eid})
