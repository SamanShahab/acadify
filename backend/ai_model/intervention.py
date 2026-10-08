import datetime
from bson.objectid import ObjectId
from models.db import get_db


class InterventionModel:

    @staticmethod
    def create(student_id, admin_name, intervention_type, notes):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        doc = {
            'student_id': sid,
            'admin_name': admin_name,
            'intervention_type': intervention_type,  # counseling / warning / academic_plan / parent_contact
            'notes': notes,
            'status': 'active',   # active / completed / follow_up
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }
        res = db.interventions.insert_one(doc)
        doc['_id'] = res.inserted_id
        return doc

    @staticmethod
    def get_by_student(student_id):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        return list(db.interventions.find({'student_id': sid}).sort('created_at', -1))

    @staticmethod
    def get_all(limit=100):
        db = get_db()
        records = list(db.interventions.find().sort('created_at', -1).limit(limit))
        for r in records:
            student = db.students.find_one({'_id': r['student_id']})
            if student:
                user = db.users.find_one({'_id': student.get('user_id')})
                r['student_name'] = user.get('name', 'Unknown') if user else 'Unknown'
                r['roll_no'] = student.get('roll_no', '')
                r['department'] = student.get('department', '')
                r['risk_level'] = student.get('risk_level', 'LOW')
            else:
                r['student_name'] = 'Unknown'
                r['roll_no'] = ''
                r['department'] = ''
                r['risk_level'] = 'LOW'
        return records

    @staticmethod
    def update_status(intervention_id, status):
        db = get_db()
        iid = ObjectId(intervention_id) if isinstance(intervention_id, str) else intervention_id
        db.interventions.update_one({'_id': iid}, {'$set': {'status': status}})

    @staticmethod
    def count_active():
        db = get_db()
        return db.interventions.count_documents({'status': 'active'})
