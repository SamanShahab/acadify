import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, Book, Calendar, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { SkeletonStat, SkeletonCard } from '../../components/Skeleton';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/student/dashboard');
        setData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={1} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><SkeletonCard lines={4} /></div>
          <SkeletonCard lines={3} />
        </div>
      </div>
    );
  }

  if (!data || !data.student) {
    return <div className="text-red-400">Error loading dashboard data.</div>;
  }

  const { student, prediction: latest_pred, notifications, today_classes, upcoming_assignments, current_gpa, gpa_trend } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <h2 className="text-2xl font-bold mb-2">Welcome back, {student.user?.name || 'Student'}</h2>
        <p className="text-secondary max-w-2xl">
          {student.department} Department • Semester {student.semester}
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickAction title="Register Face" description="Set up your recognition profile" to="/face/register" />
        <QuickAction title="My Attendance" description="Review your attendance records" to="/student/attendance" />
        <QuickAction title="My Marks" description="Check your performance" to="/student/marks" />
        <QuickAction title="My Profile" description="Update your information" to="/student/profile" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Current GPA" value={current_gpa?.toFixed(2) || '0.00'} icon={Target} />
        <StatCard title="Attendance" value={`${student.attendance_pct?.toFixed(1) || '0.0'}%`} icon={Calendar} />
        <StatCard title="Assignments" value={`${student.assignments_submitted_pct || '0'}%`} icon={Book} />
        <StatCard 
          title="Risk Status" 
          value={student.risk_level || 'UNKNOWN'} 
          icon={AlertTriangle} 
          valueClass={student.risk_level === 'HIGH' ? 'text-red-400' : student.risk_level === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ML Prediction Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">AI Performance Forecast</h3>
            <Link to="/student/predictions" className="text-sm text-secondary hover:text-white flex items-center">
              View Details <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {latest_pred ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold tracking-tighter">{latest_pred.risk_score?.toFixed(1)}</div>
                <div>
                  <div className="text-sm text-secondary">Risk Score</div>
                  <div className="text-xs text-white/50">Model Confidence: {latest_pred.confidence}%</div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 text-secondary">Recommendations</h4>
                <ul className="space-y-2">
                  {latest_pred.recommendations?.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm bg-white/5 p-3 rounded-lg border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                      <span className="text-white/80">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-secondary border border-dashed border-white/10 rounded-xl">
              No recent AI predictions available.
            </div>
          )}
        </motion.div>

        {/* Notifications & Schedule */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-bold mb-4">Today's Schedule</h3>
            {today_classes && today_classes.length > 0 ? (
              <div className="space-y-3">
                {today_classes.map((cls, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <div>
                      <div className="font-medium text-sm">{cls.subject}</div>
                      <div className="text-xs text-secondary">{cls.type}</div>
                    </div>
                    <div className="text-sm font-mono text-secondary">{cls.time}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-secondary text-center py-4">No classes scheduled today.</div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, description, to }) {
  return (
    <Link to={to} className="glass-card p-4 hover:border-cyan-500/30 transition-colors block">
      <div className="text-sm font-medium text-white">{title}</div>
      <div className="mt-1 text-xs text-secondary">{description}</div>
    </Link>
  );
}

function StatCard({ title, value, icon: Icon, valueClass = '' }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-sm font-medium text-secondary">{title}</div>
        <div className="p-2 bg-white/5 rounded-lg">
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className={`text-3xl font-bold tracking-tight ${valueClass}`}>
        {value}
      </div>
    </motion.div>
  );
}
