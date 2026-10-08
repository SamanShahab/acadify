import datetime
from bson.objectid import ObjectId
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from models.db import get_db

class User(UserMixin):
    def __init__(self, user_doc):
        self.id = str(user_doc['_id'])
        self._id = user_doc['_id']
        self.email = user_doc.get('email')
        self.password_hash = user_doc.get('password_hash')
        self.role = user_doc.get('role', 'student')
        self.name = user_doc.get('name', '')
        self.created_at = user_doc.get('created_at')

    @staticmethod
    def get_by_id(user_id):
        db = get_db()
        try:
            doc = db.users.find_one({'_id': ObjectId(user_id)})
            return User(doc) if doc else None
        except Exception:
            return None

    @staticmethod
    def get_by_email(email):
        db = get_db()
        doc = db.users.find_one({'email': email.strip().lower()})
        return User(doc) if doc else None

    @staticmethod
    def create(name, email, password, role='student'):
        db = get_db()
        email_clean = email.strip().lower()
        if db.users.find_one({'email': email_clean}):
            return None, "Email address is already registered."
        
        pwd_hash = generate_password_hash(password)
        doc = {
            'name': name.strip(),
            'email': email_clean,
            'password_hash': pwd_hash,
            'role': role,
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }
        res = db.users.insert_one(doc)
        doc['_id'] = res.inserted_id
        return User(doc), None

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def get_all(role=None):
        db = get_db()
        query = {'role': role} if role else {}
        cursor = db.users.find(query).sort('created_at', -1)
        return [User(doc) for doc in cursor]
