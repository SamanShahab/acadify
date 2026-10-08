import datetime
from bson.objectid import ObjectId
from models.db import get_db

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

DEFAULT_TIMETABLE = {
    'Computer Science': [
        {'day': 'Monday',    'time': '08:00', 'subject': 'Data Structures',    'room': 'CS-101'},
        {'day': 'Monday',    'time': '10:00', 'subject': 'Algorithms',         'room': 'CS-102'},
        {'day': 'Tuesday',   'time': '08:00', 'subject': 'DBMS',               'room': 'CS-Lab1'},
        {'day': 'Tuesday',   'time': '10:00', 'subject': 'Operating Systems',  'room': 'CS-103'},
        {'day': 'Wednesday', 'time': '08:00', 'subject': 'Computer Networks',  'room': 'CS-104'},
        {'day': 'Thursday',  'time': '08:00', 'subject': 'Software Engineering','room': 'CS-105'},
        {'day': 'Friday',    'time': '10:00', 'subject': 'Data Structures',    'room': 'CS-101'},
    ],
    'default': [
        {'day': 'Monday',    'time': '08:00', 'subject': 'Mathematics',   'room': 'Room-101'},
        {'day': 'Monday',    'time': '10:00', 'subject': 'Physics',        'room': 'Room-102'},
        {'day': 'Tuesday',   'time': '08:00', 'subject': 'English',        'room': 'Room-103'},
        {'day': 'Wednesday', 'time': '08:00', 'subject': 'Programming',    'room': 'Lab-1'},
        {'day': 'Thursday',  'time': '08:00', 'subject': 'Statistics',     'room': 'Room-104'},
        {'day': 'Friday',    'time': '10:00', 'subject': 'Project Work',   'room': 'Lab-2'},
    ]
}


class TimetableModel:

    @staticmethod
    def seed_default(student_id, department):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        if db.timetable.find_one({'student_id': sid}):
            return
        slots = DEFAULT_TIMETABLE.get(department, DEFAULT_TIMETABLE['default'])
        for slot in slots:
            db.timetable.insert_one({
                'student_id': sid,
                'day': slot['day'],
                'time': slot['time'],
                'subject': slot['subject'],
                'room': slot['room'],
                'created_at': datetime.datetime.now(datetime.timezone.utc)
            })

    @staticmethod
    def get_timetable(student_id):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        slots = list(db.timetable.find({'student_id': sid}).sort('time', 1))
        # Group by day
        grouped = {day: [] for day in DAYS}
        for s in slots:
            if s['day'] in grouped:
                grouped[s['day']].append(s)
        return grouped

    @staticmethod
    def add_slot(student_id, day, time, subject, room, teacher_id=None):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        db.timetable.insert_one({
            'student_id': sid,
            'teacher_id': ObjectId(teacher_id) if teacher_id else None,
            'day': day, 'time': time,
            'subject': subject, 'room': room,
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        })

    @staticmethod
    def delete_slot(slot_id):
        db = get_db()
        db.timetable.delete_one({'_id': ObjectId(slot_id)})

    @staticmethod
    def get_today_classes(student_id):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        today = datetime.date.today().strftime('%A')
        return list(db.timetable.find({'student_id': sid, 'day': today}).sort('time', 1))
