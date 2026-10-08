import { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';
import api from '../../services/api';

export default function StudentMarks() {
  const [marks, setMarks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/student/api/marks'),
      api.get('/student/api/alerts')
    ]).then(([marksRes, alertRes]) => {
      setMarks(marksRes.data?.marks || []);
      setAnalytics(marksRes.data?.analytics || null);
      setAlerts(alertRes.data?.alerts || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-secondary">Loading marks...</p>;

  const subjects = [...new Set(marks.map(m => m.subject))];
  const filtered = filter ? marks.filter(m => m.subject === filter) : marks;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold mb-1">My Marks & Performance</h1>
        <p className="text-secondary text-sm">All assessments entered by your teachers.</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <h2 className="flex items-center gap-2 font-semibold mb-3 text-amber-300">
            <AlertTriangle className="h-4 w-4" /> Attendance Alerts
          </h2>
          {alerts.map((a, i) => (
            <div key={i} className={`text-sm px-3 py-2 rounded-lg mb-2 ${
              a.severity === 'critical' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'
            }`}>{a.message} <span className="text-xs opacity-60 ml-2">{a.created_at}</span></div>
          ))}
        </div>
      )}

      {/* Analytics Summary */}
      {analytics?.overall_avg != null ? (
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" /> Performance Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
            <StatBox label="Overall Avg" value={`${analytics.overall_avg}%`} color="text-emerald-400" />
            <StatBox label="Highest" value={`${analytics.highest}%`} color="text-blue-400" />
            <StatBox label="Lowest" value={`${analytics.lowest}%`} color="text-amber-400" />
            <StatBox label="Assessments" value={analytics.total_assessments} color="text-white" />
          </div>

          {/* Per-subject breakdown */}
          {Object.entries(analytics.subjects || {}).map(([subj, data]) => (
            <div key={subj} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{subj}</span>
                <span className={data.avg_percentage >= 75 ? 'text-emerald-400' : 'text-amber-400'}>
                  Avg {data.avg_percentage}% · {data.count} assessments
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full">
                <div
                  className={`h-full rounded-full ${data.avg_percentage >= 75 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  style={{ width: `${Math.min(100, data.avg_percentage)}%` }}
                />
              </div>
            </div>
          ))}

          {/* By type */}
          {Object.keys(analytics.by_type || {}).length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm font-medium mb-2">By Assessment Type</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(analytics.by_type).map(([type, avg]) => (
                  <span key={type} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 capitalize">
                    {type}: <strong>{avg}%</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-secondary border border-dashed border-white/10">
          No marks recorded yet. Your teacher will enter marks after assessments.
        </div>
      )}

      {/* Marks Table */}
      {marks.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-400" /> All Marks
            </h2>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="glass-input w-auto text-sm py-1.5"
            >
              <option value="">All subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            {filtered.map(m => (
              <div key={m._id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2 text-sm">
                <div>
                  <span className="font-medium">{m.title}</span>
                  <span className="text-secondary ml-2">· {m.subject} · <span className="capitalize">{m.assessment_type}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-secondary">{m.created_at}</span>
                  <span className={`font-semibold ${m.percentage >= 75 ? 'text-emerald-400' : m.percentage >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {m.score}/{m.max_score} ({m.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-secondary text-xs mt-1">{label}</div>
    </div>
  );
}
