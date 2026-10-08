import { useEffect, useState } from 'react';
import { FileText, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { Skeleton } from '../../components/Skeleton';

export default function AdminReports() {
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [atRisk, setAtRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchAll = async (date, fromCache = false) => {
    if (!fromCache) setLoading(true);
    try {
      const [d, w, m, r] = await Promise.all([
        api.get(`/admin/api/reports/daily?date=${date}`),
        api.get('/admin/api/reports/weekly'),
        api.get('/admin/api/reports/monthly'),
        api.get('/admin/api/reports/at-risk'),
      ]);
      setDaily(d.data?.report);
      setWeekly(w.data?.report);
      setMonthly(m.data?.report);
      setAtRisk(r.data?.students || []);
      try {
        sessionStorage.setItem(`admin_reports:${date}`, JSON.stringify({
          d: d.data?.report, w: w.data?.report,
          m: m.data?.report, r: r.data?.students || []
        }));
      } catch {}
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cacheKey = `admin_reports:${selectedDate}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { d, w, m, r } = JSON.parse(cached);
        setDaily(d); setWeekly(w); setMonthly(m); setAtRisk(r);
        setLoading(false);
      } catch {}
    }
    fetchAll(selectedDate, !!cached);
  }, []);

  if (loading && !daily && !weekly) return (
    <div className="max-w-5xl mx-auto space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 space-y-3">
          <Skeleton className="h-4 w-1/4 bg-gray-100" />
          <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,j)=><Skeleton key={j} className="h-16 bg-gray-100" />)}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 border-l-4 border-l-emerald-500">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports</h1>
        <p className="text-gray-500 text-sm">Dynamically generated from live attendance and performance data.</p>
      </div>

      {/* Daily Report */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" /> Daily Report
          </h2>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none"
            />
            <button onClick={() => fetchAll(selectedDate)} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-100 transition-colors">
              Refresh
            </button>
          </div>
        </div>
        {daily ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <StatBox label="Date" value={daily.date} />
            <StatBox label="Present" value={daily.present_count} color="text-emerald-600" />
            <StatBox label="Absent" value={daily.absent_count} color="text-red-500" />
            <StatBox label="Attendance %" value={`${daily.attendance_percentage}%`} color={daily.attendance_percentage >= 75 ? 'text-emerald-600' : 'text-amber-500'} />
          </div>
        ) : <p className="text-gray-400 text-sm">No data for selected date.</p>}
      </div>

      {/* Weekly Report */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-emerald-600" /> Weekly Report
        </h2>
        {weekly ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <StatBox label="Week" value={`${weekly.week_start} → ${weekly.week_end}`} />
              <StatBox label="Present" value={weekly.present_count} color="text-emerald-600" />
              <StatBox label="Absent" value={weekly.absent_count} color="text-red-500" />
              <StatBox label="Attendance %" value={`${weekly.attendance_percentage}%`} color={weekly.attendance_percentage >= 75 ? 'text-emerald-600' : 'text-amber-500'} />
            </div>
            {Object.keys(weekly.daily_breakdown || {}).length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Daily Breakdown</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(weekly.daily_breakdown).map(([day, counts]) => (
                    <div key={day} className="bg-gray-50 border border-gray-100 rounded-xl p-2 text-center text-xs">
                      <div className="font-semibold text-gray-700">{day}</div>
                      <div className="text-emerald-600 mt-1">{counts.present || 0} P</div>
                      <div className="text-red-500">{counts.absent || 0} A</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {weekly.absence_patterns?.length > 0 && (
              <p className="text-sm text-amber-600">Absence patterns: {weekly.absence_patterns.join(', ')}</p>
            )}
          </div>
        ) : <p className="text-gray-400 text-sm">No weekly data available.</p>}
      </div>

      {/* Monthly Report */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-emerald-600" /> Monthly Report — {monthly?.month_name}
        </h2>
        {monthly ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <StatBox label="Total Records" value={monthly.total_records} />
              <StatBox label="Present" value={monthly.present_count} color="text-emerald-600" />
              <StatBox label="Absent" value={monthly.absent_count} color="text-red-500" />
              <StatBox label="Attendance %" value={`${monthly.attendance_percentage}%`} color={monthly.attendance_percentage >= 75 ? 'text-emerald-600' : 'text-amber-500'} />
            </div>
            <p className="text-sm text-gray-600">At-risk students (below 75%): <strong className="text-amber-600">{monthly.at_risk_students}</strong></p>
            {monthly.frequent_absences?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Frequent Absences (more than 3 this month)</p>
                {monthly.frequent_absences.map((fa, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-gray-100 py-2">
                    <span className="text-gray-800">{fa.student_name} <span className="text-gray-400">{fa.roll_no}</span></span>
                    <span className="text-red-500 font-medium">{fa.count} absences</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : <p className="text-gray-400 text-sm">No monthly data available.</p>}
      </div>

      {/* At-Risk Students */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-red-500" /> At-Risk Students (Attendance &lt; 75%)
        </h2>
        {atRisk.length ? (
          <div className="space-y-1">
            {atRisk.map(s => (
              <div key={s._id} className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 py-2.5 text-sm">
                <div>
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className="text-gray-400 ml-2">{s.roll_no} · {s.department}</span>
                </div>
                <span className={`font-semibold ${s.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
                  {s.attendance_pct}% · {s.risk_level}
                </span>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-400 text-sm">No at-risk students currently.</p>}
      </div>
    </div>
  );
}

function StatBox({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-gray-400 text-xs mt-1">{label}</div>
    </div>
  );
}
