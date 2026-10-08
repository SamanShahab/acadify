import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Loader({ onDone }) {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExit(true), 2600);
    const t2 = setTimeout(() => onDone(), 3200);
    return () => [t1, t2].forEach(clearTimeout);
  }, []);

  const letters = 'Acadify'.split('');

  return (
    <AnimatePresence>
      {!exit ? (
        <motion.div
          key="loader"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#f8faf8' }}
        >
          {/* Animated green rings */}
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-emerald-200"
              initial={{ width: 80, height: 80, opacity: 0.6 }}
              animate={{ width: 80 + i * 140, height: 80 + i * 140, opacity: 0 }}
              transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}

          {/* Center logo */}
          <motion.div
            initial={{ scale: 0, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-[0_8px_40px_rgba(22,163,74,0.45)] mb-8"
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <motion.path
                d="M12 2L2 7l10 5 10-5-10-5z"
                fill="white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              />
              <motion.path
                d="M2 17l10 5 10-5"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
              <motion.path
                d="M2 12l10 5 10-5"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              />
            </svg>

            {/* Glow pulse */}
            <motion.div
              className="absolute inset-0 rounded-3xl bg-emerald-400"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          {/* Staggered letter reveal */}
          <div className="relative z-10 flex items-center gap-[2px] mb-3">
            {letters.map((l, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.6 + i * 0.07, duration: 0.4, ease: 'easeOut' }}
                className="text-5xl font-black tracking-tight text-gray-900"
              >
                {l}
              </motion.span>
            ))}
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.5 }}
            className="relative z-10 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 mb-10"
          >
            Intelligence Engine
          </motion.p>

          {/* Animated dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="relative z-10 flex gap-2"
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-emerald-500"
                animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
