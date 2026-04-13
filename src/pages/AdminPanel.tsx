import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PageShell } from '../components/PageShell';
import { Member, MemberStatus } from '../types';
import { OfficialForm } from '../components/OfficialForm';

interface AdminState {
  userId: string | null;
  isAdmin: boolean;
}

export const AdminPanel: React.FC = () => {
  const [admin, setAdmin] = useState<AdminState>({ userId: null, isAdmin: false });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MemberStatus>('pending');
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('admins')
          .select('id')
          .eq('auth_id', session.user.id)
          .maybeSingle();
        if (data) {
          setAdmin({ userId: session.user.id, isAdmin: true });
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (admin.isAdmin) {
      void loadMembers(activeTab);
    }
  }, [admin, activeTab]);

  const loadMembers = async (status: MemberStatus) => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      setErrorMsg('Failed to load members');
      return;
    }
    setMembers(data as Member[]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const user = data.user;
      const { data: adminRow } = await supabase
        .from('admins')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();
      if (!adminRow) {
        throw new Error('This account is not an admin');
      }
      setAdmin({ userId: user.id, isAdmin: true });
      await loadMembers(activeTab);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? 'Login failed');
    }
  };

  const handleApprove = async (member: Member) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.functions.invoke('approve-member', {
        body: { member_id: member.id },
      });
      if (error) throw error;
      await loadMembers(activeTab);
      setSelected(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? 'Approval failed');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (member: Member) => {
    const reason = window.prompt('Reason for rejection (optional):') ?? '';
    setBusy(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase
        .from('members')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', member.id);
      if (error) throw error;
      await loadMembers(activeTab);
      setSelected(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? 'Rejection failed');
    } finally {
      setBusy(false);
    }
  };

  const getSignedUrl = async (path: string | null) => {
    if (!path) return null;
    const { data, error } = await supabase.storage
      .from('member-files')
      .createSignedUrl(path, 3600);
    if (error) return null;
    return data.signedUrl;
  };

  if (loading) {
    return (
      <PageShell title="Admin Panel">
        <p>Loading...</p>
      </PageShell>
    );
  }

  if (!admin.isAdmin) {
    return (
      <PageShell title="Admin Login">
        <form className="space-y-3 max-w-sm" onSubmit={handleLogin}>
          <div className="flex flex-col text-sm">
            <label className="mb-1 font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex flex-col text-sm">
            <label className="mb-1 font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-medium hover:bg-orange-700"
          >
            Login as Admin
          </button>
        </form>
      </PageShell>
    );
  }

  return (
    <PageShell title="Admin Panel">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="flex gap-2 mb-3 text-sm">
            {(['pending', 'approved', 'rejected'] as MemberStatus[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-full border text-xs font-medium ${
                    activeTab === tab
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ),
            )}
          </div>
          <div className="border rounded-lg overflow-hidden text-xs sm:text-sm">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">District</th>
                  <th className="px-3 py-2 text-left">Applied</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className="border-t hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelected(m)}
                  >
                    <td className="px-3 py-2">{m.full_name}</td>
                    <td className="px-3 py-2">{m.email}</td>
                    <td className="px-3 py-2">{m.area_district}</td>
                    <td className="px-3 py-2">
                      {m.created_at ? m.created_at.slice(0, 10) : ''}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      No applications in this tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {errorMsg && (
            <p className="mt-2 text-xs text-red-600">{errorMsg}</p>
          )}
        </div>
        {selected && (
          <div className="w-full md:w-80 border rounded-lg p-3 text-xs space-y-2 bg-slate-50">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-sm">Application Details</h3>
              <button
                className="text-xs text-slate-500"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
            <p className="font-semibold">{selected.full_name}</p>
            <p>{selected.email}</p>
            <p>Designation: {selected.designation || '-'}</p>
            <p>Area/District: {selected.area_district || '-'}</p>
            <p>DOB: {selected.dob || '-'}</p>
            <p>Blood Group: {selected.blood_group || '-'}</p>
            <p>Contact: {selected.contact_no || '-'}</p>
            <p>Address: {selected.address || '-'}</p>
            {selected.rejection_reason && (
              <p>Rejection reason: {selected.rejection_reason}</p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                disabled={busy || selected.status === 'approved'}
                className="flex-1 px-2 py-1 rounded bg-green-600 text-white text-xs disabled:opacity-50"
                onClick={() => handleApprove(selected)}
              >
                Approve
              </button>
              <button
                disabled={busy || selected.status === 'rejected'}
                className="flex-1 px-2 py-1 rounded bg-red-600 text-white text-xs disabled:opacity-50"
                onClick={() => handleReject(selected)}
              >
                Reject
              </button>
            </div>
            <div className="mt-3 space-y-2">
              <AsyncImage label="Photo" path={selected.photo_url} getSignedUrl={getSignedUrl} />
              <AsyncImage label="Aadhaar Front" path={selected.aadhaar_front_url} getSignedUrl={getSignedUrl} />
              <AsyncImage label="Aadhaar Back" path={selected.aadhaar_back_url} getSignedUrl={getSignedUrl} />
            </div>
            <div className="mt-3 border-t pt-2">
              <OfficialForm member={selected} />
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

interface AsyncImageProps {
  label: string;
  path: string | null;
  getSignedUrl: (path: string | null) => Promise<string | null>;
}

const AsyncImage: React.FC<AsyncImageProps> = ({ label, path, getSignedUrl }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!path) return;
      const signed = await getSignedUrl(path);
      if (!cancelled) setUrl(signed);
    })();
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) return null;

  return (
    <div>
      <p className="text-[0.7rem] font-medium mb-1">{label}</p>
      {url ? (
        <img
          src={url}
          alt={label}
          className="w-full h-28 object-cover rounded border"
        />
      ) : (
        <p className="text-[0.7rem] text-slate-500">Loading...</p>
      )}
    </div>
  );
};
