import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { Field, SectionTitle, SaveButton } from './AttendanceTab';

const PRI = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-emerald-100 text-emerald-700' };

export default function AssignmentsTab({ student, onMessage, onReload }) {
  const [form, setForm] = useState({ title: '', subject: '', due_date: '', priority: 'medium', description: '' });
  const [file, setFile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadAssignments = (noCache = false) => {
    const key = `teacher_assignments_${student._id}`;
    const cached = sessionStorage.getItem(key);
    if (cached && !noCache) {
      try { setAssignments(JSON.parse(cached)); return; } catch {}
    }
    api.get(`/teacher/assignments/${student._id}`, noCache ? { noCache: true } : {})
      .then(({ data }) => {
        const a = data.assignments || [];
        setAssignments(a);
        try { sessionStorage.setItem(key, JSON.stringify(a)); } catch {}
      })
      .catch(() => {});
  };

  useEffect(() => { loadAssignments(); }, [student._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries({ ...form, student_id: student._id }).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('file', file);
    try {
      await api.post('/teacher/assignments', fd, { headers: { 'Content-Type': 'multipart/form-data' }, noCache: true });
      onMessage('Assignment published.');
      setForm({ title: '', subject: '', due_date: '', priority: 'medium', description: '' });
      setFile(null);
      loadAssignments(true); onReload();
    } catch (err) {
      onMessage(err.response?.data?.message || 'Could not create assignment.', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-7">
      <form onSubmit={handleSubmit} className="space-y-5">
        <SectionTitle>Publish Assignment</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="field-input sm:col-span-2" placeholder="Assignment title" required />
          </Field>
          <Field label="Subject">
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="field-input" required>
              <option value="">Select subject</option>
              {student.subjects?.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
            </select>
          </Field>
          <Field label="Due Date">
            <input type="date" value={form.due_date} min={new Date().toISOString().slice(0, 10)} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="field-input" required />
          </Field>
          <Field label="Priority">
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="field-input">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>
          <Field label="Instructions (optional)">
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="field-input" placeholder="Brief instructions" />
          </Field>
          <Field label="Attach File (optional)">
            <input type="file" onChange={e => setFile(e.target.files[0])} className="field-input text-sm py-2" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.txt" />
          </Field>
        </div>
        <SaveButton saving={saving}>Publish Assignment</SaveButton>
      </form>

      <div className="space-y-2">
        <SectionTitle>Published Assignments</SectionTitle>
        {assignments.length === 0 && <p className="text-sm text-gray-400">No assignments published yet.</p>}
        {assignments.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-gray-200">
            {assignments.map((a, i) => (
              <div key={a._id} className={`flex items-center justify-between gap-4 px-4 py-3.5 ${i !== assignments.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.subject} · Due {a.due_date}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${PRI[a.priority] || ''}`}>{a.priority}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full ${a.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
