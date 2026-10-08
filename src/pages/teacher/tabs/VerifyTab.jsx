import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import api from '../../../services/api';
import { Field, SectionTitle, SaveButton } from './AttendanceTab';

export default function VerifyTab({ student, onMessage, onReload }) {
  const [form, setForm] = useState({
    subject: '',
    status: 'present',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/teacher/attendance/verify', { student_id: student._id, ...form }, { noCache: true });
      onMessage(data.message || 'Attendance corrected.');
      setForm(f => ({ ...f, note: '' }));
      onReload();
    } catch (err) {
      onMessage(err.response?.data?.message || 'Could not apply correction.', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-700">
          Use this only to correct face-recognition errors or apply manual exceptions. A correction note is recommended for audit purposes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <SectionTitle>Correct Attendance</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Subject">
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="field-input" required>
              <option value="">Select subject</option>
              {student.subjects?.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
            </select>
          </Field>
          <Field label="Correct Status">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="field-input">
              <option value="present">Mark Present</option>
              <option value="absent">Mark Absent</option>
            </select>
          </Field>
          <Field label="Date">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="field-input" required />
          </Field>
          <Field label="Reason / Note">
            <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="field-input" placeholder="e.g. Medical leave verified" />
          </Field>
        </div>
        <SaveButton saving={saving}>Apply Correction</SaveButton>
      </form>
    </div>
  );
}
