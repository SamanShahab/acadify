import datetime
from bson.objectid import ObjectId
from models.db import get_db

class StudentModel:
    @staticmethod
    def create(user_id, roll_no, department, semester, gpa=3.0, attendance_pct=85.0, risk_level="LOW", risk_score=15.0, last_prediction=None):
        db = get_db()
        doc = {
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'roll_no': roll_no.strip().upper(),
            'department': department.strip(),
            'semester': int(semester),
            'gpa': float(gpa),
            'attendance_pct': float(attendance_pct),
            'risk_level': risk_level,
            'risk_score': float(risk_score),
            'last_prediction': last_prediction or {},
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }
        res = db.students.insert_one(doc)
        doc['_id'] = res.inserted_id
        return doc

    @staticmethod
    def get_by_id(student_id):
        db = get_db()
        try:
            return db.students.find_one({'_id': ObjectId(student_id)})
        except Exception:
            return None

    @staticmethod
    def get_by_user_id(user_id):
        db = get_db()
        try:
            uid = ObjectId(user_id) if isinstance(user_id, str) else user_id
            return db.students.find_one({'user_id': uid})
        except Exception:
            return None

    @staticmethod
    def get_by_roll_no(roll_no):
        db = get_db()
        return db.students.find_one({'roll_no': roll_no.strip().upper()})

    @staticmethod
    def update(student_id, data):
        db = get_db()
        try:
            sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
            db.students.update_one({'_id': sid}, {'$set': data})
            return True
        except Exception:
            return False

    @staticmethod
    def delete(student_id):
        db = get_db()
        try:
            sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
            student = db.students.find_one({'_id': sid})
            if student and 'user_id' in student:
                db.users.delete_one({'_id': student['user_id']})
            db.students.delete_one({'_id': sid})
            return True
        except Exception:
            return False

    @staticmethod
    def get_all(query=None, limit=0, skip=0, sort_field="created_at", sort_order=-1):
        db = get_db()
        query = query or {}
        cursor = db.students.find(query).sort(sort_field, sort_order).skip(skip)
        if limit > 0:
            cursor = cursor.limit(limit)
        
        # Populate user info
        results = []
        for s in cursor:
            user = db.users.find_one({'_id': s.get('user_id')})
            s['name'] = user.get('name', 'Unknown') if user else 'Unknown'
            s['email'] = user.get('email', '') if user else ''
            results.append(s)
        return results

    @staticmethod
    def count(query=None):
        db = get_db()
        return db.students.count_documents(query or {})
