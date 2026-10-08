import { useEffect, useState } from 'react';
import { Calendar, CheckSquare, XSquare, Flame } from 'lucide-react';
import api from '../../services/api';

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/student/attendance')
      .then(({ data }) => setData(data))
      .catch(() => setError('Failed to load attendance.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-secondary">Loading attendance...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;

  const { subjects, records, streak, student } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-card p-6 border-l-4 border-l-emerald-500 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Attendance</h2>
          <p className="text-secondary mt-1">Overall: <strong className="text-white">{student?.attendance_pct?.toFixed(1) || 0}%</strong> — marked by your teacher</p>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="w-7 h-7 text-orange-400" />
          <div>
            <p className="text-2xl font-bold text-orange-400">{streak || 0}</p>
            <p className="text-xs text-secondary">day streak</p>
          </div>
        </div>
      </div>

      {/* Subject Summary */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Subject-wise Attendance</h3>
        {subjects?.length ? (
          <div className="space-y-4">
            {subjects.map(sub => {
              const total = sub.total_classes || 0;
              const attended = sub.attended || 0;
              const pct = total > 0 ? (attended / total * 100).toFixed(1) : 0;
              return (
                <div key={sub.subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{sub.subject}</span>
                    <span className={Number(pct) < 75 ? 'text-red-400' : 'text-emerald-400'}>
                      {attended}/{total} classes · {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${Number(pct) < 75 ? 'bg-red-400' : 'bg-emerald-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-secondary text-sm">No subjects found.</p>
        )}
      </div>

      {/* Attendance History */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-secondary" /> Recent History
        </h3>
        {records?.length ? (
          <div className="space-y-2">
            {records.map((rec, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{rec.subject}</p>
                  <p className="text-xs text-secondary">{rec.date}</p>
                </div>
                {rec.status === 'present' ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-sm bg-emerald-400/10 px-2 py-1 rounded">
                    <CheckSquare className="w-4 h-4" /> Present
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400 text-sm bg-red-400/10 px-2 py-1 rounded">
                    <XSquare className="w-4 h-4" /> Absent
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-secondary py-6 border border-dashed border-white/10 rounded-xl">
            No attendance records yet.
          </p>
        )}
      </div>
    </div>
  );
}
