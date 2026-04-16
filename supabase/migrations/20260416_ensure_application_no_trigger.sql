-- ============================================================
-- Ensure set_application_no trigger is wired on members INSERT
-- Apply in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Drop if exists to avoid duplicate trigger error
DROP TRIGGER IF EXISTS trg_set_application_no ON public.members;

-- Create trigger: fires BEFORE INSERT, assigns application_no automatically
CREATE TRIGGER trg_set_application_no
  BEFORE INSERT ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_application_no();

-- Also ensure membership_number trigger exists (fires on UPDATE when approved)
DROP TRIGGER IF EXISTS trg_assign_membership_number ON public.members;

CREATE TRIGGER trg_assign_membership_number
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_membership_number();
