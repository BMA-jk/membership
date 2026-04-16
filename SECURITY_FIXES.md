# Security Fixes — 2026-04-16

All 5 security issues identified by Supabase Advisors have been addressed.

---

## ✅ Already Done (pushed to GitHub)

### 1 & 2 — Edge Functions: `verify_jwt` must be enabled manually

The edge function source code (`supabase/functions/`) now includes explicit admin-role
checks inside each function. However, `verify_jwt` must **also** be toggled ON in the
Supabase Dashboard (one-time, 30 seconds):

```
Supabase Dashboard
  → Edge Functions
  → approve-member → Settings → toggle "Verify JWT" → ON
  → create-admin-user → Settings → toggle "Verify JWT" → ON
```

The frontend already passes the JWT `Authorization` header on both calls, so **nothing
will break** when you enable this.

---

## ⚠️ Run This SQL (copy-paste into Supabase SQL Editor)

File: `supabase/migrations/20260416_fix_security.sql`

Open it and run it in:
```
Supabase Dashboard → SQL Editor → paste contents → Run
```

This fixes:

### 3 — RLS INSERT policy (`rls_policy_always_true`)
- **Old:** `WITH CHECK (true)` — anyone could insert any row
- **New:** Only authenticated users can insert, and only when `auth.uid()` is set

### 4 — RLS UPDATE policy (`rls_policy_always_true`)
- **Old:** `USING (true)` — any row could be updated by anyone
- **New:** User can only update their own row (`auth_id = auth.uid()`) AND only while `status = 'pending'`

### 5 — DB Functions: mutable `search_path` (×3)
- `assign_membership_number` — added `SET search_path = ''`
- `set_application_no` — added `SET search_path = ''`
- `is_admin` — added `SET search_path = ''`

---

## Checklist

- [ ] Run `supabase/migrations/20260416_fix_security.sql` in SQL Editor
- [ ] Enable `verify_jwt` on `approve-member` edge function
- [ ] Enable `verify_jwt` on `create-admin-user` edge function
- [ ] Re-run Supabase Security Advisors to confirm all clear
