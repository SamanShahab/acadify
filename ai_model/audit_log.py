from datetime import datetime
from bson.objectid import ObjectId
from models.db import get_db

class AuditLogModel:
    @staticmethod
    def log_action(user_name, action_type, description, details=None):
        """Record an administrative or system action in the persistent audit log database."""
        db = get_db()
        log_entry = {
            'user_name': user_name or 'System Administrator',
            'action_type': action_type,  # e.g. 'STUDENT_CREATED', 'STUDENT_UPDATED', 'STUDENT_DELETED', 'CSV_IMPORTED'
            'description': description,
            'details': details or {},
            'timestamp': datetime.utcnow()
        }
        return db.audit_logs.insert_one(log_entry).inserted_id

    @staticmethod
    def get_recent(limit=50):
        """Retrieve recent audit logs ordered by timestamp descending."""
        db = get_db()
        logs = list(db.audit_logs.find().sort('timestamp', -1).limit(limit))
        for log in logs:
            log['_id'] = str(log['_id'])
        return logs
