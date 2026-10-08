import { useEffect, useState } from 'react';
import { Clock, Calendar } from 'lucide-react';
import api from '../../services/api';

export default function Timetable() {
  const [timetable, setTimetable] = useState({});
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/student/timetable')
      .then(({ data }) => {
        setTimetable(data.timetable || {});
        setDays(data.days || []);
      })
      .catch(() => setError('Failed to load timetable.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-secondary">Loading timetable...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;

  const hasAnySlot = days.some(d => timetable[d]?.length > 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-card p-6 border-l-4 border-l-purple-500">
        <h2 className="text-2xl font-bold">Weekly Timetable</h2>
        <p className="text-secondary mt-1">Your class schedule assigned by your teacher.</p>
      </div>

      {!hasAnySlot ? (
        <div className="glass-card p-10 text-center text-secondary border border-dashed border-white/10">
          No timetable assigned yet. Your teacher will set up your schedule.
        </div>
      ) : (
        <div className="space-y-4">
          {days.map(day => (
            timetable[day]?.length > 0 && (
              <div key={day} className="glass-card p-5">
                <h3 className="font-semibold text-lg border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" /> {day}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {timetable[day].map(slot => (
                    <div key={slot._id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="font-semibold">{slot.subject}</p>
                      <div className="flex items-center gap-2 text-sm text-secondary mt-1">
                        <Clock className="w-3 h-3" /> {slot.time}
                        {slot.room && <span className="px-2 py-0.5 bg-white/10 rounded text-xs">{slot.room}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
