/** Single source of truth for the Terms of Service "Last updated" date. Used both by
 *  the Terms page itself and by the signup flow (src/app/start/page.tsx), which
 *  records this value alongside a user's terms_accepted_at timestamp so we can later
 *  tell which version of the Terms a given user actually agreed to. Bump this string
 *  whenever terms/page.tsx's substantive content changes. */
export const TERMS_VERSION = 'September 12, 2026'
