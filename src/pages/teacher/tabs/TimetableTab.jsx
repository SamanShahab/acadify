import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../../../services/api';
import { Field, SectionTitle, SaveButton } from './AttendanceTab';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function TimetableTab({ student, onMessage }) {
  const [form, setForm] = useState({ day: 'Monday', time: '', subject: '', room: '' });
  const [slots, setSlots] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadSlots = (noCache = false) => {
    const key = `teacher_timetable_${student._id}`;
    const cached = sessionStorage.getItem(key);
    if (cached && !noCache) {
      try { setSlots(JSON.parse(cached)); return; } catch {}
    }
    api.get('/student/timetable', noCache ? { noCache: true } : {})
      .then(({ data }) => {
        const s = Object.values(data.timetable || {}).flat();
        setSlots(s);
        try { sessionStorage.setItem(key, JSON.stringify(s)); } catch {}
      })
      .catch(() => {});
  };

  useEffect(() => { loadSlots(); }, [student._id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/teacher/timetable', { student_id: student._id, ...form }, { noCache: true });
      onMessage('Slot added.');
      setForm(f => ({ ...f, time: '', subject: '', room: '' }));
      loadSlots(true);
    } catch (err) {
      onMessage(err.response?.data?.message || 'Failed to add slot.', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await api.post(`/teacher/timetable/${id}/delete`, {}, { noCache: true });
    setSlots(s => s.filter(x => x._id !== id));
  };

  const grouped = DAYS.reduce((acc, d) => ({ ...acc, [d]: slots.filter(s => s.day === d) }), {});

  return (
    <div className="space-y-7">
      <form onSubmit={handleAdd} className="space-y-5">
        <SectionTitle>Add Slot</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Day">
            <select value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} className="field-input">
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Time">
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="field-input" required />
          </Field>
          <Field label="Subject">
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="field-input" placeholder="Subject" required />
          </Field>
          <Field label="Room">
            <input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} className="field-input" placeholder="Optional" />
          </Field>
        </div>
        <SaveButton saving={saving}>Add Slot</SaveButton>
      </form>

      <div className="space-y-4">
        <SectionTitle>Weekly Schedule</SectionTitle>
        {DAYS.map(day => grouped[day]?.length > 0 && (
          <div key={day}>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">{day}</p>
            <div className="rounded-xl overflow-hidden border border-gray-200">
              {grouped[day].map((s, i) => (
                <div key={s._id} className={`flex items-center justify-between px-4 py-3 text-sm ${i !== grouped[day].length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-gray-500 w-12">{s.time}</span>
                    <span className="font-medium text-gray-800">{s.subject}</span>
                    {s.room && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">{s.room}</span>}
                  </div>
                  <button onClick={() => handleDelete(s._id)} className="text-white/20 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {slots.length === 0 && <p className="text-sm text-gray-400">No timetable slots yet.</p>}
      </div>
    </div>
  );
}
