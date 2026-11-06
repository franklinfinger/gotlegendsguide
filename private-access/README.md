## Password setup and recovery

The sign-in panel includes **Set or reset password** for the existing app account.
The user requests an email link and opens it in the same browser and device.
The pinned SDK uses PKCE and only the dedicated `?password=recovery` callback
is exchanged. The code is removed from browser history before owner verification.
The guide remains locked while the owner chooses and confirms a unique password
of at least 12 characters. Success clears the fields, signs out on this device,
and returns to ordinary password sign-in. No public signup or admin password is
added. The app never logs passwords, codes, or tokens.

Required hosted settings: Site URL `https://www.gotlegendsguide.com/` and exact
redirect `https://www.gotlegendsguide.com/?password=recovery`. No redirect
wildcards are needed. Existing Auth password policy and email delivery still
apply; a generic success message does not prove delivery. Email-provider limits
or expired links produce an actionable retry message. A link opened in another
browser/device must be requested again there. Password changes are performed
only by the user in the app; deployment does not reset any password or email a
link. Existing collection, evidence and RLS rules are unchanged.

Automated coverage includes synthetic PKCE with the real pinned SDK, owner
checks, URL scrubbing, invalid/expired/reused links, password validation,
uncertain errors, duplicate clicks, and no guide reads during reset. Run
`npm test` and `npm run check` from this directory. The optional
`npm run test:password-browser` additionally requires a working local Chromium
and an enabled main build against synthetic localhost Supabase configuration.

# Private collection guide

This module provides an owner-only guide with email/password sign-in, saved collection choices, and revision-checked evidence. The browser client uses a public Supabase project URL and publishable key. Server-side access rules, not the login screen, enforce privacy.

## Behavior

- A persistent browser session avoids routine one-time codes. Sign-out, revoked sessions, or cleared browser storage require sign-in again.
- Latest saved evidence is the only source for skills, traits, and iconic items in the private view. Missing or incomplete evidence is labeled; old catalog abilities are not substituted.
- Structured evidence and collection choices are stored behind owner-only database policies. Original screenshot image bytes are not stored by this module.
- Generic code and public game reference information are not secret. Never put real owner identities, private evidence exports, passwords, or secret keys in this repository.

## Development

Run the root package tests and typecheck, then the private package checks and tests. The build is disabled by default unless private configuration is explicitly provided. Use synthetic data for development and tests. Database access changes require separate authorized review and deployment.
