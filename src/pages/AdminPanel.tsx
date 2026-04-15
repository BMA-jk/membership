import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Member, MemberStatus } from '../types';
import { OfficialForm } from '../components/OfficialForm';

// ─── Tiny reusable pieces ────────────────────────────────────────────────────

const Badge: React.FC<{ status: MemberStatus }> = ({ status }) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>
      {status.toUpperCase()}
    </span>
  );
};

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</span>
    <span className="text-sm text-slate-800">{value || '—'}</span>
  </div>
);

interface AsyncImageProps {
  label: string;
  path: string | null;
  getSignedUrl: (p: string | null) => Promise<string | null>;
}
const AsyncImage: React.FC<AsyncImageProps> = ({ label, path, getSignedUrl }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (path) getSignedUrl(path).then(u => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [path]);
  if (!path) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium mb-1">{label}</p>
      {url
        ? <img src={url} alt={label} className="w-full h-36 object-cover rounded-lg border border-slate-200" />
        : <div className="w-full h-36 rounded-lg bg-slate-100 animate-pulse" />}
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
  const [selected, setSelected] = useState<Member | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [createMsg, setCreateMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  // ── Auth init ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.role === 'admin') setIsAdmin(true);
      setLoading(false);
    });
  }, []);

  // ── Load members when tab changes ──
  useEffect(() => {
    if (isAdmin && activeTab !== 'create-admin') loadMembers(activeTab as MemberStatus);
  }, [isAdmin, activeTab]);

  const loadMembers = async (status: MemberStatus) => {
    const { data, error } = await supabase
      .from('members').select('*').eq('status', status)
      .order('created_at', { ascending: false });
    if (!error) setMembers(data as Member[]);
  };

  // ── Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
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
    setIsAdmin(false);
    setSelected(null);
    setMembers([]);
  };

  // ── Approve ──
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
      setSelected(null);
    } catch (err: any) {
      setActionMsg({ type: 'err', text: err.message ?? 'Approval failed' });
    } finally { setBusy(false); }
  };

  // ── Reject ──
  const handleReject = async (member: Member) => {
    const reason = window.prompt('Reason for rejection (optional):') ?? '';
    setBusy(true); setActionMsg(null);
    try {
      const { error } = await supabase.from('members')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', member.id);
      if (error) throw error;
      setActionMsg({ type: 'ok', text: 'Member rejected.' });
      await loadMembers(activeTab as MemberStatus);
      setSelected(null);
    } catch (err: any) {
      setActionMsg({ type: 'err', text: err.message ?? 'Rejection failed' });
    } finally { setBusy(false); }
  };

  // ── Create admin ──
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

  const getSignedUrl = async (path: string | null) => {
    if (!path) return null;
    const { data, error } = await supabase.storage.from('member-files').createSignedUrl(path, 3600);
    return error ? null : data.signedUrl;
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

  // ════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ════════════════════════════════════════════════════════════════
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-500 text-sm">Loading…</p>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col">
      {/* header */}
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
      {/* login card */}
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
            <button type="submit"
              className="w-full py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // ADMIN DASHBOARD
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">

      {/* ── Top bar ── */}
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
            <button onClick={handleLogout}
              className="text-xs bg-orange-700 hover:bg-orange-800 px-3 py-1.5 rounded-lg transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-[1400px] mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-4">

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSelected(null); setActionMsg(null); setSearch(''); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
                activeTab === t.key
                  ? t.key === 'create-admin'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-orange-600 text-white border-orange-600'
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

        {/* ── Action feedback ── */}
        {actionMsg && (
          <div className={`text-sm px-4 py-3 rounded-xl ${
            actionMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {actionMsg.text}
          </div>
        )}

        {/* ══ CREATE ADMIN TAB ══ */}
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
          /* ══ MEMBERS TAB ══ */
          <div className="flex gap-4 flex-1 min-h-0">

            {/* ── Left: member list ── */}
            <div className="flex flex-col gap-3 flex-1 min-w-0">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input type="text" placeholder="Search by name, email or district…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3 text-left font-semibold">Name</th>
                      <th className="px-5 py-3 text-left font-semibold">Email</th>
                      <th className="px-5 py-3 text-left font-semibold hidden md:table-cell">District</th>
                      <th className="px-5 py-3 text-left font-semibold hidden lg:table-cell">Applied</th>
                      <th className="px-5 py-3 text-left font-semibold hidden lg:table-cell">Membership #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(m => (
                      <tr key={m.id}
                        onClick={() => { setSelected(m); setActionMsg(null); }}
                        className={`border-b border-slate-100 cursor-pointer transition-colors ${
                          selected?.id === m.id ? 'bg-orange-50' : 'hover:bg-slate-50'
                        }`}>
                        <td className="px-5 py-3 font-medium text-slate-800">{m.full_name}</td>
                        <td className="px-5 py-3 text-slate-500">{m.email}</td>
                        <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{m.area_district || '—'}</td>
                        <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{(m.created_at || '').slice(0, 10)}</td>
                        <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{m.membership_number || '—'}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">
                          No {activeTab} applications.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Right: detail panel ── */}
            {selected && (
              <div className="w-[380px] shrink-0 bg-white rounded-2xl shadow-sm overflow-y-auto max-h-[calc(100vh-160px)] flex flex-col">

                {/* Panel header */}
                <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-base leading-tight">{selected.full_name}</p>
                    <Badge status={selected.status as MemberStatus} />
                  </div>
                  <button onClick={() => setSelected(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 text-lg leading-none">
                    ×
                  </button>
                </div>

                <div className="px-5 py-4 flex flex-col gap-5">

                  {/* Actions */}
                  {selected.status === 'pending' && (
                    <div className="flex gap-2">
                      <button disabled={busy} onClick={() => handleApprove(selected)}
                        className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
                        {busy ? 'Processing…' : '✓ Approve'}
                      </button>
                      <button disabled={busy} onClick={() => handleReject(selected)}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                        ✕ Reject
                      </button>
                    </div>
                  )}

                  {/* Personal info */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email" value={selected.email} />
                    <Field label="Contact" value={selected.contact_no} />
                    <Field label="Date of Birth" value={selected.dob} />
                    <Field label="Blood Group" value={selected.blood_group} />
                    <Field label="Designation" value={selected.designation} />
                    <Field label="District" value={selected.area_district} />
                    <div className="col-span-2">
                      <Field label="Address" value={selected.address} />
                    </div>
                    {selected.membership_number && (
                      <div className="col-span-2">
                        <Field label="Membership Number" value={selected.membership_number} />
                      </div>
                    )}
                    {selected.rejection_reason && (
                      <div className="col-span-2">
                        <Field label="Rejection Reason" value={selected.rejection_reason} />
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div className="flex flex-col gap-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Documents</p>
                    <AsyncImage label="Photo" path={selected.photo_url} getSignedUrl={getSignedUrl} />
                    <AsyncImage label="Aadhaar Front" path={selected.aadhaar_front_url} getSignedUrl={getSignedUrl} />
                    <AsyncImage label="Aadhaar Back" path={selected.aadhaar_back_url} getSignedUrl={getSignedUrl} />
                  </div>

                  {/* Official form */}
                  {selected.status === 'approved' && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Official Form</p>
                      <OfficialForm member={selected} />
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Bhartiya Modi Army J&K
      </footer>
    </div>
  );
};
