# AssetMeet

Commercial property matching and brokerage for Kerala. Expanding businesses post space requirements, owners and contributors (engineers, architects, builders) record properties, and the AssetMeet team scores matches and runs deals to closing.

## Implemented
- Public site aimed at expanding businesses, with sections for owners and contributors. Business facts that are not yet confirmed (fees, contact details, proof, contributor reward, active districts) render as visible "To add" placeholders from `lib/site-content.ts`.
- Design system in `DESIGN.md`, implemented as CSS variables in `app/globals.css`.
- Email sign-in (one-time link) with Better Auth, role onboarding (Business, Owner, Contributor) and a workspace backed by Neon Postgres.
- Roles:
  - **Business**: own requirements, plus a Shortlists view of properties the team has matched to them. Owner contact is hidden until the property's verification is "Mandate signed"; the contributor's name is never shown.
  - **Owner / Contributor**: own properties, plus an Interest view of deals involving them (business name hidden; contributors see their reward once fees are collected).
  - **Staff** (the AssetMeet team): every property and requirement, matching, the deal pipeline and contributor rewards.
- Weighted deterministic matching with reasons (`lib/matching.ts`), type and deal-type exclusions, and private-outreach flagging.
- Server validation (`lib/records.ts`), same-origin write checks, owner scoping, the owner-permission rule on deal stages, delete protection for records linked to deals, and an append-only `events` audit table.
- Read-only sample workspace at `/?view=app&demo=1` (fictional records, nothing saved).

## Admin and demo accounts
`node --experimental-strip-types scripts/demo-accounts.ts > demo.sql` creates an admin (Staff) account, demo Business, Owner and Contributor accounts, and sample records. It prints the generated passwords once (only hashes are stored). Run `demo.sql` in the Neon SQL editor. These accounts sign in with **Sign in with a password instead**; everyone else signs up with an email link. Delete the demo accounts before a public launch:

```sql
DELETE FROM "user" WHERE email LIKE '%@assetmeet.example';
```

## Granting staff access
Staff is never self-selected. After the person has signed in and created a profile, set their role in the Neon SQL editor:

```sql
UPDATE profiles SET role = 'Staff' WHERE owner = '<their user id>';
```

Their user id is the `owner` value on their profile row, or `SELECT id FROM "user" WHERE email = 'them@example.com';`.

## Before a public launch
Fill in `lib/site-content.ts`; owner consent evidence and document uploads; duplicate and source dispute review; payout approvals and a ledger; audit UI; backup and retention; rate limiting and monitoring; security testing; email notifications; legal and business content; domain setup.

## Stack
Next.js 16 on Node.js, Neon Postgres (through `DATABASE_URL`, with Drizzle ORM), and Better Auth for email sign-in links. Sign-in data (users, sessions, one-time links) lives in the same database, in the `user`, `session`, `account` and `verification` tables. Emails are sent through your own mailbox over SMTP.

## Deploying on Hostinger (Node.js web app)

### 1. Neon
1. Create a project at neon.tech in the region closest to your Hostinger server.
2. SQL editor: run `db/migrations/0000_init.sql`.
3. Connect > copy the **pooled** connection string. This is `DATABASE_URL`.

### 2. Mailbox
Create a sending address (for example `no-reply@your-domain.com` in Hostinger Emails). Its SMTP settings go into `SMTP_*`. Sign-in links will not be sent without them.

### 3. Hostinger
1. hPanel > Websites > Add website > Node.js app, and connect this GitHub repository (branch `main`).
2. Node.js version 22. Build command `npm run build`. Start command `npm start`.
3. Add every variable from `.env.example` before the first build. Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32`. `NEXT_PUBLIC_SITE_URL` is fixed at build time, so redeploy after changing it.
4. Point your domain at the app and enable SSL.

## Development
Node >=22.13.0. Copy `.env.example` to `.env.local` and fill it in, then `npm run dev`. `npm test` runs the matching tests. `npx tsc --noEmit` checks types. `npm run build` then `npm start` runs the production server. After changing `db/schema.ts`, run `npm run db:generate` and apply the new file in `db/migrations/`. Without `SMTP_HOST`, `npm run dev` prints sign-in links to the terminal instead of emailing them.
