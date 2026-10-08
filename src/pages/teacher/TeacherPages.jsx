import { useEffect, useState } from 'react';
import api from '../../services/api';
import AttendanceTab from './tabs/AttendanceTab';
import MarksTab from './tabs/MarksTab';
import TimetableTab from './tabs/TimetableTab';
import ExamsTab from './tabs/ExamsTab';
import AssignmentsTab from './tabs/AssignmentsTab';
import VerifyTab from './tabs/VerifyTab';
import { X } from 'lucide-react';

function useTeacherData() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion(v => v + 1);

  useEffect(() => {
    const cacheKey = 'teacher_students';
    const cached = sessionStorage.getItem(cacheKey);
    if (cached && version === 0) {
      try { setStudents(JSON.parse(cached)); setLoading(false); } catch {}
    } else {
      setLoading(true);
    }
    api.get('/teacher/dashboard', version > 0 ? { noCache: true } : {})
      .then(r => {
        const list = r.data.students || [];
        setStudents(list);
        setLoading(false);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(list)); } catch {}
      })
      .catch(() => setLoading(false));
  }, [version]);

  return { students, loading, reload };
}

function TeacherPageLayout({ title, children, students, loading, selectedId, onSelect, toast, onCloseToast }) {
  const selected = students.find(s => s._id === selectedId) || students[0];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-secondary">
        <div className="w-5 h-5 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
        Loading...
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {/* Student Selector */}
        <select
          value={selectedId || selected?._id || ''}
          onChange={e => onSelect(e.target.value)}
          className="field-input w-auto min-w-[200px]"
        >
          {students.map(s => (
            <option key={s._id} value={s._id}>{s.name} — {s.roll_no}</option>
          ))}
        </select>
      </div>

      {/* Toast */}
      {toast.msg && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm border ${
          toast.type === 'error'
            ? 'bg-red-500/10 border-red-500/20 text-red-300'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
        }`}>
          <span>{toast.msg}</span>
          <button onClick={onCloseToast}><X className="w-4 h-4 opacity-60 hover:opacity-100" /></button>
        </div>
      )}

      {/* Selected Student Info */}
      {selected && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold">{selected.name}</p>
            <p className="text-secondary text-sm">{selected.roll_no} · {selected.department} · Sem {selected.semester}</p>
          </div>
          <div className="flex gap-3">
            {[
              { label: 'GPA', value: Number(selected.gpa || 0).toFixed(2), color: 'text-white' },
              {
                label: 'Attendance',
                value: `${Number(selected.attendance_pct || 0).toFixed(1)}%`,
                color: Number(selected.attendance_pct) < 70 ? 'text-red-400' : Number(selected.attendance_pct) < 75 ? 'text-amber-400' : 'text-emerald-400'
              },
            ].map(m => (
              <div key={m.label} className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/8">
                <p className="text-[10px] text-secondary uppercase tracking-wide">{m.label}</p>
                <p className={`text-lg font-bold mt-0.5 ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {selected && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
          {children(selected)}
        </div>
      )}

      {students.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-12 text-center text-secondary">
          No students assigned yet.
        </div>
      )}
    </div>
  );
}

function usePage(students) {
  const [selectedId, setSelectedId] = useState('');
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  useEffect(() => {
    if (students.length && !selectedId) setSelectedId(students[0]._id);
  }, [students]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  return { selectedId, setSelectedId, toast, showToast, closeToast: () => setToast({ msg: '' }) };
}

export function TeacherAttendancePage() {
  const { students, loading, reload } = useTeacherData();
  const { selectedId, setSelectedId, toast, showToast, closeToast } = usePage(students);
  return (
    <TeacherPageLayout title="Attendance" students={students} loading={loading} selectedId={selectedId} onSelect={setSelectedId} toast={toast} onCloseToast={closeToast}>
      {student => <AttendanceTab student={student} onMessage={showToast} onReload={reload} />}
    </TeacherPageLayout>
  );
}

export function TeacherMarksPage() {
  const { students, loading, reload } = useTeacherData();
  const { selectedId, setSelectedId, toast, showToast, closeToast } = usePage(students);
  return (
    <TeacherPageLayout title="Marks" students={students} loading={loading} selectedId={selectedId} onSelect={setSelectedId} toast={toast} onCloseToast={closeToast}>
      {student => <MarksTab student={student} onMessage={showToast} onReload={reload} />}
    </TeacherPageLayout>
  );
}

export function TeacherTimetablePage() {
  const { students, loading, reload } = useTeacherData();
  const { selectedId, setSelectedId, toast, showToast, closeToast } = usePage(students);
  return (
    <TeacherPageLayout title="Timetable" students={students} loading={loading} selectedId={selectedId} onSelect={setSelectedId} toast={toast} onCloseToast={closeToast}>
      {student => <TimetableTab student={student} onMessage={showToast} />}
    </TeacherPageLayout>
  );
}

export function TeacherExamsPage() {
  const { students, loading, reload } = useTeacherData();
  const { selectedId, setSelectedId, toast, showToast, closeToast } = usePage(students);
  return (
    <TeacherPageLayout title="Exams" students={students} loading={loading} selectedId={selectedId} onSelect={setSelectedId} toast={toast} onCloseToast={closeToast}>
      {student => <ExamsTab student={student} onMessage={showToast} />}
    </TeacherPageLayout>
  );
}

export function TeacherAssignmentsPage() {
  const { students, loading, reload } = useTeacherData();
  const { selectedId, setSelectedId, toast, showToast, closeToast } = usePage(students);
  return (
    <TeacherPageLayout title="Assignments" students={students} loading={loading} selectedId={selectedId} onSelect={setSelectedId} toast={toast} onCloseToast={closeToast}>
      {student => <AssignmentsTab student={student} onMessage={showToast} onReload={reload} />}
    </TeacherPageLayout>
  );
}

export function TeacherVerifyPage() {
  const { students, loading, reload } = useTeacherData();
  const { selectedId, setSelectedId, toast, showToast, closeToast } = usePage(students);
  return (
    <TeacherPageLayout title="Verify Exceptions" students={students} loading={loading} selectedId={selectedId} onSelect={setSelectedId} toast={toast} onCloseToast={closeToast}>
      {student => <VerifyTab student={student} onMessage={showToast} onReload={reload} />}
    </TeacherPageLayout>
  );
}
