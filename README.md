# AssetMeet

Commercial property matching and brokerage for Kerala. Expanding businesses post space requirements, owners and contributors (engineers, architects, builders) record properties, and the AssetMeet team scores matches and runs deals to closing.

## Implemented
- Public site aimed at expanding businesses, with sections for owners and contributors. Business facts that are not yet confirmed (fees, contact details, proof, contributor reward, active districts) render as visible "To add" placeholders from `lib/site-content.ts`.
- Design system in `DESIGN.md`, implemented as CSS variables in `app/globals.css`.
- Email sign-in (one-time link) with Supabase Auth, role onboarding (Business, Owner, Contributor) and a workspace backed by Supabase Postgres.
- Roles:
  - **Business**: own requirements, plus a Shortlists view of properties the team has matched to them. Owner contact is hidden until the property's verification is "Mandate signed"; the contributor's name is never shown.
  - **Owner / Contributor**: own properties, plus an Interest view of deals involving them (business name hidden; contributors see their reward once fees are collected).
  - **Staff** (the AssetMeet team): every property and requirement, matching, the deal pipeline and contributor rewards.
- Weighted deterministic matching with reasons (`lib/matching.ts`), type and deal-type exclusions, and private-outreach flagging.
- Server validation (`lib/records.ts`), same-origin write checks, owner scoping, the owner-permission rule on deal stages, delete protection for records linked to deals, and an append-only `events` audit table.
- Read-only sample workspace at `/?view=app&demo=1` (fictional records, nothing saved).

## Granting staff access
Staff is never self-selected. After the person has signed in and created a profile, set their role in the Supabase SQL editor:

```sql
UPDATE profiles SET role = 'Staff' WHERE owner = '<their user id>';
```

Their user id is the `owner` value on their profile row (the same id shown under Authentication > Users).

## Before a public launch
Fill in `lib/site-content.ts`; owner consent evidence and document uploads; duplicate and source dispute review; payout approvals and a ledger; audit UI; backup and retention; rate limiting and monitoring; security testing; email notifications; legal and business content; domain setup.

## Stack
Next.js 16 on Node.js, Supabase Postgres (accessed only from the server through `DATABASE_URL`, with Drizzle ORM), Supabase Auth for email sign-in. All tables have row level security switched on with no policies, so Supabase's public API cannot read them; only the app's server can.

## Deploying on Hostinger (Node.js web app)

### 1. Supabase
1. Create a project (region: Mumbai, `ap-south-1`).
2. SQL editor: run `supabase/migrations/0000_init.sql`.
3. Authentication > URL Configuration: set **Site URL** to your domain, and add `https://YOUR-DOMAIN/auth/callback` under **Redirect URLs**.
4. Authentication > Emails > SMTP settings: add your own SMTP (for example your Hostinger mailbox). Supabase's built-in sender only allows a few emails an hour and is not meant for production.

### 2. Hostinger
1. hPanel > Websites > Add website > Node.js app, and connect this GitHub repository (branch `main`).
2. Node.js version 22. Build command `npm run build`. Start command `npm start`.
3. Add the environment variables from `.env.example` before the first build. `NEXT_PUBLIC_` values are fixed at build time, so redeploy after changing them.
4. Point your domain at the app and enable SSL.

## Development
Node >=22.13.0. Copy `.env.example` to `.env.local` and fill it in, then `npm run dev`. `npm test` runs the matching tests. `npx tsc --noEmit` checks types. `npm run build` then `npm start` runs the production server. After changing `db/schema.ts`, run `npm run db:generate` and apply the new file in `supabase/migrations/`.
