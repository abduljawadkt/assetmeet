# AssetMeet

Private pilot for a Kerala property intelligence and brokerage platform.

## Implemented
- Responsive website inspired by the supplied map-led reference; fictional examples are explicitly labelled.
- ChatGPT identity and owner-isolated D1 persistence for properties, requirements and deals.
- Independent construction, market and verification status; contributor attribution and marketing permission.
- Weighted deterministic matching with explanations, transaction/type exclusions, private owner outreach classification.
- Deal pipeline, follow-up dates, recorded brokerage and calculated contributor rewards.
- Server validation, same-origin write check, owner checks and append-only creation/update audit events.

## Scope and launch gates
This is a functional private pilot, not a completed multi-user production brokerage system. It intentionally does not claim live AI, verified inventory, customer counts or returns. It has no real customer data or external messaging.

Before a public business launch: implement organization membership and admin/staff/partner roles; owner/contact consent evidence; document upload and controlled sharing; property/unit relational modelling; duplicate and source dispute review; payout approvals and ledger; audit UI; backup/restore and retention operations; rate limiting and monitoring; user acceptance/security testing; configured email and AI provider; legal/business content and domain setup. Current records belong to one signed-in account. Do not change hosting to public as a substitute for implementing these controls.

The illustrative map is not a geographic map. Photography is illustrative and remotely loaded from Unsplash. Demo records are not persisted and cannot create real deals. Live workspace starts empty.

## Development
Node >=22.13.0. Use the Sites helpers described in the plugin skill. `npm run dev` starts the local preview. `npm run db:generate` generates schema migrations. `node --experimental-strip-types --test lib/matching.test.ts` tests matching. `npx tsc --noEmit` checks types. `npm run build` creates a Worker bundle.

D1 binding: DB. Schema migrations are in drizzle/. Hosted authentication is handled by Sites. No API secrets are included.
