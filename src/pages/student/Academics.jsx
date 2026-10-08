import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { SkeletonCard, SkeletonStat } from '../../components/Skeleton';

export default function Academics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/student/academics');
        setData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <SkeletonCard lines={1} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonStat /><SkeletonStat />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard lines={4} /><SkeletonCard lines={4} />
      </div>
    </div>
  );
  if (!data?.student) return <div className="p-8 text-red-400">Error loading academics</div>;

  const { student, prediction } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="glass-card p-6 border-l-4 border-l-blue-500">
        <h2 className="text-2xl font-bold tracking-tight">Academic Forecast</h2>
        <p className="text-secondary mt-1">Personalized performance modeling based on your historical data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-8 bg-blue-500/5">
          <div className="text-sm font-medium text-secondary mb-2">CURRENT CUMULATIVE GPA</div>
          <div className="text-5xl font-black">{student.gpa?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="glass-card p-8 bg-cyan-500/5">
          <div className="text-sm font-medium text-secondary mb-2">PREDICTED SEMESTER GRADE TIER</div>
          <div className="text-4xl font-bold text-cyan-400">
            {prediction?.performance_forecast?.grade_tier || 'A- / Excellent'}
          </div>
        </div>
      </div>

      {prediction ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" /> Risk Assessment
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                  <div className="text-sm text-secondary">Computed Risk Level</div>
                  <div className={`text-2xl font-bold mt-1 ${
                    prediction.risk_level === 'HIGH' ? 'text-red-400' :
                    prediction.risk_level === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {prediction.risk_level} RISK
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-secondary">Risk Score</div>
                  <div className="text-xl font-bold">{prediction.risk_score?.toFixed(1)} / 100</div>
                </div>
              </div>
              <div className="pt-2 text-sm text-secondary leading-relaxed">
                <ShieldCheck className="inline-block w-4 h-4 mr-1 mb-0.5" /> 
                Model Confidence: {prediction.confidence}% • v{prediction.model_version}
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-secondary" /> AI Recommendations
            </h3>
            <ul className="space-y-3">
              {prediction.recommendations?.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg text-sm">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <span className="text-white/80">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-secondary">
          No prediction data available yet. Use the Predict tool to generate a forecast.
        </div>
      )}
    </div>
  );
}
