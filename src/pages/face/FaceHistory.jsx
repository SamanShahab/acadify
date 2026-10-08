import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, ScanFace } from 'lucide-react';
import api from '../../services/api';

export default function FaceHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/face/attendance')
      .then(({ data }) => setRecords(data.records || []))
      .catch((err) => setError(err.response?.data?.error || 'Could not load face attendance history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-start gap-4 border-b border-white/10 pb-5">
        <ScanFace className="mt-1 h-7 w-7 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold">Face Attendance History</h1>
          <p className="mt-1 text-secondary">Recent attendance recorded through face recognition.</p>
        </div>
      </header>

      {loading ? <p className="text-secondary">Loading attendance history...</p> : null}
      {error ? <p role="alert" className="text-red-400">{error}</p> : null}
      {!loading && !error && records.length === 0 ? (
        <div className="border-y border-white/10 py-12 text-center text-secondary">No face attendance records yet.</div>
      ) : null}
      {records.length > 0 ? (
        <div className="overflow-x-auto border-y border-white/10">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-secondary">
              <tr><th className="py-3 pr-4">Student</th><th className="py-3 pr-4">Roll number</th><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Time</th><th className="py-3">Status</th></tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={`${record.date}-${record.time}-${record.roll_no}-${index}`} className="border-b border-white/5">
                  <td className="py-4 pr-4 font-medium">{record.student_name || 'Student'}</td>
                  <td className="py-4 pr-4 text-secondary">{record.roll_no || '—'}</td>
                  <td className="py-4 pr-4 text-secondary"><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{record.day ? `${record.day}, ` : ''}{record.date}</span></td>
                  <td className="py-4 pr-4 text-secondary"><span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />{record.time}</span></td>
                  <td className="py-4 capitalize text-emerald-400">{record.status || 'present'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}