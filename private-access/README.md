# Private collection guide

This module provides an owner-only guide with email/password sign-in, saved collection choices, and revision-checked evidence. The browser client uses a public Supabase project URL and publishable key. Server-side access rules, not the login screen, enforce privacy.

## Behavior

- A persistent browser session avoids routine one-time codes. Sign-out, revoked sessions, or cleared browser storage require sign-in again.
- Latest saved evidence is the only source for skills, traits, and iconic items in the private view. Missing or incomplete evidence is labeled; old catalog abilities are not substituted.
- Structured evidence and collection choices are stored behind owner-only database policies. Original screenshot image bytes are not stored by this module.
- Generic code and public game reference information are not secret. Never put real owner identities, private evidence exports, passwords, or secret keys in this repository.

## Development

Run the root package tests and typecheck, then the private package checks and tests. The build is disabled by default unless private configuration is explicitly provided. Use synthetic data for development and tests. Database access changes require separate authorized review and deployment.
