import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { PublicRegistration } from './pages/PublicRegistration';
import { MemberPortal } from './pages/MemberPortal';
import { AdminPanel } from './pages/AdminPanel';
import { CardPage } from './pages/CardPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRegistration />} />
        <Route path="/member" element={<MemberPortal />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/card" element={<CardPage />} />
      </Routes>
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
