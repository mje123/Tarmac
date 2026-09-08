-- Critical fix: the Stripe webhook (checkout.session.completed and
-- customer.subscription.updated) has been writing subscription_status =
-- 'tarmac_member' for any active (non-trialing) subscription since that status was
-- introduced in code, but this CHECK constraint was never updated to allow it. Every
-- such write has been silently rejected (the webhook doesn't check the update's error
-- return), meaning a user whose trial converts to a real paid subscription never
-- actually gets marked active — they stay on 'trialing' with an expires_at from the
-- trial, and lose access the moment the trial period ends despite being charged.
-- Purely additive: existing rows/values are untouched.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_status_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_subscription_status_check
  CHECK (subscription_status IN ('free', 'tarmac_member', 'trialing', 'study_pass', 'checkride_prep', 'annual'));
