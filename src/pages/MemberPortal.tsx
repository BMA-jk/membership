import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PageShell } from '../components/PageShell';
import { IDCard } from '../components/IDCard';
import { Member } from '../types';

export const MemberPortal: React.FC = () => {
  const [email, setEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        await loadMember(session.user.id, session.user.email || undefined);
      }
      setLoading(false);
    };
    init();

    // also handle magic link redirect (hash fragment)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        setUserId(session.user.id);
        setLoading(true);
        await loadMember(session.user.id, session.user.email || undefined);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadMember = async (authId: string, userEmail?: string) => {
    setErrorMsg(null);

    // Step 1: try to self-link auth_id on the member row (works if status=pending OR new policy)
    if (userEmail) {
      await supabase
        .from('members')
        .update({ auth_id: authId })
        .eq('email', userEmail)
        .is('auth_id', null);
    }

    // Step 2: query by auth_id first
    let { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle();

    // Step 3: fallback — query by email (covers case where auth_id update was blocked)
    if (!data && !error && userEmail) {
      const res = await supabase
        .from('members')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
      data = res.data;
      error = res.error;
    }

    if (error) {
      setErrorMsg('Could not load your membership.');
      return;
    }
    if (!data) {
      setErrorMsg('No membership found for this email. Please ensure your application has been submitted.');
      return;
    }

    setMember(data as Member);
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + '/member' },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Could not send link');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setMember(null);
    setErrorMsg(null);
  };

  // ── Loading
  if (loading) return (
    <PageShell title="Member Portal">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading your membership…
      </div>
    </PageShell>
  );

  // ── Not logged in
  if (!userId) return (
    <PageShell title="Member Login">
      <div className="max-w-sm">
        <p className="text-sm text-slate-600 mb-4">
          Enter your registered email to receive a secure magic login link.
        </p>
        <form onSubmit={handleSendMagicLink} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          {errorMsg && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errorMsg}</p>}
          <button type="submit"
            className="w-full py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors">
            Send Magic Link
          </button>
          {magicSent && (
            <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              ✓ Magic link sent — check your email inbox.
            </p>
          )}
        </form>
      </div>
    </PageShell>
  );

  // ── Logged in but no member found
  if (!member) return (
    <PageShell title="Member Portal">
      <div className="max-w-sm">
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4">
          {errorMsg || 'No membership found.'}
        </p>
        <button onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-red-600 underline">
          Logout and try a different email
        </button>
      </div>
    </PageShell>
  );

  // ── Pending / Rejected state
  if (member.status !== 'approved') return (
    <PageShell title="Member Portal">
      <div className="max-w-sm">
        {member.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-4">
            <p className="text-sm font-semibold text-yellow-800 mb-1">Application Under Review</p>
            <p className="text-xs text-yellow-700">Your application has been submitted and is currently being reviewed by the admin. You will be notified once it is approved.</p>
          </div>
        )}
        {member.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4">
            <p className="text-sm font-semibold text-red-800 mb-1">Application Rejected</p>
            {member.rejection_reason && (
              <p className="text-xs text-red-700">Reason: {member.rejection_reason}</p>
            )}
          </div>
        )}
        <button onClick={handleLogout} className="mt-4 text-xs text-slate-500 hover:text-red-600 underline">
          Logout
        </button>
      </div>
    </PageShell>
  );

  // ── Approved member dashboard
  return (
    <PageShell title="Your Membership">
      <div className="flex justify-end mb-4">
        <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-600 underline">Logout</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Info */}
        <div className="space-y-3">
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Membership Number</p>
            <p className="text-2xl font-bold text-orange-700 mt-0.5">{member.membership_number}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Name', member.full_name],
              ['Designation', member.designation],
              ['District', member.area_district],
              ['Date of Birth', member.dob],
              ['Blood Group', member.blood_group],
              ['Contact', member.contact_no],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</span>
                <span className="text-slate-800">{value || '—'}</span>
              </div>
            ))}
            <div className="col-span-2 flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Address</span>
              <span className="text-slate-800">{member.address || '—'}</span>
            </div>
          </div>
        </div>
        {/* ID Card */}
        <div>
          <IDCard member={member} />
        </div>
      </div>
    </PageShell>
  );
};
