import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { supabase } from '../lib/supabaseClient';
import { Member } from '../types';
import { IDCard } from '../components/IDCard';

export const CardPage: React.FC = () => {
  const [params] = useSearchParams();
  const id = params.get('id');
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .eq('status', 'approved')
        .maybeSingle();
      if (!error && data) setMember(data as Member);
      setLoading(false);
    };
    fetchMember();
  }, [id]);

  if (!id) {
    return (
      <PageShell title="Membership Card">
        <p>Missing member id.</p>
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell title="Membership Card">
        <p>Loading...</p>
      </PageShell>
    );
  }

  if (!member) {
    return (
      <PageShell title="Membership Card">
        <p>Approved member not found.</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Membership Card">
      <IDCard member={member} />
    </PageShell>
  );
};
