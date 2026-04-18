import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Props {
  title: string;
  children: React.ReactNode;
}

const NAV_LINKS = [
  { to: '/', label: 'Apply' },
  { to: '/member', label: 'Member Portal' },
];

export const PageShell: React.FC<Props> = ({ title, children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-orange-600 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">

          {/* Logo + Org Name */}
          <Link to="/" className="flex items-center gap-2.5 min-w-0" style={{ textDecoration: 'none', color: 'inherit' }}>
            {/* Logo: saffron lotus SVG — works at any size, no image load */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="BMA JK Logo" style={{ flexShrink: 0 }}>
              <circle cx="20" cy="20" r="20" fill="white" opacity="0.15"/>
              {/* Lotus petals */}
              <ellipse cx="20" cy="24" rx="4" ry="9" fill="white" opacity="0.9" transform="rotate(0 20 20)"/>
              <ellipse cx="20" cy="24" rx="4" ry="9" fill="white" opacity="0.75" transform="rotate(45 20 20)"/>
              <ellipse cx="20" cy="24" rx="4" ry="9" fill="white" opacity="0.75" transform="rotate(-45 20 20)"/>
              <ellipse cx="20" cy="24" rx="4" ry="9" fill="white" opacity="0.6" transform="rotate(90 20 20)"/>
              <ellipse cx="20" cy="24" rx="4" ry="9" fill="white" opacity="0.6" transform="rotate(-90 20 20)"/>
              {/* Centre circle */}
              <circle cx="20" cy="20" r="5" fill="#f97316"/>
              <circle cx="20" cy="20" r="3" fill="white" opacity="0.9"/>
            </svg>

            {/* Org text — truncated on very small screens */}
            <div className="min-w-0">
              <p className="font-bold tracking-wide leading-tight text-sm sm:text-base truncate">
                Bhartiya Modi Army J&K
              </p>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider opacity-80 hidden sm:block">
                Nation First • Modi Forever
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === l.to
                    ? 'bg-white text-orange-600'
                    : 'hover:bg-white/20 text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex flex-col gap-1 p-2 rounded-lg hover:bg-white/20 transition-colors"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="sm:hidden bg-orange-700 px-4 pb-3 flex flex-col gap-1">
            {NAV_LINKS.map(l => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === l.to
                    ? 'bg-white text-orange-600'
                    : 'hover:bg-white/20 text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-800">{title}</h2>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Bhartiya Modi Army J&K
      </footer>
    </div>
  );
};
