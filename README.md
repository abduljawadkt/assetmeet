# AssetMeet

Commercial property matching and brokerage for Kerala. Expanding businesses post space requirements, owners and contributors (engineers, architects, builders) record properties, and the AssetMeet team scores matches and runs deals to closing.

## Implemented
The workspace follows the **Revenue & Business Model** document (28 Oct 2026): one network, three revenue engines (digital marketplace, managed Deal Desk, demand-to-development) and five connected workspaces.

- **Asset Bank** (properties): status Mapped → Owner confirmed → Mandated → Available → In negotiation → Closed / Withdrawn; independent document verification (Not checked, Under review, Verified, Issue found = on hold); visibility Private, Members (anonymised) or Mandate only.
- **Demand Bank** (requirements): Draft → Qualified → Matching → Viewing → Offer → Closed / Unmet → Development lead. Only staff qualify demand.
- **Match Engine**: weighted deterministic scoring (`lib/matching.ts`) with reasons, and Deal Desk signals for high value, JV or large land, title issues and confidential mandates (`lib/rules.ts`). Signals are review alerts, never automatic takeovers.
- **Deal Desk** (deals): Flagged → Qualified → Mandate signed → Site visit → Negotiation → Closed / Dropped, with pre-deal records (lead source, deal value, mandate party, exclusivity, brokerage trigger, client opt-in) and execution records (assignee, next action, follow-up, notes).
- **Opportunity Bank**: unmet demand converted into site search, feasibility and projects, with a per-project fee stack shown as "not guaranteed".
- **Revenue**: every fee (sale/lease brokerage, corporate sourcing, feasibility & advisory, design/PMC) is tracked as Pipeline, Contracted, Invoiced or Collected. Subscription MRR is worked out from member plans.
- **Partner earnings**: contributor tiers (data contributor, qualified sourcer, deal partner); rewards are a percentage of collected brokerage, and payouts move Not due → Pending approval → Approved → Paid.
- **Subscriptions**: Free, Connect ₹299, Professional ₹999, Corporate ₹2,999 per month, with quotas on active assets, active demands and saved matches per month (`lib/rules.ts`). Paid members get self-service matching against an anonymised, owner-approved pool and can request introductions; the Deal Desk follows up. No plan unlocks owner contacts.
- **Members** (staff): set a member's plan and the date it is paid up to. There is no online checkout; a plan lapses to Free after that date.
- Guardrails enforced on the server (`lib/rules.ts`, tested in `lib/matching.test.ts`): owner permission and a signed mandate before the mandate stage; no automatic reward for a basic data record; payout approval only after brokerage is collected; contracted fees need a signed agreement (and, on a deal, a mandate); a second fee on the same project needs disclosure; collected fees need a received date. Owners and contributors cannot set verification or mandate-backed statuses; businesses cannot qualify their own demand.
- Public site repositioned as a real estate intelligence marketplace, with the five workspaces, contributor tiers and plan pricing. Business facts that are not yet confirmed (fees, contact details, proof, contributor reward, active districts) still render as "To add" placeholders from `lib/site-content.ts`.
- Email sign-in (one-time link) and password sign-in for team-created accounts with Better Auth; Neon Postgres; append-only `events` audit table, including plan changes.
- Read-only sample workspace at `/?view=app&demo=1` (fictional records, nothing saved).

### Values to confirm before launch
The prices, quotas, Free-plan limits (5 assets, 1 demand, no self-service matching; contributors uncapped) and the Deal Desk thresholds (₹5 crore sale, ₹5 lakh/month rent, 1 acre land) are the document's illustrative pilot values or reasonable defaults. Change them in `lib/rules.ts`. The per-plan differences in technical data detail and user logins are shown on the pricing table but not enforced yet; each account is one login.

## Upgrading an existing database
Run these in the Neon SQL editor, in order: `db/migrations/0001_revenue_model.sql` (adds the new columns and tables and maps existing records to the new statuses; collected deal fees become Collected brokerage fee records), then `db/migrations/0002_drop_replaced_columns.sql` (drops `properties.market` and `deals.collected`). Deploy the new code right after; the old code does not work with the new columns.

## Admin and demo accounts
`node --experimental-strip-types scripts/demo-accounts.ts > demo.sql` creates an admin (Staff) account, demo Business, Owner and Contributor accounts, and sample records. It prints the generated passwords once (only hashes are stored). Run `demo.sql` in the Neon SQL editor. These accounts sign in with **Sign in with a password instead**; everyone else signs up with an email link. Delete the demo accounts before a public launch:

```sql
DELETE FROM "user" WHERE email IN ('business@assetmeet.com', 'owner@assetmeet.com', 'contributor@assetmeet.com');
```

## Granting staff access
Staff is never self-selected. After the person has signed in and created a profile, set their role in the Neon SQL editor:

```sql
UPDATE profiles SET role = 'Staff' WHERE owner = '<their user id>';
```

Their user id is the `owner` value on their profile row, or `SELECT id FROM "user" WHERE email = 'them@example.com';`.

## Before a public launch
Fill in `lib/site-content.ts`; confirm plan prices and quotas in `lib/rules.ts`; online subscription payment and invoicing (GST); refund policy; owner consent evidence and document uploads; duplicate and source dispute review; a payout ledger; audit UI; backup and retention; rate limiting and monitoring; security testing; email notifications; legal and business content; domain setup.

## Stack
Next.js 16 on Node.js, Neon Postgres (through `DATABASE_URL`, with Drizzle ORM), and Better Auth for email sign-in links. Sign-in data (users, sessions, one-time links) lives in the same database, in the `user`, `session`, `account` and `verification` tables. Emails are sent through your own mailbox over SMTP.

## Deploying on Hostinger (Node.js web app)

### 1. Neon
1. Create a project at neon.tech in the region closest to your Hostinger server.
2. SQL editor: run the files in `db/migrations/` in order (`0000_init.sql`, `0001_revenue_model.sql`, `0002_drop_replaced_columns.sql`).
3. Connect > copy the **pooled** connection string. This is `DATABASE_URL`.

### 2. Mailbox
Create a sending address (for example `no-reply@assetmeet.com` in Hostinger Emails). Its SMTP settings go into `SMTP_*`. Sign-in links will not be sent without them.

### 3. Hostinger
1. hPanel > Websites > Add website > Node.js app, and connect this GitHub repository (branch `main`).
2. Node.js version 22. Build command `npm run build`. Start command `npm start`.
3. Add every variable from `.env.example` before the first build. Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32`. `NEXT_PUBLIC_SITE_URL` is fixed at build time, so redeploy after changing it.
4. Point your domain at the app and enable SSL.

## Development
Node >=22.13.0. Copy `.env.example` to `.env.local` and fill it in, then `npm run dev`. `npm test` runs the matching and business-rule tests. `npx tsc --noEmit` checks types. `npm run build` then `npm start` runs the production server. After changing `db/schema.ts`, run `npm run db:generate` and apply the new file in `db/migrations/`. Without `SMTP_HOST`, `npm run dev` prints sign-in links to the terminal instead of emailing them.
