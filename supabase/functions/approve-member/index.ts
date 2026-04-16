// Edge Function: approve-member
// verify_jwt: TRUE  ← must be set in Supabase Dashboard > Edge Functions > approve-member > Settings
//
// HOW TO ENABLE JWT VERIFICATION:
//   Supabase Dashboard → Edge Functions → approve-member → Settings → toggle "Verify JWT" ON
//
// The frontend already sends: headers: { Authorization: `Bearer ${session.access_token}` }
// so enabling JWT will not break anything.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify caller is an admin via JWT user_metadata
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with caller's JWT to check their role
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (user.user_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for the actual DB operation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { member_id } = await req.json();
    if (!member_id) {
      return new Response(JSON.stringify({ error: 'member_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Approve the member — trigger assign_membership_number fires automatically
    const { data, error } = await supabaseAdmin
      .from('members')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', member_id)
      .select('membership_number')
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, membership_number: data.membership_number }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
