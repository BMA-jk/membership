import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sendBrevoEmail({
  toEmail, toName, subject, htmlContent,
}: { toEmail: string; toName: string; subject: string; htmlContent: string; }) {
  const apiKey = Deno.env.get("BREVO_API_KEY")!;
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "BMA-JK Membership", email: "noreply@bhartiyamodiarmyjk.com" },
      to: [{ email: toEmail, name: toName }],
      subject,
      htmlContent,
    }),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`Brevo error: ${err}`); }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Missing token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const callerClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !caller || caller.user_metadata?.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json() as {
      member_id: string;
      action: "approve" | "reject" | "mark_left" | "rejoin_approve" | "rejoin_reject";
      rejection_reason?: string;
      left_reason?: string;
    };

    const { member_id, action, rejection_reason, left_reason } = body;

    if (!member_id) return new Response(JSON.stringify({ error: "member_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: member, error: memberErr } = await adminClient
      .from("members")
      .select("full_name, email, status, membership_number, photo_url, aadhaar_front_url, aadhaar_back_url, signature_url, auth_id")
      .eq("id", member_id)
      .single();

    if (memberErr || !member) return new Response(JSON.stringify({ error: "Member not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // ── APPROVE ──────────────────────────────────────────────────
    if (action === "approve") {
      const { data: cur, error: curErr } = await adminClient.from("membership_counter").select("last_number").eq("id", 1).single();
      if (curErr || cur === null) return new Response(JSON.stringify({ error: "Failed to get membership counter" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const nextNum = (cur.last_number as number) + 1;
      const { error: counterErr } = await adminClient.from("membership_counter").update({ last_number: nextNum }).eq("id", 1);
      if (counterErr) return new Response(JSON.stringify({ error: "Failed to update counter" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const year = new Date().getFullYear();
      const membershipNumber = `JK/${String(nextNum).padStart(3, "0")}/${year}`;

      const { error: updateErr } = await adminClient.from("members").update({
        status: "approved", membership_number: membershipNumber,
        approved_at: new Date().toISOString(), rejection_reason: null,
        left_reason: null, left_at: null, rejoin_request: false, rejoin_message: null,
      }).eq("id", member_id);
      if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await sendBrevoEmail({
        toEmail: member.email, toName: member.full_name,
        subject: "🎉 Congratulations! Your BMA-JK Membership is Approved",
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
          <div style="text-align:center;margin-bottom:24px"><h1 style="color:#e65c00;font-size:28px;margin:0">🎉 Congratulations!</h1></div>
          <p style="font-size:16px;color:#333">Dear <strong>${member.full_name}</strong>,</p>
          <p style="font-size:16px;color:#333">We are delighted to inform you that your membership application for <strong>Bhartiya Modi Army – Jammu &amp; Kashmir (BMA-JK)</strong> has been <span style="color:#2e7d32;font-weight:bold">approved</span>.</p>
          <div style="background:#fff8e1;border-left:4px solid #e65c00;padding:16px 20px;margin:24px 0;border-radius:4px">
            <p style="margin:0;font-size:15px;color:#555">Your Membership Number</p>
            <p style="margin:6px 0 0;font-size:24px;font-weight:bold;color:#e65c00;letter-spacing:2px">${membershipNumber}</p>
          </div>
          <p style="font-size:16px;color:#333">Welcome to the BMA-JK family! Together, we stand for the development and progress of Jammu &amp; Kashmir.</p>
          <p style="font-size:16px;color:#333">Jai Hind 🇮🇳</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="font-size:12px;color:#999;text-align:center">This is an automated message from BMA-JK Membership Portal.</p>
        </div>`,
      });

      return new Response(JSON.stringify({ success: true, membership_number: membershipNumber }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── REJECT ───────────────────────────────────────────────────
    if (action === "reject") {
      if (!rejection_reason?.trim()) return new Response(JSON.stringify({ error: "rejection_reason is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // 1. Send rejection email FIRST (while we still have the email address)
      await sendBrevoEmail({
        toEmail: member.email, toName: member.full_name,
        subject: "Update on Your BMA-JK Membership Application",
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
          <p style="font-size:16px;color:#333">Dear <strong>${member.full_name}</strong>,</p>
          <p style="font-size:16px;color:#333">Thank you for applying for membership with <strong>Bhartiya Modi Army – Jammu &amp; Kashmir (BMA-JK)</strong>.</p>
          <p style="font-size:16px;color:#333">After careful review, we regret to inform you that your application has been <span style="color:#c62828;font-weight:bold">rejected</span> due to the following reason(s):</p>
          <div style="background:#fce4e4;border-left:4px solid #c62828;padding:16px 20px;margin:24px 0;border-radius:4px">
            <p style="margin:0;font-size:15px;color:#b71c1c;white-space:pre-line">${rejection_reason.trim()}</p>
          </div>
          <p style="font-size:16px;color:#333">You are welcome to re-apply with corrected details. Your application number is listed below for your records.</p>
          <div style="background:#f5f5f5;border-left:4px solid #999;padding:12px 16px;margin:16px 0;border-radius:4px">
            <p style="margin:0;font-size:13px;color:#666">Application No.</p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:bold;color:#333;font-family:monospace">${member.full_name}</p>
          </div>
          <p style="font-size:16px;color:#333">If you believe this is an error, please contact us.</p>
          <p style="font-size:16px;color:#333">Regards,<br/>BMA-JK Membership Team</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="font-size:12px;color:#999;text-align:center">This is an automated message from BMA-JK Membership Portal.</p>
        </div>`,
      });

      // 2. Delete uploaded files from storage
      const filesToDelete: string[] = [
        member.photo_url,
        member.aadhaar_front_url,
        member.aadhaar_back_url,
        member.signature_url,
      ].filter(Boolean) as string[];

      if (filesToDelete.length > 0) {
        await adminClient.storage.from("member-files").remove(filesToDelete);
      }

      // 3. Delete the auth user if one exists (so email is freed for re-apply)
      if (member.auth_id) {
        await adminClient.auth.admin.deleteUser(member.auth_id);
      }

      // 4. Wipe all personal data — keep only full_name and application_no
      const { error: updateErr } = await adminClient.from("members").update({
        status: "rejected",
        rejection_reason: rejection_reason.trim(),
        // wipe all personal fields
        email: null,
        auth_id: null,
        father_name: null,
        occupation: null,
        designation: null,
        area_district: null,
        assembly_constituency: null,
        dob: null,
        blood_group: null,
        contact_no: null,
        address: null,
        aadhaar_no: null,
        photo_url: null,
        aadhaar_front_url: null,
        aadhaar_back_url: null,
        signature_url: null,
        membership_number: null,
        approved_at: null,
        left_reason: null,
        left_at: null,
        rejoin_request: false,
        rejoin_message: null,
        rejoin_requested_at: null,
      }).eq("id", member_id);

      if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── MARK LEFT ────────────────────────────────────────────────
    if (action === "mark_left") {
      if (!left_reason?.trim()) return new Response(JSON.stringify({ error: "left_reason is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { error: updateErr } = await adminClient.from("members").update({
        status: "left", left_reason: left_reason.trim(),
        left_at: new Date().toISOString(), rejoin_request: false, rejoin_message: null,
      }).eq("id", member_id);
      if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await sendBrevoEmail({
        toEmail: member.email, toName: member.full_name,
        subject: "BMA-JK Membership Status Update",
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
          <p style="font-size:16px;color:#333">Dear <strong>${member.full_name}</strong>,</p>
          <p style="font-size:16px;color:#333">This is to inform you that your membership with <strong>Bhartiya Modi Army – Jammu &amp; Kashmir (BMA-JK)</strong> has been recorded as <span style="color:#7b3f00;font-weight:bold">Former Member</span>.</p>
          <div style="background:#fff3e0;border-left:4px solid #e65c00;padding:16px 20px;margin:24px 0;border-radius:4px">
            <p style="margin:0;font-size:13px;color:#888">Your Membership Number (retained)</p>
            <p style="margin:6px 0 8px;font-size:20px;font-weight:bold;color:#e65c00">${member.membership_number}</p>
            <p style="margin:0;font-size:13px;color:#888">Reason on record</p>
            <p style="margin:4px 0 0;font-size:14px;color:#7b3f00;white-space:pre-line">${left_reason.trim()}</p>
          </div>
          <p style="font-size:16px;color:#333">Your membership number will remain permanently associated with your record. If you wish to rejoin in the future, you may do so through the Member Portal.</p>
          <p style="font-size:16px;color:#333">Regards,<br/>BMA-JK Membership Team</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="font-size:12px;color:#999;text-align:center">This is an automated message from BMA-JK Membership Portal.</p>
        </div>`,
      });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── REJOIN APPROVE ───────────────────────────────────────────
    if (action === "rejoin_approve") {
      const { error: updateErr } = await adminClient.from("members").update({
        status: "approved", left_reason: null, left_at: null,
        rejoin_request: false, rejoin_message: null,
        approved_at: new Date().toISOString(),
      }).eq("id", member_id);
      if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await sendBrevoEmail({
        toEmail: member.email, toName: member.full_name,
        subject: "🎉 Welcome Back! Your Rejoin Request is Approved",
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
          <div style="text-align:center;margin-bottom:24px"><h1 style="color:#e65c00;font-size:28px;margin:0">🎉 Welcome Back!</h1></div>
          <p style="font-size:16px;color:#333">Dear <strong>${member.full_name}</strong>,</p>
          <p style="font-size:16px;color:#333">We are pleased to inform you that your request to rejoin <strong>Bhartiya Modi Army – Jammu &amp; Kashmir (BMA-JK)</strong> has been <span style="color:#2e7d32;font-weight:bold">approved</span>.</p>
          <div style="background:#fff8e1;border-left:4px solid #e65c00;padding:16px 20px;margin:24px 0;border-radius:4px">
            <p style="margin:0;font-size:15px;color:#555">Your Membership Number (unchanged)</p>
            <p style="margin:6px 0 0;font-size:24px;font-weight:bold;color:#e65c00;letter-spacing:2px">${member.membership_number}</p>
          </div>
          <p style="font-size:16px;color:#333">Welcome back to the BMA-JK family! Jai Hind 🇮🇳</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="font-size:12px;color:#999;text-align:center">This is an automated message from BMA-JK Membership Portal.</p>
        </div>`,
      });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── REJOIN REJECT ────────────────────────────────────────────
    if (action === "rejoin_reject") {
      const { error: updateErr } = await adminClient.from("members").update({
        rejoin_request: false, rejoin_message: null,
      }).eq("id", member_id);
      if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await sendBrevoEmail({
        toEmail: member.email, toName: member.full_name,
        subject: "Update on Your BMA-JK Rejoin Request",
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;background:#fff;margin:0 auto;padding:32px">
          <p style="font-size:16px;color:#333">Dear <strong>${member.full_name}</strong>,</p>
          <p style="font-size:16px;color:#333">Thank you for your interest in rejoining <strong>Bhartiya Modi Army – Jammu &amp; Kashmir (BMA-JK)</strong>.</p>
          <p style="font-size:16px;color:#333">After review, we regret to inform you that your rejoin request has not been approved at this time.</p>
          <p style="font-size:16px;color:#333">You are welcome to submit another request in the future if circumstances change.</p>
          <p style="font-size:16px;color:#333">Regards,<br/>BMA-JK Membership Team</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="font-size:12px;color:#999;text-align:center">This is an automated message from BMA-JK Membership Portal.</p>
        </div>`,
      });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
