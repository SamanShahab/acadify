import { useState } from 'react';
import api from '../../../services/api';

export default function AttendanceTab({ student, onMessage, onReload }) {
  const [form, setForm] = useState({
    subject: '',
    status: 'present',
    date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/teacher/attendance', { student_id: student._id, ...form }, { noCache: true });
      onMessage(data.message || 'Attendance saved.');
      onReload();
    } catch (err) {
      onMessage(err.response?.data?.message || 'Could not record attendance.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const records = student.attendance_records || [];

  return (
    <div className="space-y-7">
      <form onSubmit={handleSubmit} className="space-y-5">
        <SectionTitle>Record Attendance</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Subject">
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="field-input" required>
              <option value="">Select subject</option>
              {student.subjects?.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="field-input">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </Field>
          <Field label="Date">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="field-input" required />
          </Field>
        </div>
        <SaveButton saving={saving}>Save Attendance</SaveButton>
      </form>

      {records.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>Recent Records</SectionTitle>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            {records.map((r, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 text-sm ${i !== records.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <span className="font-medium text-gray-800">{r.subject}</span>
                <span className="text-gray-500 text-xs">{r.date}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export function SectionTitle({ children }) {
  return <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">{children}</h3>;
}

export function SaveButton({ saving, children }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-all"
    >
      {saving ? 'Saving...' : children}
    </button>
  );
}
