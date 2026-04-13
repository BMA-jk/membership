SQL snippets and notes for Supabase configuration.

1. Membership tables and sequence

```sql
CREATE SEQUENCE IF NOT EXISTS membership_seq;

CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  full_name text NOT NULL,
  email text NOT NULL,
  designation text,
  area_district text,
  dob date,
  blood_group text,
  contact_no text,
  address text,
  photo_url text,
  aadhaar_front_url text,
  aadhaar_back_url text,
  membership_number text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  approved_at timestamptz,
  auth_id uuid
);

CREATE TABLE admins (
  id bigserial PRIMARY KEY,
  auth_id uuid NOT NULL,
  email text NOT NULL UNIQUE
);

CREATE OR REPLACE FUNCTION next_membership_seq()
RETURNS bigint
LANGUAGE sql
AS $$
  SELECT nextval('membership_seq');
$$;
```

2. RLS policies (enable RLS on both tables first):

```sql
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can do everything on members"
ON members
FOR ALL
USING (EXISTS (SELECT 1 FROM admins a WHERE a.auth_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM admins a WHERE a.auth_id = auth.uid()));

CREATE POLICY "member can view own record"
ON members
FOR SELECT
USING (auth.uid() = auth_id);

CREATE POLICY "approved member can attach auth_id once"
ON members
FOR UPDATE
USING (status = 'approved' AND auth_id IS NULL AND email = auth.email())
WITH CHECK (auth_id = auth.uid());

CREATE POLICY "admin can read self"
ON admins
FOR SELECT
USING (auth.uid() = auth_id);
```

3. Storage bucket `member-files` (private) and allow uploads for anon + svc via Storage Policies UI.

4. Edge function `approve-member` should be created in `supabase/functions/approve-member/index.ts` similar to the code in the README in this project root.
```
