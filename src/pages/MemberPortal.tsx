import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PageShell } from '../components/PageShell';
import { IDCard } from '../components/IDCard';
import { Member } from '../types';

const LAST_EMAIL_KEY = 'mp_last_email';

export const MemberPortal: React.FC = () => {
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem(LAST_EMAIL_KEY) || ''; } catch { return ''; }
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showCard, setShowCard] = useState(false);

  // Rejoin state
  const [rejoinMessage, setRejoinMessage] = useState('');
  const [rejoinSubmitting, setRejoinSubmitting] = useState(false);
  const [rejoinDone, setRejoinDone] = useState(false);
  const [rejoinError, setRejoinError] = useState<string | null>(null);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        setUserId(session.user.id);
        try {
          if (session.user.email) localStorage.setItem(LAST_EMAIL_KEY, session.user.email);
        } catch { /* ignore */ }
        setLoading(true);
        await loadMember(session.user.id, session.user.email || undefined);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setMember(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadMember = async (authId: string, userEmail?: string) => {
    setErrorMsg(null);
    if (userEmail) {
      await supabase
        .from('members')
        .update({ auth_id: authId })
        .eq('email', userEmail)
        .is('auth_id', null);
    }
    let { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle();
    if (!data && !error && userEmail) {
      const res = await supabase
        .from('members')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();
      data = res.data;
      error = res.error;
    }
    if (error) { setErrorMsg('Could not load your membership.'); return; }
    if (!data) {
      setErrorMsg('No membership found for this email. Please ensure your application has been submitted.');
      return;
    }
    setMember(data as Member);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setChecking(true);
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('status, full_name')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();
      if (memberError) throw memberError;
      if (!memberData) {
        setErrorMsg('No membership application found for this email address.');
        return;
      }
      if (memberData.status === 'pending') {
        setErrorMsg('Your application is still under review. You will be notified once approved.');
        return;
      }
      if (memberData.status === 'rejected') {
        setErrorMsg('Your membership application was not approved.');
        return;
      }
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
      });
      if (otpError) throw otpError;
      try { localStorage.setItem(LAST_EMAIL_KEY, email.trim().toLowerCase()); } catch { /* ignore */ }
      setOtpSent(true);
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Could not send OTP. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: 'email',
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Invalid or expired OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setMember(null);
    setErrorMsg(null);
    setOtpSent(false);
    setOtp('');
    setEmail('');
    setRejoinDone(false);
    setRejoinMessage('');
    setRejoinError(null);
    setShowCard(false);
    try { localStorage.removeItem(LAST_EMAIL_KEY); } catch { /* ignore */ }
  };

  const handleRejoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !member) return;
    setRejoinSubmitting(true);
    setRejoinError(null);
    try {
      let { error, count } = await supabase
        .from('members')
        .update({
          rejoin_request: true,
          rejoin_message: rejoinMessage.trim() || null,
          rejoin_requested_at: new Date().toISOString(),
        })
        .eq('auth_id', userId)
        .select('id', { count: 'exact', head: true });
      if (!error && (count === 0 || count === null)) {
        const fallback = await supabase
          .from('members')
          .update({
            rejoin_request: true,
            rejoin_message: rejoinMessage.trim() || null,
            rejoin_requested_at: new Date().toISOString(),
          })
          .eq('email', member.email)
          .eq('status', 'left');
        error = fallback.error;
      }
      if (error) throw error;
      setRejoinDone(true);
      setMember(prev => prev ? { ...prev, rejoin_request: true, rejoin_message: rejoinMessage.trim() || null } : prev);
    } catch (err: any) {
      setRejoinError(err.message ?? 'Failed to submit request. Please try again.');
    } finally {
      setRejoinSubmitting(false);
    }
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

  // ── Not logged in — Step 1: Email
  if (!userId && !otpSent) return (
    <PageShell title="Member Login">
      <div className="max-w-sm">
        <p className="text-sm text-slate-600 mb-4">
          Enter your registered email to receive an 8-digit OTP code.
        </p>
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="your@email.com"
            />
          </div>
          {errorMsg && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errorMsg}</p>}
          <button
            type="submit"
            disabled={checking}
            className="w-full py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {checking ? 'Checking…' : 'Send OTP'}
          </button>
        </form>
      </div>
    </PageShell>
  );

  // ── Not logged in — Step 2: OTP entry
  if (!userId && otpSent) return (
    <PageShell title="Enter OTP">
      <div className="max-w-sm">
        <p className="text-sm text-slate-600 mb-1">An 8-digit code was sent to:</p>
        <p className="text-sm font-semibold text-orange-600 mb-4">{email}</p>
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">OTP Code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{8}"
              maxLength={8}
              required
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="00000000"
            />
          </div>
          {errorMsg && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errorMsg}</p>}
          <button
            type="submit"
            disabled={verifying || otp.length !== 8}
            className="w-full py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {verifying ? 'Verifying…' : 'Verify OTP'}
          </button>
          <button
            type="button"
            onClick={() => { setOtpSent(false); setOtp(''); setErrorMsg(null); }}
            className="w-full text-xs text-slate-500 hover:text-orange-600 underline"
          >
            ← Use a different email
          </button>
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
        <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-600 underline">
          Logout and try a different email
        </button>
      </div>
    </PageShell>
  );

  // ── Pending state
  if (member.status === 'pending') return (
    <PageShell title="Member Portal">
      <div className="max-w-sm space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-yellow-800">Application Under Review</p>
              <p className="text-xs text-yellow-700 mt-0.5 leading-relaxed">
                Your application is being reviewed by the admin. You will be notified once it is approved.
              </p>
            </div>
          </div>
          {member.application_no && (
            <div className="bg-white rounded-xl border border-yellow-200 px-4 py-3">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Form Number</p>
              <p className="font-mono font-bold text-xl text-orange-600 tracking-wide">{member.application_no}</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Name', member.full_name],
            ['Email', member.email],
            ['Contact', member.contact_no],
            ['District', member.area_district],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</span>
              <span className="text-slate-700 text-sm">{value || '—'}</span>
            </div>
          ))}
        </div>
        <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-600 underline">Logout</button>
      </div>
    </PageShell>
  );

  // ── Rejected state
  if (member.status === 'rejected') return (
    <PageShell title="Member Portal">
      <div className="max-w-sm space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-5">
          <p className="text-sm font-bold text-red-800 mb-1">Application Rejected</p>
          {member.application_no && (
            <p className="text-xs text-red-600 mb-2">Form No: <span className="font-mono font-semibold">{member.application_no}</span></p>
          )}
          {member.rejection_reason && (
            <p className="text-xs text-red-700 bg-red-100 rounded-lg px-3 py-2 mt-2">Reason: {member.rejection_reason}</p>
          )}
        </div>
        <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-600 underline">Logout</button>
      </div>
    </PageShell>
  );

  // ── Former Member (left) state
  if (member.status === 'left') return (
    <PageShell title="Member Portal">
      <div className="max-w-lg space-y-5">
        <div className="bg-slate-100 border border-slate-300 rounded-2xl px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-slate-700">Former Member</p>
                <span className="text-[10px] bg-slate-300 text-slate-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Inactive</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hello, <span className="font-semibold text-slate-700">{member.full_name}</span>. Your membership is currently inactive.
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Name', member.full_name],
            ['Membership No.', member.membership_number],
            ['District', member.area_district],
            ['Contact', member.contact_no],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</span>
              <span className="text-slate-700 font-medium">{value || '—'}</span>
            </div>
          ))}
        </div>
        {member.left_reason && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-amber-600 font-semibold mb-1">Reason on Record</p>
            <p className="text-sm text-amber-800">{member.left_reason}</p>
            {member.left_at && (
              <p className="text-xs text-amber-500 mt-1">Date: {member.left_at.slice(0, 10)}</p>
            )}
          </div>
        )}
        {member.rejoin_request ? (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-blue-800">Rejoin Request Submitted</p>
                <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                  Your request to rejoin has been sent to the admin for review.
                </p>
                {member.rejoin_message && (
                  <div className="mt-2 bg-blue-100 rounded-lg px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-blue-500 font-semibold mb-0.5">Your message</p>
                    <p className="text-xs text-blue-700">"{member.rejoin_message}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : rejoinDone ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-5">
            <p className="text-sm font-bold text-green-800 mb-1">✅ Request Sent!</p>
            <p className="text-xs text-green-700 leading-relaxed">
              Your rejoin request has been submitted. The admin will review it and you will be notified by email.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-5 shadow-sm">
            <p className="text-sm font-bold text-slate-800 mb-1">Request to Rejoin</p>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Want to become an active member again? Submit a rejoin request and the admin will review it.
            </p>
            <form onSubmit={handleRejoinSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Message to Admin <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={rejoinMessage}
                  onChange={e => setRejoinMessage(e.target.value)}
                  rows={3}
                  placeholder="e.g. I wish to rejoin and actively contribute to BMA-JK…"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              {rejoinError && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{rejoinError}</p>
              )}
              <button
                type="submit"
                disabled={rejoinSubmitting}
                className="w-full py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {rejoinSubmitting ? 'Submitting…' : '🔁 Request Rejoin'}
              </button>
            </form>
          </div>
        )}
        <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-600 underline">Logout</button>
      </div>
    </PageShell>
  );

  // ── Approved member dashboard
  // Card preview modal
  if (showCard && member) return (
    <PageShell title="ID Card Preview">
      <div className="overflow-x-auto">
        <IDCard member={member} onClose={() => setShowCard(false)} />
      </div>
    </PageShell>
  );

  return (
    <PageShell title="Your Membership">
      <div className="max-w-2xl space-y-6">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Active Member</p>
              <p className="text-base font-bold text-slate-800">{member.full_name}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-600 underline">Logout</button>
        </div>

        {/* Membership number highlight */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4">
          <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">Membership Number</p>
          <p className="text-3xl font-bold text-orange-700 tracking-wide">{member.membership_number}</p>
          {member.application_no && (
            <p className="text-xs text-slate-400 mt-1">Form No: <span className="font-mono text-slate-500">{member.application_no}</span></p>
          )}
        </div>

        {/* Member details grid */}
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Member Details</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {[
              ['Full Name', member.full_name],
              ['Designation', member.designation],
              ['Area / District', member.area_district],
              ['Date of Birth', member.dob],
              ['Blood Group', member.blood_group],
              ['Contact No.', member.contact_no],
              ['Email', member.email],
              ['Date of Joining', member.approved_at ? new Date(member.approved_at).toLocaleDateString('en-IN') : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</span>
                <span className="text-slate-800 font-medium">{value || '—'}</span>
              </div>
            ))}
            <div className="col-span-2 flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Address</span>
              <span className="text-slate-800 font-medium">{member.address || '—'}</span>
            </div>
          </div>
        </div>

        {/* ID Card action buttons */}
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">ID Card</p>
          <p className="text-xs text-slate-500 mb-4">Preview your membership card or download it as a high-quality PNG image.</p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowCard(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-orange-500 text-orange-600 text-sm font-semibold hover:bg-orange-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Preview Card
            </button>
            <button
              onClick={() => setShowCard(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Card
            </button>
          </div>
        </div>

      </div>
    </PageShell>
  );
};
