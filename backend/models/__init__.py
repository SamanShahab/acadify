# models/__init__.py
# Thin re-export layer. Each models/X.py shim imports from ai_model.X directly.
# Do NOT import from ai_model here — that causes circular imports because
# ai_model/*.py files all do "from models.db import get_db".
from models.db import mongo, get_db
from models.user import User
from models.student import StudentModel
from models.prediction import PredictionModel
from models.department import DepartmentModel
from models.notification import NotificationModel
from models.audit_log import AuditLogModel
from models.attendance import AttendanceModel
from models.timetable import TimetableModel
from models.assignment import AssignmentModel
from models.counseling import CounselingModel
from models.activity import ActivityModel
from models.intervention import InterventionModel
from models.exam import ExamModel
from models.notes import NotesModel
