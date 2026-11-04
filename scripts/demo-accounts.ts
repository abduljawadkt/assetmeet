// Prints SQL that creates the admin (Staff) account, three demo accounts and sample
// records. Passwords are generated, hashed the same way the app checks them, and
// written to stderr once. Run the SQL in the Neon SQL editor.
//
//   node --experimental-strip-types scripts/demo-accounts.ts > demo.sql
//
// Re-running creates nothing new for emails that already exist.
import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { demoDeals, demoFees, demoOpportunities, demoProperties, demoRequirements } from "../lib/demo.ts";

const domain = process.env.DEMO_EMAIL_DOMAIN ?? "assetmeet.com";
const password = () => randomBytes(9).toString("base64url");
const q = (v: unknown) => (v === null ? "NULL" : typeof v === "number" || typeof v === "boolean" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

// The demo business and owner get paid plans for a year so self-service matching can be shown.
const inAYear = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
const accounts = [
  { key: "admin", role: "Staff", name: "AssetMeet Admin", organisation: "AssetMeet", plan: "Free", planUntil: "" },
  { key: "business", role: "Business", name: "Demo Business", organisation: "Demo Retail Pvt Ltd", plan: "Professional", planUntil: inAYear },
  { key: "owner", role: "Owner", name: "Demo Owner", organisation: "", plan: "Connect", planUntil: inAYear },
  { key: "contributor", role: "Contributor", name: "Demo Engineer", organisation: "Demo Associates", plan: "Free", planUntil: "" },
].map((a) => ({ ...a, id: randomUUID(), email: `${a.key}@${domain}`, password: password() }));
const by = Object.fromEntries(accounts.map((a) => [a.key, a]));

const now = Date.now();
const sql: string[] = ["BEGIN;"];
for (const a of accounts) {
  const hash = await hashPassword(a.password);
  sql.push(
    `INSERT INTO "user" (id, name, email, email_verified) VALUES (${q(a.id)}, ${q(a.name)}, ${q(a.email)}, true) ON CONFLICT (email) DO NOTHING;`,
    `INSERT INTO account (id, account_id, provider_id, user_id, password) SELECT ${q(randomUUID())}, id, 'credential', id, ${q(hash)} FROM "user" WHERE email = ${q(a.email)} AND id = ${q(a.id)} ON CONFLICT (id) DO NOTHING;`,
    `INSERT INTO profiles (owner, role, name, organisation, verification, plan, plan_until, created, updated) SELECT id, ${q(a.role)}, ${q(a.name)}, ${q(a.organisation)}, 'Demo account', ${q(a.plan)}, ${q(a.planUntil)}, ${now}, ${now} FROM "user" WHERE email = ${q(a.email)} AND id = ${q(a.id)} ON CONFLICT (owner) DO NOTHING;`,
  );
}

// Sample records, owned by the demo accounts and created only for a fresh seed.
const ids: Record<string, string> = {};
demoProperties.forEach((p, i) => {
  ids[p.id] = randomUUID();
  const owner = i === 1 || i === 5 ? by.contributor.id : by.owner.id;
  sql.push(
    `INSERT INTO properties (id, owner, name, district, locality, type, area, price, transaction, construction, status, verification, visibility, parking, months, consent, source, owner_contact, created, updated) SELECT ${[ids[p.id], owner, p.name, p.district, p.locality, p.type, p.area, p.price, p.transaction, p.construction, p.status, p.verification, p.visibility, p.parking, p.months, p.consent, p.source.replace("Sample", "Demo"), p.ownerContact.replace("Sample", "Demo")].map(q).join(", ")}, ${now}, ${now} WHERE EXISTS (SELECT 1 FROM "user" WHERE id = ${q(owner)});`,
  );
});
demoRequirements.forEach((r) => {
  ids[r.id] = randomUUID();
  sql.push(
    `INSERT INTO requirements (id, owner, name, district, type, min_area, max_area, budget, transaction, parking, months, status, created, updated) SELECT ${[ids[r.id], by.business.id, r.name, r.district, r.type, r.minArea, r.maxArea, r.budget, r.transaction, r.parking, r.months, r.status].map(q).join(", ")}, ${now}, ${now} WHERE EXISTS (SELECT 1 FROM "user" WHERE id = ${q(by.business.id)});`,
  );
});
const day = (offset: number) => new Date(now + offset * 864e5).toISOString().slice(0, 10);
const staffOnly = `WHERE EXISTS (SELECT 1 FROM "user" WHERE id = ${q(by.admin.id)})`;
demoDeals.forEach((d, i) => {
  ids[d.id] = randomUUID();
  sql.push(
    `INSERT INTO deals (id, owner, name, property_id, requirement_id, stage, lead_source, value, mandate_signed, mandate_party, exclusivity, trigger, opt_in, assignee, next_action, followup, notes, source_tier, reward_rate, payout_status, created, updated) SELECT ${[ids[d.id], by.admin.id, d.name, ids[d.propertyId], ids[d.requirementId], d.stage, d.leadSource, d.value, d.mandateSigned, d.mandateParty, d.exclusivity, d.trigger, d.optIn, d.assignee, d.nextAction, day(i === 0 ? 7 : -3), d.notes, d.sourceTier, d.rewardRate, d.payoutStatus].map(q).join(", ")}, ${now}, ${now} ${staffOnly};`,
  );
});
demoOpportunities.forEach((o) => {
  ids[o.id] = randomUUID();
  sql.push(
    `INSERT INTO opportunities (id, owner, name, requirement_id, property_id, stage, assignee, next_action, followup, notes, created, updated) SELECT ${[ids[o.id], by.admin.id, o.name, ids[o.requirementId], o.propertyId ? ids[o.propertyId] : "", o.stage, o.assignee, o.nextAction, day(8), o.notes].map(q).join(", ")}, ${now}, ${now} ${staffOnly};`,
  );
});
demoFees.forEach((f) => {
  sql.push(
    `INSERT INTO fees (id, owner, name, stream, link_kind, link_id, payer, trigger, status, amount, agreement, disclosed, invoice, collected_on, created, updated) SELECT ${[randomUUID(), by.admin.id, f.name, f.stream, f.linkKind, f.linkId ? ids[f.linkId] : "", f.payer, f.trigger, f.status, f.amount, f.agreement, f.disclosed, f.invoice, f.collectedOn].map(q).join(", ")}, ${now}, ${now} ${staffOnly};`,
  );
});
sql.push("COMMIT;");

console.log(sql.join("\n"));
console.error("\nAccounts (shown once; only these hashes are stored):");
for (const a of accounts) console.error(`  ${a.role.padEnd(11)} ${a.email.padEnd(32)} ${a.password}`);
