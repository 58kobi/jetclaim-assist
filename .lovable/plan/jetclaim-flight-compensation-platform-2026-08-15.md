# JetClaim — Flight Compensation Platform

"We Fight. You Fly." A trustworthy claims platform for international flight compensation and refunds.

## Session scope

Landing page, multi-step claim form, client dashboard, and login. Admin dashboard is deliberately left out of this build.

## Design system

- Deep navy (#0A1F44) for headers, primary buttons, footer and trust bar; bright blue (#2563EB) accents for links and highlight text
- White background with light gray section bands
- Bold modern sans-serif headlines, clean body text
- Logo: plane icon in a circle + "JetClaim" wordmark + small tagline
- All colors registered as semantic tokens in the global stylesheet — no hardcoded color classes in components

## Backend (Lovable Cloud)

Enable Cloud, then create:

- `airlines`, `regulations` — public reference data, seeded with major international airlines and the eight regulations (EU261, UK261, US DOT, Canada APPR, India DGCA, Brazil ANAC, Montreal Convention, Turkey SHY)
- `profiles` — name, email, phone
- `claims` — airline, flight number, flight date, departure/arrival airport, issue type, description, status, `is_refundable`, `compensation_amount`, `jetclaim_fee_amount`, `fee_status`, `bank_details_submitted_at`, `expected_payout_window`, `actual_payout_received_at`, reference number
- `claim_documents` — file metadata pointing at a private storage bucket
- `bank_details` — owner-only, submitted after fee settlement
- `user_roles` (separate table + `has_role` function) so an admin surface can be added later without a rewrite
- Row-level security: clients read/write only their own claims and documents; reference tables are publicly readable

Email/password auth with an auto-confirm-friendly signup, session persisted, protected routes for dashboard.

## Pages

**Landing (`/`)** — sticky header (logo+tagline, nav, language dropdown, Log In outline, File a Claim solid), hero with sunset airplane background, stacked headline with the last line in accent blue, three checkmark bullets, Trustpilot-style rating badge, floating "Check Your Flight" card (flight number, date picker, issue dropdown, Check My Claim CTA, secure-data note) that prefills the claim form. Then How It Works (4 steps, dashed connectors), regulations band with flag badges and View All Regulations, navy 5-column trust bar, full footer.

**File a Claim (`/claim`)** — 5 steps with a progress indicator: Flight Details (searchable airline combobox, flight number, date, airports) → What Happened (issue category + description) → Upload Documents (drag & drop to private storage) → Contact & Account (name, email, phone, password, authorization checkbox) → Review & Submit. Zod validation per step, progress kept in local state so a refresh mid-flow is not fatal. On submit: create account or attach to session, insert claim + documents, redirect to `/claim/submitted` with reference number and a Go to Dashboard button.

**Dashboard (`/dashboard`)** — tabs for My Claims, Profile, Support. Claim cards show airline, flight, date, status badge and View Details.

**Claim detail (`/dashboard/claims/$id`)** — conditional: non-refundable complaints get a simple status timeline; refundable claims get the full timeline (Submitted → Under Review → Approved → Fee Settlement → Bank Details → Forwarded to Airline → Payout Received), compensation and fee breakdown card, Settle Fee action, bank details form gated behind fee settlement, and the payout-window message.

**Auth (`/auth`)** — email/password login and signup.

**Static pages** — `/how-it-works`, `/your-rights`, `/regulations` (full comparison table), `/about`, `/faqs` (accordion), `/contact` (validated form).

## Technical notes

- TanStack Start file routes; data reads through server functions with the authenticated middleware, TanStack Query in components
- Protected pages live under the `_authenticated` layout
- Payment on "Settle Fee" is a UI-only flow in this session (records fee_status intent); real card/PayPal processing is a follow-up
- Each route gets its own SEO metadata
- Hero background image generated for the project
