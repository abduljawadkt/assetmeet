# AssetMeet

Commercial property matching and brokerage for Kerala. Expanding businesses post space requirements, owners and contributors (engineers, architects, builders) record properties, and the AssetMeet team scores matches and runs deals to closing.

## Implemented
- Public site aimed at expanding businesses, with sections for owners and contributors. Business facts that are not yet confirmed (fees, contact details, proof, contributor reward, active districts) render as visible "To add" placeholders from `lib/site-content.ts`.
- Design system in `DESIGN.md`, implemented as CSS variables in `app/globals.css`.
- ChatGPT sign-in, role onboarding (Business, Owner, Contributor) and a workspace backed by Cloudflare D1.
- Roles:
  - **Business**: own requirements, plus a Shortlists view of properties the team has matched to them. Owner contact is hidden until the property's verification is "Mandate signed"; the contributor's name is never shown.
  - **Owner / Contributor**: own properties, plus an Interest view of deals involving them (business name hidden; contributors see their reward once fees are collected).
  - **Staff** (the AssetMeet team): every property and requirement, matching, the deal pipeline and contributor rewards.
- Weighted deterministic matching with reasons (`lib/matching.ts`), type and deal-type exclusions, and private-outreach flagging.
- Server validation (`lib/records.ts`), same-origin write checks, owner scoping, the owner-permission rule on deal stages, delete protection for records linked to deals, and an append-only `events` audit table.
- Read-only sample workspace at `/?view=app&demo=1` (fictional records, nothing saved).

## Granting staff access
Staff is never self-selected. After the person has signed in and created a profile, set their role in D1:

```sql
UPDATE profiles SET role = 'Staff' WHERE owner = '<their user id>';
```

Their user id is the `owner` value on their profile row.

## Before a public launch
Fill in `lib/site-content.ts`; owner consent evidence and document uploads; duplicate and source dispute review; payout approvals and a ledger; audit UI; backup and retention; rate limiting and monitoring; security testing; email notifications; legal and business content; domain setup.

## Development
Node >=22.13.0. `npm run dev` starts the local preview (local sign-in at `/signin-with-chatgpt`). `npm run db:generate` generates schema migrations. `node --experimental-strip-types --test lib/matching.test.ts` tests matching. `npx tsc --noEmit` checks types. `npm run build` creates a Worker bundle.

D1 binding: `DB`. Migrations are in `drizzle/`. `0001_relational_tables` creates typed tables and copies any rows from the original `records` JSON table into them. The `records` table is kept but no longer written to. To apply migrations to the local preview database:

```sh
npx wrangler d1 migrations apply DB --local --persist-to .wrangler/state --config <a wrangler.json with the DB binding and migrations_dir: "drizzle">
```

Hosted authentication is handled by Sites. No API secrets are included.
