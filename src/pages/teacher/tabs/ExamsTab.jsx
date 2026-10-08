import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../../../services/api';
import { Field, SectionTitle, SaveButton } from './AttendanceTab';

const TYPE_STYLE = {
  mid:   'bg-amber-100 text-amber-700',
  final: 'bg-red-100 text-red-700',
  quiz:  'bg-cyan-100 text-cyan-700',
};

export default function ExamsTab({ student, onMessage }) {
  const [form, setForm] = useState({ subject: '', exam_type: 'mid', exam_date: '', venue: '', notes: '' });
  const [exams, setExams] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadExams = (noCache = false) => {
    const key = `teacher_exams_${student._id}`;
    const cached = sessionStorage.getItem(key);
    if (cached && !noCache) {
      try { setExams(JSON.parse(cached)); return; } catch {}
    }
    api.get(`/teacher/exams/${student._id}`, noCache ? { noCache: true } : {})
      .then(({ data }) => {
        const e = data.exams || [];
        setExams(e);
        try { sessionStorage.setItem(key, JSON.stringify(e)); } catch {}
      })
      .catch(() => {});
  };

  useEffect(() => { loadExams(); }, [student._id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/teacher/exams', { student_id: student._id, ...form }, { noCache: true });
      onMessage('Exam scheduled.');
      setForm({ subject: '', exam_type: 'mid', exam_date: '', venue: '', notes: '' });
      loadExams(true);
    } catch (err) {
      onMessage(err.response?.data?.message || 'Failed.', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await api.post(`/teacher/exams/${id}/delete`, {}, { noCache: true });
    setExams(e => e.filter(x => x._id !== id));
  };

  return (
    <div className="space-y-7">
      <form onSubmit={handleAdd} className="space-y-5">
        <SectionTitle>Schedule Exam</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Subject">
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="field-input" required>
              <option value="">Select subject</option>
              {student.subjects?.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select value={form.exam_type} onChange={e => setForm(f => ({ ...f, exam_type: e.target.value }))} className="field-input">
              <option value="mid">Midterm</option>
              <option value="final">Final</option>
              <option value="quiz">Quiz</option>
            </select>
          </Field>
          <Field label="Date">
            <input type="date" value={form.exam_date} onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))} className="field-input" required />
          </Field>
          <Field label="Venue (optional)">
            <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} className="field-input" placeholder="e.g. Room 101" />
          </Field>
          <Field label="Notes (optional)" >
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="field-input" placeholder="Any instructions" />
          </Field>
        </div>
        <SaveButton saving={saving}>Schedule Exam</SaveButton>
      </form>

      <div className="space-y-2">
        <SectionTitle>Scheduled Exams</SectionTitle>
        {exams.length === 0 && <p className="text-sm text-gray-400">No exams scheduled yet.</p>}
        {exams.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-gray-200">
            {exams.map((e, i) => (
              <div key={e._id} className={`flex items-center justify-between gap-4 px-4 py-3.5 ${i !== exams.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${TYPE_STYLE[e.exam_type] || 'bg-gray-100 text-gray-600'}`}>
                    {e.exam_type}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{e.subject}</p>
                    <p className="text-xs text-gray-500">{e.exam_date}{e.venue && ` · ${e.venue}`}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(e._id)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
