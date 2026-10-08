import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CheckCircle, XCircle, AlertCircle, Users, RefreshCw, Plus, Calendar, ChevronRight } from 'lucide-react';
import api from '../../services/api';

export default function FaceAttendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const autoScanRef = useRef(null);

  const [step, setStep] = useState(1); // 1 = create session, 2 = scan

  // Step 1 state
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ subject: '', date: new Date().toISOString().slice(0, 10), label: '' });
  const [creating, setCreating] = useState(false);
  const [todaySessions, setTodaySessions] = useState([]);

  // Step 2 state
  const [session, setSession] = useState(null); // { session_id, subject, date, day, label }
  const [classStudents, setClassStudents] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [stream, setStream] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/api/face/subjects', { noCache: true })
      .then(r => setSubjects(r.data.subjects || []))
      .catch(() => {});
    api.get('/api/face/status')
      .then(() => setModelReady(true))
      .catch(() => setMessage('Face recognition models unavailable.'));
    loadTodaySessions();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearTimeout(autoScanRef.current);
    };
  }, []);

  const loadTodaySessions = () => {
    api.get('/api/face/sessions', { noCache: true })
      .then(r => setTodaySessions(r.data.sessions || []))
      .catch(() => {});
  };

  const handleCreateSession = async () => {
    if (!form.subject) return;
    setCreating(true);
    try {
      const { data } = await api.post('/api/face/session/create', form);
      if (data.success) {
        enterSession(data);
        loadTodaySessions();
      }
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to create session.');
    } finally {
      setCreating(false);
    }
  };

  const enterSession = async (sess) => {
    setSession(sess);
    setStep(2);
    setScanResult(null);
    setMessage('');
    // Load students for this session
    const { data } = await api.get(
      `/api/face/class-students?subject=${encodeURIComponent(sess.subject)}&session_id=${sess.session_id}`,
      { noCache: true }
    );
    const students = data.students || [];
    setClassStudents(students);
    const firstPending = students.findIndex(s => !s.already_marked);
    setCurrentIdx(firstPending === -1 ? 0 : firstPending);
    await startCamera();
  };

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = ms;
      if (videoRef.current) videoRef.current.srcObject = ms;
      setStream(true);
    } catch {
      setMessage('Camera access denied.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStream(false);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video?.videoWidth) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.82);
  };

  const advanceToNext = useCallback((students, afterIdx) => {
    const next = students.findIndex((s, i) => i > afterIdx && !s.already_marked);
    if (next !== -1) {
      setCurrentIdx(next);
      setMessage(`Ready for: ${students[next].name}`);
      setScanResult(null);
    } else {
      setMessage('✓ All students have been scanned!');
      setScanResult(null);
    }
  }, []);

  const handleScan = useCallback(async () => {
    if (!session || !stream || !modelReady || scanning) return;
    const image = captureFrame();
    if (!image) { setMessage('Camera not ready.'); return; }

    setScanning(true);
    setScanResult(null);
    setMessage('Scanning...');

    try {
      const { data } = await api.post('/api/face/recognize', {
        image_b64: image,
        subject: session.subject,
        session_id: session.session_id,
      }, { noCache: true });

      if (data.success && data.recognized) {
        const result = {
          name: data.student_name,
          roll_no: data.roll_no,
          already_marked: data.already_marked,
          expression: data.expression,
          expression_confidence: data.expression_confidence,
        };
        setScanResult(result);
        setMessage(data.already_marked ? `${data.student_name} — already marked` : `✓ ${data.student_name} marked present`);

        const updatedStudents = classStudents.map(s =>
          s.roll_no === data.roll_no ? { ...s, today_status: 'present', already_marked: true } : s
        );
        setClassStudents(updatedStudents);

        // Auto-advance after 1.5s
        autoScanRef.current = setTimeout(() => {
          advanceToNext(updatedStudents, currentIdx);
        }, 1500);
      } else {
        setScanResult({ recognized: false });
        setMessage(data.message || 'Face not recognized. Please reposition.');
        // Auto retry after 2s
        autoScanRef.current = setTimeout(() => {
          setScanning(false);
          handleScan();
        }, 2000);
        return;
      }
    } catch (err) {
      setScanResult({ recognized: false });
      setMessage(err.response?.data?.message || 'Scan failed.');
    } finally {
      setScanning(false);
    }
  }, [session, stream, modelReady, scanning, classStudents, currentIdx, advanceToNext]);

  const markedCount = classStudents.filter(s => s.already_marked || s.today_status === 'present').length;
  const allDone = classStudents.length > 0 && markedCount === classStudents.length;

  const exitSession = () => {
    stopCamera();
    clearTimeout(autoScanRef.current);
    setStep(1);
    setSession(null);
    setClassStudents([]);
    setScanResult(null);
    setMessage('');
    loadTodaySessions();
  };

  // ── Step 1: Session Setup ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="glass-card p-6 border-l-4 border-l-cyan-500">
          <h1 className="text-2xl font-bold mb-1">Face Attendance</h1>
          <p className="text-secondary text-sm">Create a session for a subject, then scan student faces.</p>
        </div>

        {/* Create Session Form */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Plus className="w-4 h-4 text-cyan-400" /> New Session</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-secondary block mb-1">Subject *</label>
              <select
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="glass-input w-full"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="glass-input w-full"
              />
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">Label (optional)</label>
              <input
                type="text"
                placeholder="e.g. Morning, Lab"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="glass-input w-full"
              />
            </div>
          </div>
          {message && <p className="text-sm text-red-400">{message}</p>}
          <button
            onClick={handleCreateSession}
            disabled={!form.subject || creating}
            className="glass-button bg-white text-black hover:bg-white/90 px-6 py-2.5 disabled:opacity-40"
          >
            {creating ? 'Creating...' : 'Create Session & Start Scanning'}
          </button>
        </div>

        {/* Today's Sessions */}
        {todaySessions.length > 0 && (
          <div className="glass-card p-6 space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-400" /> Today's Sessions</h2>
            {todaySessions.map(sess => (
              <div key={sess.session_id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <p className="font-medium">{sess.subject} {sess.label && <span className="text-secondary text-sm">· {sess.label}</span>}</p>
                  <p className="text-xs text-secondary">{sess.day}, {sess.date} · {sess.student_count} students · by {sess.created_by_name}</p>
                </div>
                <button
                  onClick={() => enterSession(sess)}
                  className="glass-button px-4 py-2 text-sm flex items-center gap-1"
                >
                  Resume <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Step 2: Face Scanning ──────────────────────────────────────────────────
  const currentStudent = classStudents[currentIdx];

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Session Header */}
      <div className="glass-card p-4 border-l-4 border-l-cyan-500 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">{session.subject} {session.label && `· ${session.label}`}</h1>
          <p className="text-secondary text-sm">{session.day}, {session.date} · {markedCount}/{classStudents.length} marked</p>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-emerald-400 font-semibold text-sm">{markedCount} present</span>
          <span className="text-amber-400 font-semibold text-sm">{classStudents.length - markedCount} pending</span>
          <button onClick={exitSession} className="glass-button px-4 py-2 text-sm text-red-400 border-red-500/30">
            End Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Panel */}
        <div className="space-y-4">
          {/* Current Student Indicator */}
          {currentStudent && !allDone && (
            <div className="glass-card p-4 border border-cyan-500/30 bg-cyan-500/5">
              <p className="text-xs text-secondary mb-1">Now scanning</p>
              <p className="font-semibold text-lg">{currentStudent.name}</p>
              <p className="text-sm text-secondary">{currentStudent.roll_no} · {currentStudent.department}</p>
              {!currentStudent.face_registered && (
                <p className="text-xs text-red-400 mt-1">⚠ No face registered</p>
              )}
            </div>
          )}

          <div className="glass-card overflow-hidden relative aspect-video bg-black/50 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            {stream && (
              <div className={`absolute inset-0 border-2 pointer-events-none transition-colors duration-300 ${
                scanning ? 'border-cyan-500 animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.5)]' :
                scanResult?.recognized === false ? 'border-red-500' :
                scanResult ? 'border-green-500' : 'border-white/20'
              }`} />
            )}
            {!stream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-secondary">
                <Camera className="w-12 h-12 mb-2 opacity-40" />
                <p className="text-sm">Camera off</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={stream ? stopCamera : startCamera}
              className="glass-button flex-1 py-3"
            >
              {stream ? 'Stop Camera' : 'Start Camera'}
            </button>
            <button
              onClick={handleScan}
              disabled={!modelReady || scanning || !stream || allDone}
              className="glass-button flex-1 bg-white py-3 text-black hover:bg-white/90 disabled:opacity-40"
            >
              {scanning ? 'Scanning...' : allDone ? 'All Done ✓' : 'Scan Face'}
            </button>
          </div>

          {/* Scan Result */}
          {(message || scanResult) && (
            <div className={`glass-card p-4 space-y-2 ${
              scanResult?.recognized === false ? 'border-red-500/30 bg-red-500/5' :
              scanResult?.already_marked ? 'border-amber-500/30 bg-amber-500/5' :
              scanResult ? 'border-green-500/30 bg-green-500/5' : ''
            }`}>
              <div className="flex items-center gap-2">
                {scanResult?.recognized === false && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                {scanResult?.already_marked && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
                {scanResult && scanResult.recognized !== false && !scanResult.already_marked && <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />}
                <span className="text-sm font-medium">{message}</span>
              </div>
              {scanResult?.name && (
                <div className="grid grid-cols-2 gap-1 text-sm pt-2 border-t border-white/10">
                  <span className="text-secondary">Name</span><span>{scanResult.name}</span>
                  <span className="text-secondary">Roll No</span><span>{scanResult.roll_no}</span>
                  {scanResult.expression && <>
                    <span className="text-secondary">Expression</span>
                    <span className="capitalize">{scanResult.expression} ({scanResult.expression_confidence}%)</span>
                  </>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="glass-card p-5 space-y-3 max-h-[600px] flex flex-col">
          <div className="flex items-center gap-2 shrink-0">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold">{session.subject} — Students</h2>
            <button onClick={async () => {
              const { data } = await api.get(`/api/face/class-students?subject=${encodeURIComponent(session.subject)}&session_id=${session.session_id}`, { noCache: true });
              setClassStudents(data.students || []);
            }} className="ml-auto text-secondary hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {classStudents.map((student, idx) => {
              const marked = student.already_marked || student.today_status === 'present';
              const isNext = idx === currentIdx && !marked;
              return (
                <div
                  key={student._id}
                  onClick={() => { if (!marked) { setCurrentIdx(idx); setScanResult(null); setMessage(`Ready for: ${student.name}`); } }}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all ${
                    isNext ? 'bg-cyan-500/15 border border-cyan-500/40 cursor-pointer' :
                    marked ? 'bg-emerald-500/10 border border-emerald-500/20' :
                    'bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      marked ? 'bg-emerald-500/20 text-emerald-400' :
                      isNext ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-white/10 text-secondary'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-secondary">{student.roll_no} · {student.department}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {marked ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Present</span>
                    ) : !student.face_registered ? (
                      <span className="text-xs text-red-400">No face</span>
                    ) : isNext ? (
                      <span className="text-xs text-cyan-400">→ Scanning</span>
                    ) : (
                      <span className="text-xs text-secondary">Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {allDone && (
            <div className="shrink-0 text-center py-3 text-emerald-400 font-semibold text-sm border-t border-white/10">
              ✓ All students marked for {session.subject}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
