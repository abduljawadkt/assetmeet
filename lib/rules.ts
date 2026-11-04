// Business rules from the Revenue & Business Model document (28 Oct 2026).
// Pure functions with no runtime imports, shared by the API, the UI and the tests.
//
// Prices, quotas and thresholds below are the document's illustrative pilot values.
// Confirm them with real subscribers before a public launch and change them here only.

// ---------------------------------------------------------------- Subscriptions

export type Quota = {
  price: number; // ₹ per month, excluding GST
  assets: number | null; // active assets; null = no limit
  demands: number | null; // active demands
  matches: number; // saved matches (introduction requests) per calendar month
  logins: number;
};

export const plans: Record<"Free" | "Connect" | "Professional" | "Corporate", Quota> = {
  // Free contributor access: basic asset submission grows the database.
  // Self-service matching is a paid feature; the team still shortlists for free users.
  Free: { price: 0, assets: 5, demands: 1, matches: 0, logins: 1 },
  Connect: { price: 299, assets: 10, demands: 5, matches: 15, logins: 1 },
  Professional: { price: 999, assets: 40, demands: 25, matches: 75, logins: 2 },
  Corporate: { price: 2999, assets: 150, demands: 100, matches: 300, logins: 5 },
};
export type Plan = keyof typeof plans;

// How the plans differ, as shown on the pricing table.
export const planFeatures: [string, string, string, string][] = [
  ["Asset / demand posting", "Basic", "Expanded", "Multi-location"],
  ["Technical property data", "Summary", "Detailed", "Detailed + analytics"],
  ["AI and saved matching", "Limited", "Advanced", "Priority / team"],
  ["Deal Desk assistance", "By request", "By request", "Priority review"],
  ["Owner-approved private data", "Consent-based", "Consent-based", "Consent-based"],
];

// A paid plan counts only while it is paid up (planUntil is today or later).
export function effectivePlan(plan: string, planUntil: string, today: string): Plan {
  if (!(plan in plans) || plan === "Free") return "Free";
  return planUntil && planUntil >= today ? (plan as Plan) : "Free";
}

// Contributors are not capped on asset submissions: verified contribution grows the network.
export function quotaFor(plan: Plan, role: string): Quota {
  const q = plans[plan];
  return role === "Contributor" && plan === "Free" ? { ...q, assets: null } : q;
}

// ---------------------------------------------------------------- Statuses

export const closedPropertyStatuses = ["Closed", "Withdrawn"];
export const closedRequirementStatuses = ["Closed"];
// Statuses that mean the owner has signed a marketing mandate.
export const mandatedStatuses = ["Mandated", "Available", "In negotiation", "Closed"];
// Requirements the team has qualified, offered to member owners for matching.
export const qualifiedRequirementStatuses = ["Qualified", "Matching", "Viewing", "Offer"];

export const isActiveProperty = (p: { status: string }) => !closedPropertyStatuses.includes(p.status);
export const isActiveRequirement = (r: { status: string }) => !closedRequirementStatuses.includes(r.status);

// Owner contact is released to a business only once the owner has signed a mandate.
export const contactReleased = (p: { status: string }) => mandatedStatuses.includes(p.status);

// A property offered anonymised to subscribers: the owner chose member visibility,
// gave marketing permission, it is open and its documents are not under a cloud.
export function inMemberPool(p: { visibility: string; consent: boolean; status: string; verification: string }) {
  return (
    p.visibility === "Members" &&
    p.consent &&
    ["Owner confirmed", "Mandated", "Available"].includes(p.status) &&
    p.verification !== "Issue found"
  );
}

// ---------------------------------------------------------------- Deal Desk routing

// Thresholds for the "Deal Desk review" alert. The alert is a prompt for the
// team to review, never an automatic takeover of the transaction.
export const deskThresholds = {
  sale: 5e7, // ₹5 crore consideration
  monthlyRent: 5e5, // ₹5 lakh a month
  landArea: 43560, // 1 acre, treated as large land assembly
};

const monthly = (t: string) => t === "Lease" || t === "Rent";

