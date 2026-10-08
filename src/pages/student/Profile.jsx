import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, BookOpen, Save, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export default function Profile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    department: '',
    semester: 1,
    phone: '',
    bio: ''
  });

  const fetchData = async () => {
    try {
      const response = await api.get('/student/profile');
      const data = response.data.student;
      setStudent(data);
      setForm({
        department: data.department || '',
        semester: data.semester || 1,
        phone: data.phone || '',
        bio: data.bio || ''
      });
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/student/profile', form);
      fetchData();
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-secondary">Loading profile...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-card p-6 border-l-4 border-l-cyan-500">
        <h2 className="text-2xl font-bold tracking-tight">Student Profile</h2>
        <p className="text-secondary mt-1">Manage your academic and personal information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <User className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-xl">{student?.name || 'Unknown'}</h3>
            <p className="text-secondary text-sm mt-1 mb-3">{student?.roll_no}</p>
            
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3 h-3" /> Active Student
            </div>
          </div>

          <div className="glass-card p-6">
            <h4 className="font-semibold text-sm text-secondary mb-4 uppercase tracking-wider">Metrics Overview</h4>
            <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-sm mb-1">
                   <span>Cumulative GPA</span>
                   <span className="font-bold">{student?.gpa?.toFixed(2)}</span>
                 </div>
                 <div className="h-1.5 bg-white/10 rounded-full"><div className="h-full bg-cyan-400" style={{width: `${(student?.gpa/4)*100}%`}}></div></div>
               </div>
               <div>
                 <div className="flex justify-between text-sm mb-1">
                   <span>Attendance</span>
                   <span className="font-bold">{student?.attendance_pct?.toFixed(1)}%</span>
                 </div>
                 <div className="h-1.5 bg-white/10 rounded-full"><div className="h-full bg-blue-400" style={{width: `${student?.attendance_pct}%`}}></div></div>
               </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-6 text-lg border-b border-white/10 pb-4">Edit Information</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm text-secondary">Department</label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 absolute left-3 top-3.5 text-secondary" />
                    <input type="text" value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="glass-input pl-10" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-secondary">Semester</label>
                  <select value={form.semester} onChange={e => setForm({...form, semester: parseInt(e.target.value)})} className="glass-input">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm text-secondary">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3.5 text-secondary" />
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="glass-input pl-10" placeholder="+1..." />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-secondary">Bio / About</label>
                <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} className="glass-input min-h-[100px]" placeholder="Tell us about your academic interests..." />
              </div>

              <div className="pt-4 border-t border-white/10">
                <button type="submit" disabled={saving} className="glass-button bg-white text-black py-3 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4"/> {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
