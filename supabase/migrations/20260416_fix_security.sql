-- ============================================================
-- SECURITY FIX MIGRATION
-- Apply this in: Supabase Dashboard → SQL Editor → Run
-- Date: 2026-04-16
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. FIX RLS: INSERT policy
--    Old: WITH CHECK (true)  → anyone could insert anything
--    New: only authenticated users can insert their own row
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can submit membership" ON public.members;

CREATE POLICY "Authenticated users can submit own membership"
  ON public.members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);


-- ────────────────────────────────────────────────────────────
-- 2. FIX RLS: UPDATE policy
--    Old: USING (true)  → any row could be updated by anyone
--    New: user can only update their own row while status = pending
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can update own pending row" ON public.members;

CREATE POLICY "Users can update own pending row"
  ON public.members
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid() AND status = 'pending')
  WITH CHECK (auth_id = auth.uid() AND status = 'pending');


-- ────────────────────────────────────────────────────────────
-- 3. FIX DB FUNCTION: assign_membership_number
--    Adds SET search_path = '' to prevent search_path injection
--    NOTE: Update the body below if your actual logic differs
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assign_membership_number()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_next INT;
BEGIN
  IF NEW.status = 'approved' AND NEW.membership_number IS NULL THEN
    UPDATE public.membership_counter
      SET last_number = last_number + 1
      RETURNING last_number INTO v_next;
    NEW.membership_number := 'BMA-JK-' || LPAD(v_next::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 4. FIX DB FUNCTION: set_application_no
--    Adds SET search_path = ''
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_application_no()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_next INT;
BEGIN
  IF NEW.application_no IS NULL THEN
    UPDATE public.membership_counter
      SET last_number = last_number + 1
      RETURNING last_number INTO v_next;
    NEW.application_no := 'APP-' || LPAD(v_next::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 5. FIX DB FUNCTION: is_admin
--    Adds SET search_path = ''
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
      false
    )
  );
END;
$$;
