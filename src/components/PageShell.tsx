import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Props {
  title: string;
  children: React.ReactNode;
}

const NAV_LINKS = [
  { to: '/', label: 'Apply' },
  { to: '/member', label: 'Member Portal' },
  { to: '/admin', label: 'Admin' },
];

export const PageShell: React.FC<Props> = ({ title, children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── TOP BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #fff7ed 0%, #fff3e0 50%, #fff7ed 100%)',
        borderBottom: '3px solid #ea580c',
        padding: '10px 16px',
      }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}>
          {/* Logo — 1:1 placeholder, swap with logo.jpg when ready */}
          <div style={{
            width: 72,
            height: 72,
            flexShrink: 0,
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#ffedd5',
            border: '2px solid #fb923c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src="/logo.jpg"
              alt="BMA JK Logo"
              width={72}
              height={72}
              loading="eager"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          {/* Org name block */}
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontWeight: 800,
              fontSize: 'clamp(1rem, 3.5vw, 1.4rem)',
              color: '#9a3412',
              letterSpacing: '0.02em',
              lineHeight: 1.2,
              margin: 0,
            }}>
              Bhartiya Modi Army J&K
            </p>
            <p style={{
              fontSize: 'clamp(0.65rem, 2vw, 0.8rem)',
              color: '#c2410c',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              margin: '3px 0 0',
            }}>
              Nation First • Modi Forever
            </p>
          </div>
        </div>
      </div>

      {/* ── ORANGE NAV BAR ── */}
      <header className="bg-orange-600 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 w-full justify-center">
            {NAV_LINKS.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === l.to
                    ? 'bg-white text-orange-600'
                    : 'hover:bg-white/20 text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Mobile: label + hamburger */}
          <span className="sm:hidden text-sm font-semibold tracking-wide">Menu</span>
          <button
            className="sm:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/20 transition-colors"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-200 origin-center ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-200 origin-center ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Mobile dropdown */}
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

      {/* ── PAGE CONTENT ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Bhartiya Modi Army J&K
      </footer>
    </div>
  );
};
