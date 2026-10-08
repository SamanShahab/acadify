import { useEffect, useState } from 'react';
import { Calendar, MapPin, Book, Clock } from 'lucide-react';
import api from '../../services/api';

function daysLeft(examDate, today) {
  const diff = Math.ceil((new Date(examDate) - new Date(today)) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [today, setToday] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/exams')
      .then(({ data }) => {
        setExams(data.exams || []);
        setToday(data.today || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-secondary">Loading exams...</div>;

  const upcoming = exams.filter(e => e.exam_date >= today);
  const past = exams.filter(e => e.exam_date < today);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-card p-6 border-l-4 border-l-purple-500">
        <h2 className="text-2xl font-bold">Exam Schedule</h2>
        <p className="text-secondary mt-1">Exams scheduled by your teacher.</p>
      </div>

      {!exams.length ? (
        <div className="glass-card p-10 text-center text-secondary border border-dashed border-white/10">
          No exams scheduled yet. Your teacher will add them here.
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary px-1">Upcoming ({upcoming.length})</h3>
              {upcoming.map(exam => {
                const days = daysLeft(exam.exam_date, today);
                return (
                  <div key={exam._id} className={`glass-card p-5 border-l-4 ${exam.exam_type === 'final' ? 'border-l-red-500' : exam.exam_type === 'mid' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="uppercase text-xs font-bold px-2 py-0.5 bg-white/10 rounded">{exam.exam_type}</span>
                          <h4 className="text-lg font-bold">{exam.subject}</h4>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-secondary">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{exam.exam_date}</span>
                          {exam.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{exam.venue}</span>}
                          {exam.notes && <span className="flex items-center gap-1"><Book className="w-3 h-3" />{exam.notes}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-2xl font-bold ${days <= 3 ? 'text-red-400' : days <= 7 ? 'text-yellow-400' : 'text-emerald-400'}`}>{days}</p>
                        <p className="text-xs text-secondary flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />days left</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary px-1">Past ({past.length})</h3>
              {past.map(exam => (
                <div key={exam._id} className="glass-card p-4 opacity-50 flex justify-between items-center">
                  <div>
                    <span className="uppercase text-xs px-2 py-0.5 bg-white/10 rounded mr-2">{exam.exam_type}</span>
                    <span className="font-medium">{exam.subject}</span>
                  </div>
                  <span className="text-sm text-secondary">{exam.exam_date}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
