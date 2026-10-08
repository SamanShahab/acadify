import { useEffect, useRef, useState } from 'react';
import { Activity, Camera, HeartHandshake, ScanFace } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function FaceWellness() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [cameraOn, setCameraOn] = useState(false);
  const [message, setMessage] = useState('Start the camera when you are ready to check in.');
  const [result, setResult] = useState(null);
  const [report, setReport] = useState('');
  const [request, setRequest] = useState({ subject: 'Mental wellbeing support', urgency: 'normal', message: '', evidence: null });
  const [requestStatus, setRequestStatus] = useState('');
  const probabilityHistory = useRef([]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraOn(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus('ready');
      setMessage('Center your face in the frame, then run the self-check.');
    } catch {
      setStatus('error');
      setMessage('Camera access is unavailable. Check browser permissions and try again.');
    }
  };

  const runCheck = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) {
      setStatus('error');
      setMessage('The camera is not ready yet.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    setStatus('checking');
    setMessage('Analyzing facial expression...');
    setResult(null);

    try {
      const { data } = await api.post('/api/face/expression', { image_b64: canvas.toDataURL('image/jpeg') });
      if (!data.success) throw new Error(data.error || 'Expression check could not be completed.');
      probabilityHistory.current = [...probabilityHistory.current, data.probabilities || {}].slice(-3);
      const labels = [...new Set(probabilityHistory.current.flatMap((frame) => Object.keys(frame)))];
      const probabilities = Object.fromEntries(labels.map((label) => [label, probabilityHistory.current.reduce((sum, frame) => sum + Number(frame[label] || 0), 0) / probabilityHistory.current.length]));
      const best = Object.entries(probabilities).sort((left, right) => right[1] - left[1])[0];
      const prediction = best?.[0] || data.prediction;
      const confidence = best ? Math.round(best[1] * 1000) / 10 : data.confidence;
      const reportText = `EDU FACIAL-EXPRESSION SELF-CHECK\n\nGenerated: ${new Date().toLocaleString()}\nModel: Facial-expression classifier\nPrediction: ${prediction}\nConfidence: ${confidence}%${confidence < 60 ? ' (LOW CONFIDENCE)' : ''}\nFrames averaged: ${probabilityHistory.current.length}\n\nEXPRESSION PROBABILITIES\n${Object.entries(probabilities).sort((left, right) => right[1] - left[1]).map(([label, value]) => `${label}: ${Math.round(value * 100)}%`).join('\n')}\n\nIMPORTANT\nThis report describes facial-expression model output only. It is not medical evidence and cannot determine illness, stress, or mental health.`;
      setResult({ ...data, prediction, confidence, probabilities });
      setReport(reportText);
      setStatus('complete');
      setMessage(`Fresh analysis complete${probabilityHistory.current.length > 1 ? `; averaged over ${probabilityHistory.current.length} scans` : ''}. This result is an observation, not a diagnosis.`);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || err.message || 'Expression check failed.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    probabilityHistory.current = [];
    setCameraOn(false);
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  };

  const downloadReport = () => {
    const url = URL.createObjectURL(new Blob([report], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'facial-expression-self-check.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const submitSupportRequest = async (event) => {
    event.preventDefault();
    setRequestStatus('');
    const form = new FormData();
    form.append('subject', request.subject);
    form.append('urgency', request.urgency);
    form.append('message', request.message);
    form.append('expression_observation', result ? `${result.prediction} (${result.confidence}% model confidence; averaged over ${probabilityHistory.current.length} fresh frame(s))` : '');
    form.append('self_check_report', report);
    if (request.evidence) form.append('evidence', request.evidence);
    try {
      const { data } = await api.post('/student/counseling', form);
      const success = data._flashes?.find(([category]) => category === 'success')?.[1];
      setRequestStatus(success || 'Your support request was sent.');
      setRequest((current) => ({ ...current, message: '', evidence: null }));
    } catch (err) {
      setRequestStatus(err.response?.data?.error || 'Could not send the support request.');
    }
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-start gap-4 border-b border-white/10 pb-5">
        <HeartHandshake className="mt-1 h-7 w-7 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold">Expression Self-check</h1>
          <p className="mt-1 text-secondary">A private, optional check-in using facial-expression analysis.</p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden bg-black/60">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            {!cameraOn ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-secondary"><Camera className="h-10 w-10" /><span>Camera is off</span></div> : null}
            {cameraOn ? <div className="pointer-events-none absolute inset-0 border border-cyan-400/60" /> : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {!cameraOn ? <button type="button" onClick={startCamera} className="glass-button flex items-center gap-2 bg-white px-4 py-3 text-black"><Camera className="h-4 w-4" />Start camera</button> : <>
              <button type="button" disabled={status === 'checking'} onClick={runCheck} className="glass-button flex items-center gap-2 bg-white px-4 py-3 text-black disabled:opacity-50"><ScanFace className="h-4 w-4" />{status === 'checking' ? 'Checking...' : 'Run self-check'}</button>
              <button type="button" onClick={stopCamera} className="glass-button px-4 py-3">Turn camera off</button>
            </>}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="border-y border-white/10 py-5" aria-live="polite">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-cyan-400" />Check-in status</div>
            <p className={status === 'error' ? 'text-red-400' : 'text-secondary'}>{message}</p>
            {result ? <div className="mt-5 space-y-4">
              <div><div className="text-sm text-secondary">Detected expression</div><div className="mt-1 text-2xl font-semibold capitalize">{result.prediction}</div></div>
              <div><div className="mb-2 flex justify-between text-sm"><span className="text-secondary">Model confidence</span><span>{result.confidence}%</span></div><div className="h-1.5 bg-white/10"><div className="h-full bg-cyan-400" style={{ width: `${Math.min(100, result.confidence)}%` }} /></div></div>
              {result.probabilities ? <div className="space-y-2">{Object.entries(result.probabilities).map(([label, score]) => <div key={label} className="flex justify-between text-sm"><span className="capitalize text-secondary">{label}</span><span>{Math.round(Number(score) * 100)}%</span></div>)}</div> : null}
              <button type="button" onClick={downloadReport} className="glass-button px-4 py-2 text-sm">Download self-check report</button>
            </div> : null}
          </div>
          <p className="text-sm leading-6 text-secondary">Facial-expression models can be inaccurate and do not measure mental health. Your result is not a medical assessment. If you would like support, you can contact the counseling team.</p>
          <Link to="/student/counseling" className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-white"><HeartHandshake className="h-4 w-4" />Contact counseling</Link>
        </aside>
      </div>

      <section className="border-t border-white/10 pt-6">
        <h2 className="text-lg font-semibold">Need wellbeing support?</h2>
        <p className="mt-1 max-w-3xl text-sm text-secondary">Send a request in your own words. You may attach a PDF or image; the expression result is included as an observation only, never as medical proof.</p>
        <form onSubmit={submitSupportRequest} className="mt-5 max-w-3xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm text-secondary">Topic<select className="glass-input" value={request.subject} onChange={(event) => setRequest({ ...request, subject: event.target.value })}><option>Mental wellbeing support</option><option>Physical health support</option><option>Academic pressure support</option></select></label>
            <label className="block space-y-2 text-sm text-secondary">Response time<select className="glass-input" value={request.urgency} onChange={(event) => setRequest({ ...request, urgency: event.target.value })}><option value="normal">Within 24 hours</option><option value="high">As soon as possible</option><option value="low">Whenever convenient</option></select></label>
          </div>
          <label className="block space-y-2 text-sm text-secondary">Message<textarea className="glass-input min-h-28 resize-y" required value={request.message} onChange={(event) => setRequest({ ...request, message: event.target.value })} placeholder="Describe what support you need in your own words..." /></label>
          <label className="block space-y-2 text-sm text-secondary">Optional supporting document (PDF or image)<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setRequest({ ...request, evidence: event.target.files?.[0] || null })} /></label>
          <button className="glass-button bg-white px-5 py-3 text-black">Send support request</button>
          {requestStatus ? <p role="status" className="text-sm text-cyan-300">{requestStatus}</p> : null}
        </form>
      </section>
    </section>
  );
}