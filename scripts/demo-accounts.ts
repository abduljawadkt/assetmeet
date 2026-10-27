// Prints SQL that creates the admin (Staff) account, three demo accounts and sample
// records. Passwords are generated, hashed the same way the app checks them, and
// written to stderr once. Run the SQL in the Neon SQL editor.
//
//   node --experimental-strip-types scripts/demo-accounts.ts > demo.sql
//
// Re-running creates nothing new for emails that already exist.
import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { demoDeals, demoProperties, demoRequirements } from "../lib/demo.ts";

const domain = process.env.DEMO_EMAIL_DOMAIN ?? "assetmeet.com";
const password = () => randomBytes(9).toString("base64url");
const q = (v: unknown) => (v === null ? "NULL" : typeof v === "number" || typeof v === "boolean" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

const accounts = [
  { key: "admin", role: "Staff", name: "AssetMeet Admin", organisation: "AssetMeet" },
  { key: "business", role: "Business", name: "Demo Business", organisation: "Demo Retail Pvt Ltd" },
  { key: "owner", role: "Owner", name: "Demo Owner", organisation: "" },
  { key: "contributor", role: "Contributor", name: "Demo Engineer", organisation: "Demo Associates" },
].map((a) => ({ ...a, id: randomUUID(), email: `${a.key}@${domain}`, password: password() }));
const by = Object.fromEntries(accounts.map((a) => [a.key, a]));

const now = Date.now();
const sql: string[] = ["BEGIN;"];
for (const a of accounts) {
  const hash = await hashPassword(a.password);
  sql.push(
    `INSERT INTO "user" (id, name, email, email_verified) VALUES (${q(a.id)}, ${q(a.name)}, ${q(a.email)}, true) ON CONFLICT (email) DO NOTHING;`,
    `INSERT INTO account (id, account_id, provider_id, user_id, password) SELECT ${q(randomUUID())}, id, 'credential', id, ${q(hash)} FROM "user" WHERE email = ${q(a.email)} AND id = ${q(a.id)} ON CONFLICT (id) DO NOTHING;`,
    `INSERT INTO profiles (owner, role, name, organisation, verification, created, updated) SELECT id, ${q(a.role)}, ${q(a.name)}, ${q(a.organisation)}, 'Demo account', ${now}, ${now} FROM "user" WHERE email = ${q(a.email)} AND id = ${q(a.id)} ON CONFLICT (owner) DO NOTHING;`,
  );
}

// Sample records, owned by the demo accounts and created only for a fresh seed.
const ids: Record<string, string> = {};
demoProperties.forEach((p, i) => {
  ids[p.id] = randomUUID();
  const owner = i === 1 ? by.contributor.id : by.owner.id;
  sql.push(
    `INSERT INTO properties (id, owner, name, district, locality, type, area, price, transaction, construction, market, verification, parking, months, consent, source, owner_contact, created, updated) SELECT ${[ids[p.id], owner, p.name, p.district, p.locality, p.type, p.area, p.price, p.transaction, p.construction, p.market, p.verification, p.parking, p.months, p.consent, p.source.replace("Sample", "Demo"), p.ownerContact.replace("Sample", "Demo")].map(q).join(", ")}, ${now}, ${now} WHERE EXISTS (SELECT 1 FROM "user" WHERE id = ${q(owner)});`,
  );
});
demoRequirements.forEach((r) => {
  ids[r.id] = randomUUID();
  sql.push(
    `INSERT INTO requirements (id, owner, name, district, type, min_area, max_area, budget, transaction, parking, months, created, updated) SELECT ${[ids[r.id], by.business.id, r.name, r.district, r.type, r.minArea, r.maxArea, r.budget, r.transaction, r.parking, r.months].map(q).join(", ")}, ${now}, ${now} WHERE EXISTS (SELECT 1 FROM "user" WHERE id = ${q(by.business.id)});`,
  );
});
demoDeals.forEach((d, i) => {
  const followup = new Date(now + (i === 0 ? 7 : -3) * 864e5).toISOString().slice(0, 10);
  sql.push(
    `INSERT INTO deals (id, owner, name, property_id, requirement_id, stage, followup, collected, reward_rate, created, updated) SELECT ${[randomUUID(), by.admin.id, d.name, ids[d.propertyId], ids[d.requirementId], d.stage, followup, d.collected, d.rewardRate].map(q).join(", ")}, ${now}, ${now} WHERE EXISTS (SELECT 1 FROM "user" WHERE id = ${q(by.admin.id)});`,
  );
});
sql.push("COMMIT;");

console.log(sql.join("\n"));
console.error("\nAccounts (shown once; only these hashes are stored):");
for (const a of accounts) console.error(`  ${a.role.padEnd(11)} ${a.email.padEnd(32)} ${a.password}`);
