import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Member, MemberStatus } from '../types';
import { OfficialForm } from '../components/OfficialForm';

// ─── Tiny reusable pieces ────────────────────────────────────────────────────

const Badge: React.FC<{ status: MemberStatus }> = ({ status }) => {
  const map = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>{status.toUpperCase()}</span>;
};

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</span>
    <span className="text-sm text-slate-800">{value || '—'}</span>
  </div>
);

/* ── Admin Lightbox ──────────────────────────────────────────────────────── */
const AdminLightbox: React.FC<{ src: string; label: string; onClose: () => void }> = ({ src, label, onClose }) => {
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.90)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      role="dialog" aria-modal="true"
    >
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: 'min(94vw,800px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: -48, right: 0, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 38, height: 38, fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >×</button>
        <img src={src} alt={label} style={{ maxWidth: '100%', maxHeight: '82dvh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }} />
        <p style={{ marginTop: 14, color: '#e5e7eb', fontSize: 13, letterSpacing: '0.03em' }}>{label}</p>
      </div>
    </div>
  );
};

interface AsyncImageProps { label: string; path: string | null; bucket?: string; }
const AsyncImage: React.FC<AsyncImageProps> = ({ label, path, bucket = 'member-files' }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (path) {
      supabase.storage.from(bucket).createSignedUrl(path, 3600)
        .then(({ data, error }) => { if (!cancelled && !error) setUrl(data!.signedUrl); });
    }
    return () => { cancelled = true; };
  }, [path, bucket]);
  if (!path) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium mb-1">{label}</p>
      {url ? (
        <>
          <div style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => setLightbox(true)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <img
              src={url} alt={label}
              className="w-full h-36 object-cover rounded-lg border border-slate-200"
              style={{ transition: 'opacity 0.15s', opacity: hovered ? 0.82 : 1 }}
            />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: hovered ? 1 : 0, transition: 'opacity 0.15s',
              background: 'rgba(0,0,0,0.35)',
            }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 20 }}>
                🔍 View Full
              </span>
            </div>
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Click to enlarge</p>
          {lightbox && <AdminLightbox src={url} label={label} onClose={() => setLightbox(false)} />}
        </>
      ) : (
        <div className="w-full h-36 rounded-lg bg-slate-100 animate-pulse" />
      )}
    </div>
  );
};

// ─── Form Modal ──────────────────────────────────────────────────────────────

interface FormModalProps {
  member: Member;
  onClose: () => void;
  onApprove: (m: Member) => void;
  onReject: (m: Member) => void;
  busy: boolean;
}

