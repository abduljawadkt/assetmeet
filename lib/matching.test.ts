import { test } from "node:test";
import assert from "node:assert/strict";
import { match, type Asset, type Requirement } from "./matching.ts";
import {
  dealProblems,
  deskSignals,
  effectivePlan,
  feeProblems,
  inMemberPool,
  quotaFor,
  rewardFor,
  contactReleased,
} from "./rules.ts";

const a: Asset = { id: "a", name: "A", district: "Kozhikode", type: "Commercial", area: 20000, price: 400000, transaction: "Lease", construction: "Completed", status: "Available", verification: "Verified", parking: 40, months: 0, consent: true };
const r: Requirement = { id: "r", name: "R", district: "Kozhikode", type: "Commercial", minArea: 15000, maxArea: 25000, budget: 500000, transaction: "Lease", parking: 30, months: 6 };

test("compatible asset gets full score", () => assert.equal(match(a, r)?.score, 100));
test("incompatible type and transaction excluded", () => {
  assert.equal(match({ ...a, type: "Land" }, r), null);
  assert.equal(match({ ...a, transaction: "Sale" }, r), null);
});
test("closed and withdrawn inventory excluded", () => {
  assert.equal(match({ ...a, status: "Closed" }, r), null);
  assert.equal(match({ ...a, status: "Withdrawn" }, r), null);
});
test("unconfirmed owner creates private outreach", () => assert.equal(match({ ...a, consent: false }, r)?.outreach, true));
test("mapped property creates outreach even with permission", () => assert.equal(match({ ...a, status: "Mapped" }, r)?.outreach, true));
test("unknown price not counted as budget fit", () => assert.equal(match({ ...a, price: 0 }, r)?.score, 80));
test("readiness and parking affect score", () => assert.ok(match({ ...a, months: 12, parking: 10 }, r)!.score < 100));
test("owner confirmed scores below mandated", () => assert.equal(match({ ...a, status: "Owner confirmed" }, r)?.score, 95));
test("title issue holds the property", () => {
  const m = match({ ...a, verification: "Issue found" }, r)!;
  assert.equal(m.hold, true);
  assert.equal(m.outreach, true);
});

test("paid plan lapses to Free after its paid-until date", () => {
  assert.equal(effectivePlan("Professional", "2026-12-31", "2026-11-04"), "Professional");
  assert.equal(effectivePlan("Professional", "2026-11-03", "2026-11-04"), "Free");
  assert.equal(effectivePlan("Corporate", "", "2026-11-04"), "Free");
  assert.equal(effectivePlan("Unknown", "2030-01-01", "2026-11-04"), "Free");
});
test("contributors are not capped on free asset submissions", () => {
  assert.equal(quotaFor("Free", "Contributor").assets, null);
  assert.equal(quotaFor("Free", "Owner").assets, 5);
  assert.equal(quotaFor("Connect", "Contributor").assets, 10);
});

test("owner contact released only after a mandate", () => {
  assert.equal(contactReleased({ status: "Owner confirmed" }), false);
  assert.equal(contactReleased({ status: "Mandated" }), true);
  assert.equal(contactReleased({ status: "Withdrawn" }), false);
});
test("member pool needs visibility, consent, an open status and clean documents", () => {
  const p = { visibility: "Members", consent: true, status: "Available", verification: "Verified" };
  assert.equal(inMemberPool(p), true);
  assert.equal(inMemberPool({ ...p, visibility: "Private" }), false);
  assert.equal(inMemberPool({ ...p, consent: false }), false);
  assert.equal(inMemberPool({ ...p, status: "In negotiation" }), false);
  assert.equal(inMemberPool({ ...p, verification: "Issue found" }), false);
});

test("high-value and held properties raise Deal Desk signals", () => {
  const base = { price: 400000, transaction: "Lease", type: "Commercial", area: 20000, verification: "Verified", visibility: "Private" };
  assert.deepEqual(deskSignals(base), []);
  assert.equal(deskSignals({ ...base, price: 500000 })[0].label, "High value");
  assert.equal(deskSignals({ ...base, transaction: "Sale", price: 6e7 })[0].label, "High value");
  assert.equal(deskSignals({ ...base, transaction: "Sale", price: 2e7 }).length, 0);
  assert.ok(deskSignals({ ...base, verification: "Issue found" }).some((s) => s.label === "On hold"));
  assert.ok(deskSignals({ ...base, transaction: "Joint venture" }).some((s) => s.label === "JV / large land"));
});

const deal = { stage: "Qualified", mandateSigned: false, sourceTier: "Data contributor", rewardRate: 0, payoutStatus: "Not due" };
test("site visits need consent and a signed mandate", () => {
  assert.deepEqual(dealProblems(deal, { consent: false }, 0), []);
  assert.equal(dealProblems({ ...deal, stage: "Site visit" }, { consent: false }, 0).length, 2);
  assert.deepEqual(dealProblems({ ...deal, stage: "Site visit", mandateSigned: true }, { consent: true }, 0), []);
});
test("data contributors earn no automatic reward", () => {
  assert.equal(dealProblems({ ...deal, rewardRate: 15 }, { consent: true }, 0).length, 1);
  assert.deepEqual(dealProblems({ ...deal, rewardRate: 15, sourceTier: "Qualified sourcer" }, { consent: true }, 0), []);
});
test("payout approval needs collected brokerage", () => {
  const d = { ...deal, rewardRate: 15, sourceTier: "Qualified sourcer", payoutStatus: "Approved" };
  assert.equal(dealProblems(d, { consent: true }, 0).length, 1);
  assert.deepEqual(dealProblems(d, { consent: true }, 400000), []);
  assert.equal(rewardFor(15, 400000), 60000);
});

const fee = { status: "Pipeline", agreement: false, disclosed: false, amount: 600000, collectedOn: "" };
test("contracted fees need a written agreement and a mandate", () => {
  assert.deepEqual(feeProblems(fee, null, 0), []);
  assert.equal(feeProblems({ ...fee, status: "Contracted" }, null, 0).length, 1);
  assert.equal(feeProblems({ ...fee, status: "Contracted", agreement: true }, { mandateSigned: false }, 0).length, 1);
  assert.deepEqual(feeProblems({ ...fee, status: "Contracted", agreement: true }, { mandateSigned: true }, 0), []);
});
test("a second fee on one project needs disclosure", () => {
  const f = { ...fee, status: "Invoiced", agreement: true };
  assert.equal(feeProblems(f, null, 1).length, 1);
  assert.deepEqual(feeProblems({ ...f, disclosed: true }, null, 1), []);
});
test("collected fees need a received date", () => {
  assert.equal(feeProblems({ ...fee, status: "Collected", agreement: true }, null, 0).length, 1);
});
