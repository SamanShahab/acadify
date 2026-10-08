import { useEffect, useState } from 'react';
import { Activity, BookOpen, CalendarCheck, GraduationCap, Users, AlertTriangle, TrendingUp, FileText } from 'lucide-react';
import api from '../../services/api';

export default function ParentDashboard() {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChild, setActiveChild] = useState(null);
  const [childReport, setChildReport] = useState(null);
  const [childMarks, setChildMarks] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/parent/dashboard'),
      api.get('/parent/api/alerts')
    ])
      .then(([dashRes, alertRes]) => {
        if (!active) return;
        setData(dashRes.data);
        setAlerts(alertRes.data?.alerts || []);
        if (dashRes.data?.children?.length) setActiveChild(dashRes.data.children[0]);
      })
      .catch(err => { if (active) setError(err.response?.data?.message || 'Could not load family dashboard.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const loadReport = async (child) => {
    try {
      const { data: res } = await api.get(`/parent/api/child/${child._id}/report`);
      setChildReport(res.report);
    } catch { setChildReport(null); }
  };

  const loadMarks = async (child) => {
    try {
      const { data: res } = await api.get(`/parent/api/child/${child._id}/marks`);
      setChildMarks(res);
    } catch { setChildMarks(null); }
  };

  if (loading) return <p className="text-gray-600">Loading family dashboard...</p>;
  if (error) return <p role="alert" className="text-red-600">{error}</p>;

  const children = data?.children || [];

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-start gap-3 border-b border-gray-200 pb-5">
        <Users className="mt-1 h-6 w-6 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="mt-1 text-gray-600">Monitor your child's attendance, performance, and alerts.</p>
        </div>
      </header>

      {activeChild && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickMetric label="Attendance" value={`${Number(activeChild.attendance_pct || 0).toFixed(1)}%`} accent="emerald" />
          <QuickMetric label="GPA" value={Number(activeChild.gpa || 0).toFixed(2)} accent="blue" />
          <QuickMetric label="Alerts" value={String((activeChild.alerts || []).length)} accent="red" />
          <QuickMetric label="Subjects" value={String((activeChild.subjects || []).length)} accent="amber" />
        </div>
      )}

      {/* Parent Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 border-l-4 border-l-red-500">
          <h2 className="flex items-center gap-2 font-semibold mb-3 text-red-700">
            <AlertTriangle className="h-4 w-4" /> Alerts ({alerts.length})
          </h2>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="text-sm bg-white border border-red-200 rounded-lg px-3 py-2">
                <span className="font-medium text-gray-900">{a.student_name}</span>
                <span className="text-gray-500 ml-2">{a.roll_no}</span>
                <p className="text-red-600 mt-1">{a.message}</p>
                <p className="text-xs text-gray-500 mt-1">{a.created_at}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!children.length ? (
        <p className="border-y border-gray-200 py-10 text-center text-gray-500">
          No student records linked yet. Ask an administrator to connect your account.
        </p>
      ) : (
        <>
          {children.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {children.map(child => (
                <button
                  key={child._id}
                  onClick={() => { setActiveChild(child); setChildReport(null); setChildMarks(null); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeChild?._id === child._id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          )}

          {children.map(child =>
            activeChild?._id === child._id && (
              <article key={child._id} className="space-y-6">

                {/* Child Header */}
                <div className="glass-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{child.name}</h2>
                      <p className="mt-1 text-sm text-gray-600">{child.roll_no} · {child.department} · Semester {child.semester}</p>
                    </div>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      child.risk_level === 'HIGH' ? 'bg-red-100 text-red-700' :
                      child.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>{child.risk_level || 'LOW'} Risk</span>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <Metric icon={GraduationCap} label="Current GPA" value={Number(child.gpa || 0).toFixed(2)} />
                    <Metric
                      icon={CalendarCheck}
                      label="Attendance"
                      value={`${Number(child.attendance_pct || 0).toFixed(1)}%`}
                      valueClass={child.attendance_pct < 70 ? 'text-red-600' : child.attendance_pct < 75 ? 'text-amber-600' : 'text-emerald-600'}
                    />
                    <Metric icon={Activity} label="Risk Score" value={Number(child.risk_score || 0).toFixed(1)} />
                  </div>
                </div>

                {/* Attendance Alerts */}
                {child.alerts?.length > 0 && (
                  <div className="glass-card p-5 border-l-4 border-l-amber-500">
                    <h3 className="font-semibold mb-3 text-amber-700 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Attendance Alerts
                    </h3>
                    {child.alerts.map((a, i) => (
                      <div key={i} className={`text-sm px-3 py-2 rounded-lg mb-2 ${
                        a.severity === 'critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>{a.message}</div>
                    ))}
                  </div>
                )}

                {/* Subject Attendance */}
                {child.subjects?.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4 text-emerald-600" /> Subject-wise Attendance
                    </h3>
                    <div className="space-y-3">
                      {child.subjects.map(s => (
                        <div key={s.subject}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-800">{s.subject}</span>
                            <span className={s.percentage < 70 ? 'text-red-600' : s.percentage < 75 ? 'text-amber-600' : 'text-emerald-600'}>
                              {s.attended}/{s.total_classes} ({s.percentage}%)
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full">
                            <div
                              className={`h-full rounded-full ${s.percentage < 70 ? 'bg-red-500' : s.percentage < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, s.percentage)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Marks Analytics */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" /> Academic Performance
                    </h3>
                    <button onClick={() => loadMarks(child)} className="text-sm text-emerald-600 font-medium hover:underline">
                      Load marks →
                    </button>
                  </div>
                  {child.marks_analytics?.overall_avg != null ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      {[
                        { label: 'Overall Avg', value: `${child.marks_analytics.overall_avg}%`, color: 'text-emerald-600' },
                        { label: 'Highest', value: `${child.marks_analytics.highest}%`, color: 'text-gray-900' },
                        { label: 'Lowest', value: `${child.marks_analytics.lowest}%`, color: 'text-gray-900' },
                        { label: 'Assessments', value: child.marks_analytics.total_assessments, color: 'text-gray-900' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                          <div className={`text-2xl font-bold ${color}`}>{value}</div>
                          <div className="text-gray-600 mt-1 text-xs">{label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No marks recorded yet.</p>
                  )}
                  {childMarks && (
                    <div className="mt-4 space-y-1 max-h-48 overflow-y-auto">
                      {childMarks.marks?.map(m => (
                        <div key={m._id} className="flex justify-between text-sm border-b border-gray-100 py-1">
                          <span className="text-gray-800">{m.title} <span className="text-gray-500">· {m.subject}</span></span>
                          <span className={m.percentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}>{m.score}/{m.max_score} ({m.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Attendance */}
                <div className="glass-card p-6">
                  <h3 className="font-semibold mb-4 text-gray-900">Recent Attendance</h3>
                  {child.attendance_records?.length ? child.attendance_records.map(r => (
                    <div key={r._id} className="flex justify-between gap-4 border-b border-gray-100 py-2 text-sm">
                      <span className="text-gray-800">{r.subject}</span>
                      <span className={r.status === 'present' ? 'text-emerald-600' : 'text-red-600'}>
                        {r.status} · {String(r.date || '').slice(0, 10)}
                      </span>
                    </div>
                  )) : <p className="text-sm text-gray-500">No attendance records yet.</p>}
                </div>

                {/* Assignments */}
                <div className="glass-card p-6">
                  <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-600" /> Coursework
                  </h3>
                  {child.assignments?.length ? child.assignments.map(a => (
                    <div key={a._id} className="flex justify-between gap-4 border-b border-gray-100 py-2 text-sm">
                      <span className="text-gray-800">{a.title} <span className="text-gray-500">{a.subject}</span></span>
                      <span className="text-gray-600 shrink-0">{a.status} · {a.due_date?.slice(0, 10)}</span>
                    </div>
                  )) : <p className="text-sm text-gray-500">No assignments recorded.</p>}
                </div>

                {/* Report */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-600" /> Full Report
                    </h3>
                    <button onClick={() => loadReport(child)} className="glass-button px-4 py-2 text-sm">
                      Generate Report
                    </button>
                  </div>
                  {childReport && (
                    <div className="space-y-3 text-sm">
                      <p className="text-gray-800">Overall Attendance: <strong className={childReport.overall_attendance < 75 ? 'text-red-600' : 'text-emerald-600'}>{childReport.overall_attendance}%</strong></p>
                      <p className="text-gray-800">Generated: <span className="text-gray-600">{childReport.generated_at}</span></p>
                      {childReport.subjects?.map(s => (
                        <div key={s.subject} className="flex justify-between border-b border-gray-100 py-1">
                          <span className="text-gray-800">{s.subject}</span>
                          <span className={s.status === 'critical' ? 'text-red-600' : s.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'}>
                            {s.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 text-gray-900">Subject Performance</h3>
                    <div className="space-y-3">
                      {(child.subjects || []).map(subject => (
                        <div key={subject.subject}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-800">{subject.subject}</span>
                            <span className={subject.percentage < 70 ? 'text-red-600' : subject.percentage < 75 ? 'text-amber-600' : 'text-emerald-600'}>
                              {subject.percentage}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full">
                            <div className={`h-full rounded-full ${subject.percentage < 70 ? 'bg-red-500' : subject.percentage < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, subject.percentage)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 text-gray-900">Next Academic Deadlines</h3>
                    <div className="space-y-3">
                      {(child.assignments || []).slice(0, 4).map(item => (
                        <div key={item._id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-500">{item.subject}</p>
                          </div>
                          <span className="text-xs text-gray-600">{String(item.due_date || '').slice(0, 10)}</span>
                        </div>
                      ))}
                      {!(child.assignments || []).length && <p className="text-sm text-gray-500">No upcoming deadlines.</p>}
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                {child.latest_prediction?.recommendations?.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-3 text-gray-900">AI Recommendations</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {child.latest_prediction.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2"><span className="text-emerald-600 mt-0.5">•</span>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            )
          )}
        </>
      )}
    </section>
  );
}

function QuickMetric({ label, value, accent = 'emerald' }) {
  const colors = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[accent]}`}>
      <p className="text-xs uppercase tracking-wide text-gray-600">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value, valueClass = 'text-gray-900' }) {
  return (
    <div className="flex items-center gap-3 border border-gray-200 bg-gray-50 rounded-xl p-3">
      <Icon className="h-5 w-5 text-emerald-600 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`font-semibold ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}
