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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        await loadMember(session.user.id, session.user.email || undefined);
      }
      setLoading(false);
    };
    init();
  }, []);

  const loadMember = async (authId: string, email?: string) => {
    setErrorMsg(null);
    // Try to attach auth_id to member row if missing
    if (email) {
      await supabase
        .from('members')
        .update({ auth_id: authId })
        .eq('email', email)
        .is('auth_id', null);
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle();

    if (error) {
      console.error(error);
      setErrorMsg('Could not load your membership.');
      return;
    }
    if (!data) {
      setErrorMsg('No approved membership linked to this login yet.');
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
        options: {
          emailRedirectTo: window.location.origin + '/member',
        },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? 'Could not send link');
    }
  };

  if (loading) {
    return (
      <PageShell title="Member Portal">
        <p>Loading...</p>
      </PageShell>
    );
  }

  if (!userId) {
    return (
      <PageShell title="Member Login">
        <form className="space-y-3 max-w-sm" onSubmit={handleSendMagicLink}>
          <p className="text-sm text-slate-700">
            Enter your email to receive a secure magic login link.
          </p>
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
          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-orange-600 text-white text-sm font-medium hover:bg-orange-700"
          >
            Send Magic Link
          </button>
          {magicSent && (
            <p className="text-xs text-green-700 mt-2">
              Magic link sent. Please check your email.
            </p>
          )}
        </form>
      </PageShell>
    );
  }

  if (!member) {
    return (
      <PageShell title="Member Portal">
        {errorMsg ? (
          <p className="text-sm text-red-600">{errorMsg}</p>
        ) : (
          <p className="text-sm">
            No approved membership found. Please ensure your application has
            been approved.
          </p>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell title="Your Membership Details">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-semibold">Membership No:</span>{' '}
              {member.membership_number || 'Pending'}
            </p>
            <p>
              <span className="font-semibold">Name:</span> {member.full_name}
            </p>
            <p>
              <span className="font-semibold">Designation:</span>{' '}
              {member.designation || '-'}
            </p>
            <p>
              <span className="font-semibold">Area / District:</span>{' '}
              {member.area_district || '-'}
            </p>
            <p>
              <span className="font-semibold">Date of Birth:</span>{' '}
              {member.dob || '-'}
            </p>
            <p>
              <span className="font-semibold">Blood Group:</span>{' '}
              {member.blood_group || '-'}
            </p>
            <p>
              <span className="font-semibold">Contact No:</span>{' '}
              {member.contact_no || '-'}
            </p>
            <p>
              <span className="font-semibold">Address:</span>{' '}
              {member.address || '-'}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{' '}
              {member.status}
            </p>
          </div>
          <IDCard member={member} />
        </div>
      </div>
    </PageShell>
  );
};
