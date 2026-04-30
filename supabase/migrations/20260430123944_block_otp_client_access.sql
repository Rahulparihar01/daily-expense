-- Replace the deny-all policy with explicit per-command policies that include
-- a WITH CHECK = false clause for INSERT/UPDATE so unauthenticated users
-- cannot insert OTP rows. All access remains restricted to the service role
-- (used by the edge function), which bypasses RLS.

DROP POLICY IF EXISTS "No direct client access to OTPs" ON public.password_reset_otps;

CREATE POLICY "Block all client SELECT on OTPs"
  ON public.password_reset_otps
  FOR SELECT
  USING (false);

CREATE POLICY "Block all client INSERT on OTPs"
  ON public.password_reset_otps
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block all client UPDATE on OTPs"
  ON public.password_reset_otps
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Block all client DELETE on OTPs"
  ON public.password_reset_otps
  FOR DELETE
  USING (false);
