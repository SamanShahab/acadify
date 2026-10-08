import { useEffect, useState } from 'react';
import { Users, AlertTriangle, ShieldCheck, Activity, Building2, Clock3 } from 'lucide-react';
import api from '../../services/api';
import { SkeletonStat, SkeletonCard } from '../../components/Skeleton';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parallel fetch — both requests fire at the same time
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/api/ai/status'),
    ]).then(([dashRes, aiRes]) => {
      setData(dashRes.data);
      setModelStatus(aiRes.data.models);
    }).catch(err => {
      console.error('Failed to load admin dashboard', err);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <SkeletonCard lines={1} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard lines={5} /><SkeletonCard lines={5} />
      </div>
    </div>
  );
  if (!data) return <div className="p-8 text-red-600">Error loading data.</div>;

  const { total_students, high_risk_count, medium_risk_count, low_risk_count, avg_gpa, avg_attendance, open_counseling, active_interventions, recent_students, recent_activity, departments } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="glass-card p-8 border-l-4 border-l-indigo-500">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
        <p className="text-gray-500">Overview of system health, student risks, and administrative metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={total_students || 0} icon={Users} color="blue" />
        <StatCard title="High Risk" value={high_risk_count || 0} icon={AlertTriangle} color="red" />
        <StatCard title="Average GPA" value={Number(avg_gpa || 0).toFixed(2)} icon={Activity} color="green" />
        <StatCard title="Average Attendance" value={`${Number(avg_attendance || 0).toFixed(1)}%`} icon={ShieldCheck} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Risk Distribution</h3>
          <div className="space-y-3">
            <DistributionRow label="High risk" count={high_risk_count} total={total_students} color="bg-red-500" />
            <DistributionRow label="Medium risk" count={medium_risk_count} total={total_students} color="bg-amber-500" />
            <DistributionRow label="Low risk" count={low_risk_count} total={total_students} color="bg-emerald-500" />
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm">
              <div className="text-gray-500">Open counseling</div><div className="text-right font-semibold text-gray-800">{open_counseling || 0}</div>
              <div className="text-gray-500">Active interventions</div><div className="text-right font-semibold text-gray-800">{active_interventions || 0}</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Recent System Activity</h3>
          <div className="space-y-1">
            {recent_activity?.length > 0 ? recent_activity.map((log, index) => (
              <div key={log._id || index} className="p-3 border-b border-gray-100 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold capitalize text-indigo-600">{log.title || log.action_type}</span>
                  <span className="text-gray-400 text-xs">{log.timestamp || log.created_at}</span>
                </div>
                <div className="text-gray-600">{log.details || log.description}</div>
              </div>
            )) : (
              <div className="py-4 text-center text-gray-400">No recent logs.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900"><Building2 className="h-4 w-4 text-indigo-500" />Departments</h3>
          <div className="space-y-3">
            {departments?.map((department) => (
              <div key={department._id || department.name} className="flex justify-between gap-4 border-b border-gray-100 pb-3 text-sm">
                <span className="font-medium text-gray-800">{department.name}</span>
                <span className="text-gray-500">{department.total_students || 0} students · GPA {Number(department.avg_gpa || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="glass-card p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900"><Clock3 className="h-4 w-4 text-indigo-500" />Recent Students</h3>
          <div className="space-y-3">
            {recent_students?.map((student) => (
              <div key={student._id} className="flex justify-between gap-4 border-b border-gray-100 pb-3 text-sm">
                <span className="font-medium text-gray-800">{student.name || student.user?.name || student.roll_no}</span>
                <span className="text-gray-500">{student.department} · <span className={student.risk_level === 'HIGH' ? 'text-red-600 font-semibold' : student.risk_level === 'MEDIUM' ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>{student.risk_level}</span></span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="glass-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">AI Model Readiness</h3>
        {modelStatus ? (
          <div className="grid gap-x-8 sm:grid-cols-2">
            {Object.entries(modelStatus).map(([key, model]) => (
              <div key={key} className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 text-sm">
                <div>
                  <div className="font-medium text-gray-800 capitalize">{key.replaceAll('_', ' ')}</div>
                  {model.version ? <div className="mt-1 text-xs text-gray-500">Version {model.version}{model.accuracy ? ` · ${model.accuracy}% accuracy` : ''}{model.features ? ` · ${model.features} features` : ''}</div> : null}
                  {model.error ? <div className="mt-1 text-xs text-red-600">{model.error}</div> : null}
                </div>
                <span className={`font-semibold ${model.ready ? 'text-emerald-600' : 'text-red-600'}`}>{model.ready ? 'Ready' : 'Unavailable'}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">AI model readiness could not be retrieved.</p>}
      </section>
    </div>
  );
}

function DistributionRow({ label, count = 0, total = 0, color }) {
  const percent = total ? Math.min(100, (count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500 font-semibold">{count || 0}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const styles = {
    blue:   { border: 'border-blue-200',   bg: 'bg-blue-50',   icon: 'text-blue-600',   val: 'text-blue-700' },
    red:    { border: 'border-red-200',     bg: 'bg-red-50',    icon: 'text-red-600',    val: 'text-red-700' },
    green:  { border: 'border-emerald-200', bg: 'bg-emerald-50', icon: 'text-emerald-600', val: 'text-emerald-700' },
    yellow: { border: 'border-amber-200',   bg: 'bg-amber-50',  icon: 'text-amber-600',  val: 'text-amber-700' },
  };
  const s = styles[color];
  return (
    <div className={`glass-card p-6 flex flex-col justify-between border-t-4 ${s.border}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className={`p-2 rounded-lg ${s.bg}`}>
          <Icon className={`w-4 h-4 ${s.icon}`} />
        </div>
      </div>
      <div className={`text-3xl font-bold tracking-tight ${s.val}`}>{value}</div>
    </div>
  );
}
