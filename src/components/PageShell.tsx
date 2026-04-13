import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
  title: string;
  children: React.ReactNode;
}

export const PageShell: React.FC<Props> = ({ title, children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-orange-600 text-white py-3 shadow">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-wide">
              Bhartiya Modi Army J&K
            </h1>
            <p className="text-xs uppercase">Nation First • Modi Forever</p>
          </div>
          <nav className="space-x-4 text-sm">
            <Link to="/" className="hover:underline">
              Apply
            </Link>
            <Link to="/member" className="hover:underline">
              Member Portal
            </Link>
            <Link to="/admin" className="hover:underline">
              Admin
            </Link>
          </nav>
        </div>
      </header>
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
