import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { Field, SectionTitle, SaveButton } from './AttendanceTab';

export default function MarksTab({ student, onMessage, onReload }) {
  const [form, setForm] = useState({ subject: '', assessment_type: 'quiz', title: '', score: '', max_score: '', notes: '' });
  const [marks, setMarks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadMarks = (noCache = false) => {
    const key = `teacher_marks_${student._id}`;
    const cached = sessionStorage.getItem(key);
    if (cached && !noCache) {
      try { const d = JSON.parse(cached); setMarks(d.marks); setAnalytics(d.analytics); return; } catch {}
    }
    api.get(`/teacher/marks/${student._id}`, noCache ? { noCache: true } : {})
      .then(({ data }) => {
        setMarks(data.marks || []); setAnalytics(data.analytics);
        try { sessionStorage.setItem(key, JSON.stringify({ marks: data.marks || [], analytics: data.analytics })); } catch {}
      })
      .catch(() => {});
  };

  useEffect(() => { loadMarks(); }, [student._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/teacher/marks', { student_id: student._id, ...form }, { noCache: true });
      onMessage(`Mark saved: ${data.mark?.percentage?.toFixed(1)}%`);
      setForm({ subject: '', assessment_type: 'quiz', title: '', score: '', max_score: '', notes: '' });
      loadMarks(true); onReload();
    } catch (err) {
      onMessage(err.response?.data?.message || 'Could not save mark.', 'error');
    } finally { setSaving(false); }
  };

  const pctColor = p => p >= 75 ? 'text-emerald-600' : p >= 50 ? 'text-amber-600' : 'text-red-600';
  const pctBg   = p => p >= 75 ? 'bg-emerald-100 text-emerald-700' : p >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';

  return (
    <div className="space-y-7">
      <form onSubmit={handleSubmit} className="space-y-5">
        <SectionTitle>Enter Marks</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Subject">
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="field-input" required>
              <option value="">Select subject</option>
              {student.subjects?.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
            </select>
          </Field>
          <Field label="Assessment Type">
            <select value={form.assessment_type} onChange={e => setForm(f => ({ ...f, assessment_type: e.target.value }))} className="field-input">
              {['quiz','assignment','test','exam','participation'].map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Title">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="field-input" placeholder="e.g. Mid-Term Quiz 1" required />
          </Field>
          <Field label="Notes (optional)">
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="field-input" placeholder="Optional notes" />
          </Field>
          <Field label="Score Obtained">
            <input type="number" step="0.5" min="0" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} className="field-input" placeholder="e.g. 18" required />
          </Field>
          <Field label="Max Score">
            <input type="number" step="0.5" min="1" value={form.max_score} onChange={e => setForm(f => ({ ...f, max_score: e.target.value }))} className="field-input" placeholder="e.g. 25" required />
          </Field>
        </div>
        <SaveButton saving={saving}>Save Mark</SaveButton>
      </form>

      {analytics && (
        <div className="flex gap-3">
          <div className="px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 text-center">
            <p className="text-xs text-gray-500">Overall Average</p>
            <p className={`text-2xl font-bold mt-0.5 ${pctColor(analytics.overall_avg)}`}>{analytics.overall_avg}%</p>
          </div>
        </div>
      )}

      {marks.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>Marks History</SectionTitle>
          <div className="rounded-xl overflow-hidden border border-gray-200 max-h-64 overflow-y-auto">
            {marks.map((m, i) => (
              <div key={m._id} className={`flex items-center justify-between gap-4 px-4 py-3 text-sm ${i !== marks.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{m.title}</p>
                  <p className="text-xs text-gray-500">{m.subject} · {m.assessment_type}</p>
                </div>
                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${pctBg(m.percentage)}`}>
                  {m.score}/{m.max_score} ({m.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {marks.length === 0 && <p className="text-sm text-gray-400">No marks recorded yet.</p>}
    </div>
  );
}
