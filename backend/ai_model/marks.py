import datetime
from bson.objectid import ObjectId
from models.db import get_db


class MarksModel:

    @staticmethod
    def create(student_id, subject, assessment_type, title, score, max_score, teacher_id=None, notes=''):
        """
        assessment_type: 'quiz' | 'assignment' | 'test' | 'exam' | 'participation'
        """
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        percentage = round((float(score) / float(max_score)) * 100, 2) if float(max_score) > 0 else 0.0
        doc = {
            'student_id': sid,
            'subject': subject,
            'assessment_type': assessment_type,
            'title': title,
            'score': float(score),
            'max_score': float(max_score),
            'percentage': percentage,
            'teacher_id': ObjectId(teacher_id) if teacher_id else None,
            'notes': notes,
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }
        res = db.marks.insert_one(doc)
        doc['_id'] = res.inserted_id
        return doc

    @staticmethod
    def get_by_student(student_id, subject=None, assessment_type=None, limit=100):
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        query = {'student_id': sid}
        if subject:
            query['subject'] = subject
        if assessment_type:
            query['assessment_type'] = assessment_type
        return list(db.marks.find(query).sort('created_at', -1).limit(limit))

    @staticmethod
    def get_analytics(student_id):
        """Returns per-subject and overall performance analytics."""
        db = get_db()
        sid = ObjectId(student_id) if isinstance(student_id, str) else student_id
        all_marks = list(db.marks.find({'student_id': sid}))
        if not all_marks:
            return {'overall_avg': None, 'subjects': {}, 'by_type': {}, 'total_assessments': 0}

        # Per-subject breakdown
        subjects = {}
        for m in all_marks:
            subj = m.get('subject', 'Unknown')
            if subj not in subjects:
                subjects[subj] = {'scores': [], 'percentages': [], 'assessments': []}
            subjects[subj]['scores'].append(m.get('score', 0))
            subjects[subj]['percentages'].append(m.get('percentage', 0))
            subjects[subj]['assessments'].append({
                '_id': str(m['_id']),
                'title': m.get('title', ''),
                'type': m.get('assessment_type', ''),
                'score': m.get('score', 0),
                'max_score': m.get('max_score', 0),
                'percentage': m.get('percentage', 0),
                'date': m.get('created_at').strftime('%Y-%m-%d') if m.get('created_at') else ''
            })

        subject_analytics = {}
        for subj, data in subjects.items():
            percs = data['percentages']
            subject_analytics[subj] = {
                'avg_percentage': round(sum(percs) / len(percs), 2),
                'highest': round(max(percs), 2),
                'lowest': round(min(percs), 2),
                'count': len(percs),
                'assessments': data['assessments']
            }

        # By assessment type
        by_type = {}
        for m in all_marks:
            atype = m.get('assessment_type', 'other')
            if atype not in by_type:
                by_type[atype] = []
            by_type[atype].append(m.get('percentage', 0))
        by_type_avg = {t: round(sum(v) / len(v), 2) for t, v in by_type.items()}

        all_percs = [m.get('percentage', 0) for m in all_marks]
        return {
            'overall_avg': round(sum(all_percs) / len(all_percs), 2),
            'highest': round(max(all_percs), 2),
            'lowest': round(min(all_percs), 2),
            'total_assessments': len(all_marks),
            'subjects': subject_analytics,
            'by_type': by_type_avg
        }

    @staticmethod
    def delete(mark_id):
        db = get_db()
        db.marks.delete_one({'_id': ObjectId(mark_id)})

    @staticmethod
    def get_class_analytics(student_ids, subject=None):
        """Analytics across multiple students (for teacher view)."""
        db = get_db()
        sids = [ObjectId(s) if isinstance(s, str) else s for s in student_ids]
        query = {'student_id': {'$in': sids}}
        if subject:
            query['subject'] = subject
        all_marks = list(db.marks.find(query))
        if not all_marks:
            return {'avg': None, 'highest': None, 'lowest': None, 'count': 0}
        percs = [m.get('percentage', 0) for m in all_marks]
        return {
            'avg': round(sum(percs) / len(percs), 2),
            'highest': round(max(percs), 2),
            'lowest': round(min(percs), 2),
            'count': len(percs)
        }