export type Signal = { label: string; action: string; tone: "brand" | "warning" | "danger" };

export function deskSignals(p: {
  price: number;
  transaction: string;
  type: string;
  area: number;
  verification: string;
  visibility: string;
}): Signal[] {
  const out: Signal[] = [];
  const high = monthly(p.transaction) ? p.price >= deskThresholds.monthlyRent : p.price >= deskThresholds.sale;
  if (high) out.push({ label: "High value", action: "Deal Desk review alert", tone: "brand" });
  if (p.transaction === "Joint venture" || (p.type === "Land" && p.area >= deskThresholds.landArea))
    out.push({ label: "JV / large land", action: "Senior advisor with legal and technical review", tone: "brand" });
  if (p.verification === "Issue found")
    out.push({ label: "On hold", action: "Hold until verification; not marketed as approved inventory", tone: "danger" });
  if (p.visibility === "Mandate only")
    out.push({ label: "Confidential", action: "Private mandate and staged release of information", tone: "warning" });
  return out;
}

// ---------------------------------------------------------------- Guardrails

// Stages that need the owner's permission recorded on the property.
export const stagesNeedingConsent = ["Mandate signed", "Site visit", "Negotiation", "Closed"];
// Stages that need a signed written mandate: Deal Desk work follows a written agreement.
export const stagesNeedingMandate = ["Mandate signed", "Site visit", "Negotiation", "Closed"];
const rewardTiers = ["Qualified sourcer", "Deal partner"];

type DealCheck = { stage: string; mandateSigned: boolean; sourceTier: string; rewardRate: number; payoutStatus: string };

// Reasons a deal cannot be saved as it stands. Empty means it is fine.
export function dealProblems(d: DealCheck, property: { consent: boolean }, collectedBrokerage: number): string[] {
  const out: string[] = [];
  if (stagesNeedingConsent.includes(d.stage) && !property.consent)
    out.push("Record the owner's permission on the property before moving this deal forward.");
  if (stagesNeedingMandate.includes(d.stage) && !d.mandateSigned)
    out.push("Deal Desk work needs a signed written mandate. Tick “Mandate signed” once it is in place.");
  if (d.rewardRate > 0 && !rewardTiers.includes(d.sourceTier))
    out.push("A data contributor does not earn a deal reward automatically. Set the tier to qualified sourcer or deal partner.");
  if ((d.payoutStatus === "Approved" || d.payoutStatus === "Paid") && collectedBrokerage <= 0)
    out.push("A contributor payout can be approved only after the brokerage fee is collected.");
  if (d.payoutStatus !== "Not due" && d.rewardRate <= 0) out.push("Set a reward rate before starting a payout.");
  return out;
}

type FeeCheck = { status: string; agreement: boolean; disclosed: boolean; amount: number; collectedOn: string };

// `siblings` is how many other fees are recorded on the same deal or opportunity.
export function feeProblems(f: FeeCheck, linkedDeal: { mandateSigned: boolean } | null, siblings: number): string[] {
  const out: string[] = [];
  const contracted = ["Contracted", "Invoiced", "Collected"].includes(f.status);
  if (contracted && !f.agreement) out.push("A fee is contracted only under a signed written agreement.");
  if (contracted && linkedDeal && !linkedDeal.mandateSigned)
    out.push("Brokerage on this deal needs a signed mandate before the fee is contracted.");
  if (contracted && siblings > 0 && !f.disclosed)
    out.push("This project already carries another fee. Confirm that scope, payer, milestone and any conflict of interest are disclosed to all parties.");
  if (f.status === "Collected" && !f.collectedOn) out.push("Enter the date the money was received.");
  if (contracted && f.amount <= 0) out.push("Enter the agreed fee amount.");
  return out;
}

// ---------------------------------------------------------------- Money

export const brokerageStreams = ["Sale brokerage", "Lease brokerage"];

export function rewardFor(rate: number, collectedBrokerage: number) {
  return Math.round((collectedBrokerage * rate) / 100);
}

export function monthStart(now: number) {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}
