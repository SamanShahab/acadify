import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';

const Logo = ({ size = 36 }) => (
  <div style={{ width: size, height: size }} className="flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-[0_4px_14px_rgba(22,163,74,0.35)] shrink-0">
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
      <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6">
      <nav className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 md:px-6 ${
        scrolled
          ? 'bg-white shadow-[0_4px_24px_rgba(20,83,45,0.12)] border border-green-100'
          : 'bg-white/80 backdrop-blur-xl border border-green-100/60 shadow-[0_2px_12px_rgba(20,83,45,0.06)]'
      }`}>

        <Link to="/" className="flex items-center gap-2.5" aria-label="Acadify home">
          <Logo size={36} />
          <span className="text-lg font-bold tracking-tight text-gray-900">Acadify</span>
        </Link>

        <div className="hidden items-center gap-7 text-sm text-gray-500 md:flex">
          <a href="/#features" className="hover:text-green-600 transition-colors">Features</a>
          <a href="/#ai-models" className="hover:text-green-600 transition-colors">AI Models</a>
          <a href="/#about" className="hover:text-green-600 transition-colors">About</a>
          <a href="/#security" className="hover:text-green-600 transition-colors">Security</a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
            Sign In
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(22,163,74,0.3)] hover:shadow-[0_4px_20px_rgba(22,163,74,0.45)] hover:-translate-y-0.5 transition-all duration-200"
          >
            Access Portal <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-green-100 bg-green-50 text-green-700 md:hidden"
          onClick={() => setIsOpen(v => !v)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {isOpen && (
        <div className="mx-auto mt-2 max-w-6xl rounded-2xl border border-green-100 bg-white p-4 shadow-lg md:hidden">
          <div className="flex flex-col gap-3 text-sm text-gray-600">
            <a href="/#features" onClick={() => setIsOpen(false)} className="hover:text-green-600">Features</a>
            <a href="/#ai-models" onClick={() => setIsOpen(false)} className="hover:text-green-600">AI Models</a>
            <a href="/#about" onClick={() => setIsOpen(false)} className="hover:text-green-600">About</a>
            <a href="/#security" onClick={() => setIsOpen(false)} className="hover:text-green-600">Security</a>
            <div className="mt-2 flex gap-3">
              <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1 rounded-full border border-green-200 px-4 py-2 text-center text-gray-700 hover:bg-green-50">
                Sign In
              </Link>
              <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-center font-semibold text-white">
                Access Portal
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
