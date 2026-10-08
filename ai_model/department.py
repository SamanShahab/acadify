from bson.objectid import ObjectId
from models.db import get_db

class DepartmentModel:
    @staticmethod
    def create(name, total_students=0, avg_gpa=0.0, avg_attendance=0.0):
        db = get_db()
        doc = {
            'name': name.strip(),
            'total_students': int(total_students),
            'avg_gpa': float(avg_gpa),
            'avg_attendance': float(avg_attendance)
        }
        res = db.departments.insert_one(doc)
        doc['_id'] = res.inserted_id
        return doc

    @staticmethod
    def get_all():
        db = get_db()
        return list(db.departments.find().sort('name', 1))

    @staticmethod
    def get_by_name(name):
        db = get_db()
        return db.departments.find_one({'name': name.strip()})

    @staticmethod
    def recalculate_stats():
        """Recalculate total students, avg GPA, and avg attendance per department from students collection."""
        db = get_db()
        pipeline = [
            {
                '$group': {
                    '_id': '$department',
                    'total_students': {'$sum': 1},
                    'avg_gpa': {'$avg': '$gpa'},
                    'avg_attendance': {'$avg': '$attendance_pct'}
                }
            }
        ]
        stats = list(db.students.aggregate(pipeline))
        for stat in stats:
            dept_name = stat['_id']
            if not dept_name:
                continue
            db.departments.update_one(
                {'name': dept_name},
                {'$set': {
                    'total_students': stat['total_students'],
                    'avg_gpa': round(stat['avg_gpa'], 2),
                    'avg_attendance': round(stat['avg_attendance'], 1)
                }},
                upsert=True
            )