const FormModal: React.FC<FormModalProps> = ({ member, onClose, onApprove, onReject, busy }) => {
  const [designation, setDesignation] = useState(member.designation || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [showAadhaar, setShowAadhaar] = useState(false);

  const handleSaveDesignation = async () => {
    setSaving(true); setSaveMsg(null);
    const { error } = await supabase.from('members').update({ designation }).eq('id', member.id);
    setSaving(false);
    setSaveMsg(error ? 'Failed to save.' : 'Saved!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <p className="font-bold text-slate-800 text-lg">{member.full_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge status={member.status as MemberStatus} />
              {member.status === 'pending'
                ? <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">Membership No.: Not assigned yet</span>
                : member.membership_number
                  ? <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">{member.membership_number}</span>
                  : null
              }
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 text-xl">×</button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto">

          {/* Official Form */}
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-3">Official Form</p>
            <OfficialForm member={{ ...member, designation }} />
          </div>

          {/* Admin: assign Designation */}
          <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Admin — Assign Designation</p>
            <div className="flex gap-2 items-end">
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium text-slate-600 mb-1">Designation</label>
                <input
                  value={designation}
                  onChange={e => { setDesignation(e.target.value); setSaveMsg(null); }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. District President…"
                />
              </div>
              <button
                onClick={handleSaveDesignation}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            {saveMsg && <p className="text-xs text-green-600">{saveMsg}</p>}
          </div>

          {/* View Aadhaar toggle */}
          <div>
            <button
              onClick={() => setShowAadhaar(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/></svg>
              {showAadhaar ? 'Hide Aadhaar' : 'View Aadhaar Card'}
            </button>
            {showAadhaar && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <AsyncImage label="Aadhaar Front" path={member.aadhaar_front_url} />
                <AsyncImage label="Aadhaar Back" path={member.aadhaar_back_url} />
              </div>
            )}
          </div>

          {/* Approve / Reject */}
          {member.status === 'pending' && (
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                disabled={busy}
                onClick={() => onApprove(member)}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {busy ? 'Processing…' : '✓ Approve'}
              </button>
              <button
                disabled={busy}
                onClick={() => onReject(member)}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                ✕ Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

export const AdminPanel: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<MemberStatus | 'create-admin'>('pending');
  const [members, setMembers] = useState<Member[]>([]);
  const [formMember, setFormMember] = useState<Member | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [createMsg, setCreateMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.role === 'admin') setIsAdmin(true);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab !== 'create-admin') loadMembers(activeTab as MemberStatus);
  }, [isAdmin, activeTab]);

  const loadMembers = async (status: MemberStatus) => {
    setMembers([]);
    const { data, error } = await supabase.from('members').select('*').eq('status', status).order('created_at', { ascending: false });
    if (!error) setMembers(data as Member[]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoginError(error.message); return; }
    if (data.user?.user_metadata?.role !== 'admin') {
      await supabase.auth.signOut();
      setLoginError('This account is not an admin.');
      return;
    }
    setIsAdmin(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false); setFormMember(null); setMembers([]);
  };

  const handleApprove = async (member: Member) => {
    setBusy(true); setActionMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('approve-member', {
        body: { member_id: member.id },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setActionMsg({ type: 'ok', text: `Approved! Membership: ${data.membership_number}` });
      await loadMembers(activeTab as MemberStatus);
      setFormMember(null);
    } catch (err: any) {
      setActionMsg({ type: 'err', text: err.message ?? 'Approval failed' });
    } finally { setBusy(false); }
  };

  const handleReject = async (member: Member) => {
    const confirmed = window.confirm(
      '⚠️ Warning: Rejecting this application will permanently delete all submitted data and uploaded documents. This action cannot be undone.\n\nAre you sure you want to reject and delete this application?'
    );
    if (!confirmed) return;
    setBusy(true); setActionMsg(null);
    try {
      const { error } = await supabase.from('members').delete().eq('id', member.id);
      if (error) throw error;
      setActionMsg({ type: 'ok', text: 'Application rejected and permanently deleted.' });
      await loadMembers(activeTab as MemberStatus);
      setFormMember(null);
    } catch (err: any) {
      setActionMsg({ type: 'err', text: err.message ?? 'Rejection failed' });
    } finally { setBusy(false); }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault(); setCreateMsg(null); setCreateBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: { email: newAdminEmail, password: newAdminPassword },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setCreateMsg({ type: 'ok', text: `Admin created: ${newAdminEmail}` });
      setNewAdminEmail(''); setNewAdminPassword('');
    } catch (err: any) {
      setCreateMsg({ type: 'err', text: err.message ?? 'Failed' });
    } finally { setCreateBusy(false); }
  };

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.area_district ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const TABS: { key: MemberStatus | 'create-admin'; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'create-admin', label: '+ New Admin' },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-500 text-sm">Loading…</p>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-orange-600 text-white py-3 shadow">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div>
            <p className="text-base font-bold tracking-wide">Bhartiya Modi Army J&K</p>
            <p className="text-[11px] uppercase tracking-widest opacity-80">Nation First • Modi Forever</p>
          </div>
          <nav className="flex gap-5 text-sm">
            <Link to="/" className="hover:underline">Apply</Link>
            <Link to="/member" className="hover:underline">Member Portal</Link>
          </nav>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Admin Login</h2>
          <p className="text-sm text-slate-500 mb-6">Restricted to authorised personnel only.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            {loginError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{loginError}</p>}
            <button type="submit" className="w-full py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors">Login</button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">

      {/* Form Modal */}
      {formMember && (
        <FormModal
          member={formMember}
          onClose={() => { setFormMember(null); setActionMsg(null); }}
          onApprove={handleApprove}
          onReject={handleReject}
          busy={busy}
        />
      )}

      <header className="bg-orange-600 text-white shadow sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <p className="text-base font-bold tracking-wide">Bhartiya Modi Army J&K</p>
            <p className="text-[11px] uppercase tracking-widest opacity-80">Admin Panel</p>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex gap-5 text-sm">
              <Link to="/" className="hover:underline opacity-90">Public Form</Link>
              <Link to="/member" className="hover:underline opacity-90">Member Portal</Link>
            </nav>
            <button onClick={handleLogout} className="text-xs bg-orange-700 hover:bg-orange-800 px-3 py-1.5 rounded-lg transition-colors">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-4">

        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setFormMember(null); setActionMsg(null); setSearch(''); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
                activeTab === t.key
                  ? t.key === 'create-admin' ? 'bg-slate-800 text-white border-slate-800' : 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-orange-400'
              }`}>
              {t.label}
              {t.key !== 'create-admin' && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === t.key ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {activeTab === t.key ? filtered.length : ''}
                </span>
              )}
            </button>
          ))}
        </div>

        {actionMsg && (
          <div className={`text-sm px-4 py-3 rounded-xl ${
            actionMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>{actionMsg.text}</div>
        )}

        {activeTab === 'create-admin' ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Create New Admin</h3>
            <p className="text-sm text-slate-500 mb-6">This account will have full admin access.</p>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input type="email" required value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <input type="password" required minLength={6} value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
              </div>
              {createMsg && (
                <p className={`text-xs px-3 py-2 rounded-lg ${
                  createMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>{createMsg.text}</p>
              )}
              <button type="submit" disabled={createBusy}
                className="w-full py-2.5 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:opacity-50 transition-colors">
                {createBusy ? 'Creating…' : 'Create Admin'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input type="text" placeholder="Search by name, email or district…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 text-left font-semibold">Name</th>
                  <th className="px-5 py-3 text-left font-semibold hidden md:table-cell">District</th>
                  <th className="px-5 py-3 text-left font-semibold hidden lg:table-cell">Applied</th>
                  <th className="px-5 py-3 text-left font-semibold hidden lg:table-cell">Membership #</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{m.full_name}</p>
                      <p className="text-xs text-slate-400">{m.email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{m.area_district || '—'}</td>
                    <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{(m.created_at || '').slice(0, 10)}</td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      {m.membership_number
                        ? <span className="text-orange-600 font-semibold text-xs bg-orange-50 px-2 py-0.5 rounded-full">{m.membership_number}</span>
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => { setFormMember(m); setActionMsg(null); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-xs font-semibold hover:bg-orange-100 transition-colors border border-orange-200"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        View Form
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">No {activeTab} applications.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="py-4 text-center text-xs text-slate-400">© {new Date().getFullYear()} Bhartiya Modi Army J&K</footer>
    </div>
  );
};
