import { z } from "zod";

// Shared between the API (validation) and the UI (options and types).
// Vocabulary follows the Revenue & Business Model document (28 Oct 2026).
export const districts = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
] as const;
export const propertyTypes = ["Commercial", "Warehouse", "Industrial", "Land", "Residential"] as const;
export const transactions = ["Lease", "Sale", "Rent", "Joint venture", "Built-to-suit"] as const;
export const constructionStages = ["Sanctioned", "Under construction", "On hold", "Completed"] as const;

// Asset Bank lifecycle.
export const propertyStatuses = [
  "Mapped",
  "Owner confirmed",
  "Mandated",
  "Available",
  "In negotiation",
  "Closed",
  "Withdrawn",
] as const;
// Independent checks of title, permits, zoning and project registration.
// "Issue found" holds the property: it is not offered as approved inventory.
export const verificationLevels = ["Not checked", "Under review", "Verified", "Issue found"] as const;
// Who may see the property. Members see it anonymised in self-service matching.
export const visibilities = ["Private", "Members", "Mandate only"] as const;

// Demand Bank lifecycle.
export const requirementStatuses = [
  "Draft",
  "Qualified",
  "Matching",
  "Viewing",
  "Offer",
  "Closed",
  "Unmet",
  "Development lead",
] as const;

// Deal Desk: Flag › Qualify › Sign mandate › Site visit › Negotiate › Close & collect.
export const dealStages = ["Flagged", "Qualified", "Mandate signed", "Site visit", "Negotiation", "Closed", "Dropped"] as const;
export const mandateParties = ["Owner", "Client", "Both"] as const;
export const contributorTiers = ["Data contributor", "Qualified sourcer", "Deal partner"] as const;
export const payoutStatuses = ["Not due", "Pending approval", "Approved", "Paid"] as const;

// Opportunity Bank: unmet demand turned into a development project.
export const opportunityStages = [
  "Demand gap detected",
  "Site options",
  "Feasibility initiated",
  "Proposal submitted",
  "Conditional commitment",
  "Funded / approved",
  "Under development",
  "Delivered / leased",
  "Dropped",
] as const;

// Revenue: every fee is tracked through these stages separately, so unsigned
// value is never shown as collected revenue.
export const revenueStreams = [
  "Sale brokerage",
  "Lease brokerage",
  "Corporate sourcing",
  "Feasibility & advisory",
  "Design / PMC",
] as const;
export const feeStatuses = ["Pipeline", "Contracted", "Invoiced", "Collected", "Cancelled"] as const;

export const roles = ["Business", "Owner", "Contributor"] as const;
export const planNames = ["Free", "Connect", "Professional", "Corporate"] as const;

const text = z.string().trim().min(1, "Fill in this field").max(160);
const optional = z.string().trim().max(160).default("");
const long = z.string().trim().max(4000).default("");
const date = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")]).default("");
const amount = z.coerce.number().finite().nonnegative().max(1e12);
const count = z.coerce.number().int().nonnegative().max(100000);
const flag = z.boolean().default(false);

export const propertyInput = z.object({
  name: text,
  district: z.enum(districts),
  locality: optional,
  type: z.enum(propertyTypes),
  area: amount.positive("Area must be more than 0"),
  price: amount,
  transaction: z.enum(transactions),
  construction: z.enum(constructionStages),
  status: z.enum(propertyStatuses),
  verification: z.enum(verificationLevels),
  visibility: z.enum(visibilities),
  parking: count,
  months: count,
  consent: z.boolean(),
  source: text,
  ownerContact: optional,
});

export const requirementInput = z
  .object({
    name: text,
    district: z.enum(districts),
    type: z.enum(propertyTypes),
    minArea: amount.positive("Minimum area must be more than 0"),
    maxArea: amount.positive("Maximum area must be more than 0"),
    budget: amount.positive("Budget must be more than 0"),
    transaction: z.enum(transactions),
    parking: count,
    months: count,
    status: z.enum(requirementStatuses).default("Draft"),
  })
  .refine((x) => x.maxArea >= x.minArea, "Maximum area must be at least the minimum area");

export const dealInput = z.object({
  name: text,
  propertyId: z.string().min(1),
  requirementId: z.string().min(1),
  stage: z.enum(dealStages),
  // Pre-deal records
  leadSource: optional,
  value: amount.default(0),
  mandateSigned: flag,
  mandateParty: z.enum(mandateParties).default("Owner"),
  exclusivity: optional,
  trigger: optional,
  optIn: flag,
  // Execution
  assignee: optional,
  nextAction: optional,
  followup: date,
  notes: long,
  // Contributor economics
  sourceTier: z.enum(contributorTiers).default("Data contributor"),
  rewardRate: z.coerce.number().min(0).max(100).default(0),
  payoutStatus: z.enum(payoutStatuses).default("Not due"),
});

export const opportunityInput = z.object({
  name: text,
  requirementId: z.string().min(1, "Choose the demand behind this opportunity"),
  propertyId: z.string().default(""),
  stage: z.enum(opportunityStages),
  assignee: optional,
  nextAction: optional,
  followup: date,
  notes: long,
});

export const feeInput = z.object({
  name: text,
  stream: z.enum(revenueStreams),
  linkKind: z.enum(["deal", "opportunity", ""]).default(""),
  linkId: z.string().default(""),
  payer: text,
  trigger: optional,
  status: z.enum(feeStatuses),
  amount: amount,
  agreement: flag,
  disclosed: flag,
  invoice: optional,
  collectedOn: date,
});

export const profileInput = z
  .object({
    role: z.enum(roles),
    name: z.string().trim().min(2, "Enter your name").max(100),
    organisation: optional,
    phone: z.string().trim().max(30).default(""),
    licenseNumber: z.string().trim().max(100).default(""),
    licenseAuthority: optional,
  })
  .superRefine((x, c) => {
    if (x.role === "Business" && !x.organisation)
      c.addIssue({ code: "custom", message: "Enter your company name", path: ["organisation"] });
  });

export const planInput = z.object({
  owner: z.string().min(1),
  plan: z.enum(planNames),
  planUntil: date,
});

export type PropertyInput = z.infer<typeof propertyInput>;
export type RequirementInput = z.infer<typeof requirementInput>;
export type DealInput = z.infer<typeof dealInput>;
export type OpportunityInput = z.infer<typeof opportunityInput>;
export type FeeInput = z.infer<typeof feeInput>;
export type ProfileInput = z.infer<typeof profileInput>;
export type PlanName = (typeof planNames)[number];

// `shared` marks a record from another account that this user may see in part
// (a shortlisted property for a business, a requirement behind interest in an owner's property).
// `pool` marks an anonymised record offered to a subscriber for self-service matching.
type Meta = { id: string; shared?: boolean; pool?: boolean };
export type Property = PropertyInput & Meta & { kind: "property" };
export type Requirement = RequirementInput & Meta & { kind: "requirement" };
// `reward` is the contributor reward on collected brokerage, worked out on the server.
export type Deal = DealInput & Meta & { kind: "deal"; reward?: number; created?: number };
export type Opportunity = OpportunityInput & Meta & { kind: "opportunity" };
export type Fee = FeeInput & Meta & { kind: "fee" };
// Staff is never self-selected; it is set on a profile directly in the database.
export type Role = (typeof roles)[number] | "Staff";
export type Profile = Omit<ProfileInput, "role"> & {
  role: Role;
  verification: string;
  plan: PlanName;
  planUntil: string;
};
export type Kind = "property" | "requirement" | "deal" | "opportunity" | "fee";
