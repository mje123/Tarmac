-- Legal/compliance audit finding: the signup flow (src/app/start/page.tsx) requires
-- a checked "I agree to the Terms and Privacy Policy" checkbox before the submit
-- button is enabled, but that acceptance was never recorded anywhere server-side —
-- only enforced client-side by a disabled-button UI gate. Adds a durable record of
-- when (and which version of) the Terms/Privacy a user accepted, so consent is
-- actually evidenced rather than merely inferred from a form having been submitted.
-- Fully additive.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

COMMENT ON COLUMN public.users.terms_accepted_at IS 'Timestamp the user checked "I agree to the Terms and Privacy Policy" at signup (src/app/start/page.tsx). Null for accounts created before this column existed.';
COMMENT ON COLUMN public.users.terms_version IS 'The Terms of Service "Last updated" date string in effect at the moment of acceptance (src/app/terms/page.tsx''s `updated` constant) — lets us tell which version of the Terms a given user actually agreed to.';
