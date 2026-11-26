# JetClaim Navigator

jetclaim

Build a professional, trustworthy web platform called JetClaim — an international flight complaint, compensation, and refund claims service. Tagline: "We Fight. You Fly."

The platform helps flyers file complaints about flight issues (delays, cancellations, lost/damaged baggage, denied boarding, booking failures, poor service) and claim compensation or refunds under international aviation regulations (EU261, UK261, US DOT rules, Canada APPR, India DGCA, Brazil ANAC, Montreal Convention).

Tech Stack

React + TypeScript

Tailwind CSS

shadcn/ui components

Supabase for backend (Auth, Postgres, Storage)

Deploy-ready for Vercel

Brand & Visual Style

Primary color: deep navy blue (#0A1F44 or similar) — used for header text, primary buttons, footer background

Accent color: bright blue (#1E3A8A / #2563EB range) for links and secondary highlights

Background: clean white with light gray section dividers

Typography: modern sans-serif, bold confident headlines, clean body text

Tone: professional, trustworthy, confident — similar visual register to AirHelp/Flightright but with its own identity

Logo: simple plane icon inside a circle, next to "JetClaim" wordmark, with "We Fight. You Fly." as a small tagline underneath

PAGE 1: Landing Page

Header (sticky nav)

Logo + tagline (left)

Nav links: How It Works, Your Rights, Regulations, About Us, FAQs, Contact

Language selector dropdown (EN default)

"Log In" button (outline style)

"File a Claim" button (solid navy, primary CTA, arrow icon)

Hero Section

Full-width background image of an airplane taking off at sunset/golden hour

Large headline (left-aligned, stacked): "Flight Problems?" / "We Fight for Your" / "Refunds & Compensation." — last line in accent blue

Subtext: "JetClaim helps you file complaints and get what you're entitled to under international aviation regulations."

3 checkmark trust bullets: "Transparent Fees", "98% Success Rate", "Trusted by Thousands of Passengers"

Trustpilot-style rating badge: "Excellent — 4.8 out of 5 based on 2,500+ reviews ★ Trustpilot"

Hero Widget (right side, floating card over the hero image)

Card title: "Check Your Flight"

Subtext: "Start your claim in less than 3 minutes"

Form fields:

Flight Number (text input, placeholder "e.g. BA123")

Date of Flight (date picker, placeholder "Select date")

Issue Type (dropdown, placeholder "Select issue" — options: Delay, Cancellation, Denied Boarding, Lost Baggage, Damaged Baggage, Booking Issue, Other)

Primary button: "Check My Claim" (navy, full width, arrow icon)

Small lock icon + text below button: "Your data is secure and confidential"

"How It Works" Section

Centered heading: "How It Works" + subheading "Compensation in 4 simple steps"

4-step horizontal process with icons connected by dashed lines:

File Your Claim (document icon) — "Tell us about your flight issue and upload your documents."

We Check Your Case (magnifying glass icon) — "Our experts verify your claim and check your eligibility under the applicable regulations."

We Handle Everything (envelope icon) — "We contact the airline and handle all communication on your behalf — you sit back and relax."

Get Your Compensation (money icon) — "Once your claim is successful, you get paid."

"We Cover International Regulations" Section

Light gray background bar

Heading: "We Cover International Regulations"

Row of regulation badges with country flag icons:

EU261 — "Up to €600 — EU Regulation EC 261/2004"

UK261 — "Up to £520 — UK Regulation"

US DOT Rules — "Refunds & up to $2,150 — US Department of Transportation"

Canada APPR — "Up to C$1,000 — Air Passenger Protection Regulations"

India DGCA — "Up to ₹20,000 — DGCA Passenger Charter"

Brazil ANAC — "Passenger Rights Under ANAC Rules"

"View All Regulations" button (outline, arrow icon) on the right

Bottom Trust Bar (full-width navy background, white text/icons)

5 columns with icons:

Shield icon — "Transparent Fees" / "Fee is agreed upfront before your claim proceeds."

Globe icon — "Global Coverage" / "We handle claims worldwide."

Lock icon — "Secure & Confidential" / "Your data is 100% protected."

Headset icon — "Expert Support" / "Our team is here to help at every step."

Trophy icon — "98% Success Rate" / "Thousands of passengers compensated."

Footer

Standard footer: logo, short description, quick links (How It Works, Your Rights, Regulations, FAQs, Contact), social icons, legal links (Privacy Policy, Terms of Service), copyright line

PAGE 2: File a Claim (multi-step form)

Step-based form (progress indicator at top):

Flight Details — airline (searchable dropdown, seeded with major international airlines), flight number, date, departure airport, arrival airport

What Happened — issue category selector (matches issue types above), free-text description box

Upload Documents — drag-and-drop file upload for boarding pass, booking confirmation, baggage tags, receipts

Contact & Account — name, email, phone, password (or magic link), authorization checkbox: "I authorize JetClaim to act on my behalf regarding this claim"

Review & Submit — summary of everything entered, submit button

After submission: redirect to a Claim Submitted confirmation page with a claim reference number and a "Go to Dashboard" button.

PAGE 3: Client Dashboard

Sidebar or top tabs: My Claims, Profile, Support

My Claims list view: each claim shown as a card with airline, flight number, date, status badge (Submitted / Under Review / Forwarded to Airline / Fee Pending / Awaiting Payout / Resolved / Closed), and a "View Details" link

Claim Detail page (conditional rendering based on claim type):

If general complaint (not refundable): simple status timeline, no financial fields

If refundable/compensable claim:

Status timeline: Submitted → Under Review → Approved → Fee Settlement → Bank Details → Forwarded to Airline → Payout Received

Compensation amount confirmed (once available)

JetClaim fee amount (once admin sets it) with a clear breakdown card

"Settle Fee" button (opens payment step — card/PayPal/bank transfer)

"Add Bank Details" form (appears only after fee is settled) — account holder name, IBAN/account number, SWIFT/BIC, bank name, country, currency

Expected payout window message: "Once your bank details are submitted, payout typically takes 1–3 weeks (up to 6 weeks in some cases)."

PAGE 4: Admin Dashboard (separate protected route, e.g. /admin)

Claims queue table: airline, flight, incident type, regulation matched, estimated value, status — sortable/filterable

Claim review screen:

Toggle: "Refundable claim" yes/no

Field: compensation amount confirmed

Field: JetClaim fee amount (manual entry)

Button: Generate Claim Letter (auto-filled from flight + regulation data)

Status update dropdown

Internal notes field (not visible to client)

PAGE 5: Static Pages

How It Works — expanded version of the 4-step homepage section, with FAQs

Your Rights — plain-language explainer per regulation

Regulations — full regulation table (EU261, UK261, US DOT, Canada APPR, India DGCA, Brazil ANAC, Montreal Convention, Turkey SHY) with trigger conditions and compensation amounts

About Us

FAQs — accordion component

Contact — simple contact form

Database Notes for Supabase (for context, not required to build immediately)

users, claims, airlines, regulations, documents, payments tables

claims table needs: is_refundable, compensation_amount, jetclaim_fee_amount, fee_status, bank_details_submitted_at, expected_payout_window, actual_payout_received_at, status

Row Level Security so clients only see their own claims, admin sees all

Build Priority for This Session

Landing page (fully styled, matches the spec above)

File a Claim multi-step form

Client dashboard with claim list + detail view

Auth (Supabase email/password or magic link)

Do not build the admin dashboard yet — landing page, claim form, and client dashboard first.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://jetclaim-assist.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ee193234-6bc2-432c-b376-738825af3093).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
