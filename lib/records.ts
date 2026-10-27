import { z } from "zod";

// Shared between the API (validation) and the UI (options and types).
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
export const propertyTypes = ["Commercial", "Warehouse", "Land", "Residential"] as const;
export const transactions = ["Lease", "Sale", "Rent", "Joint venture", "Built-to-suit"] as const;
export const constructionStages = ["Sanctioned", "Under construction", "On hold", "Completed"] as const;
export const marketStatuses = ["Unknown", "Exploring", "Available", "Negotiation", "Sold / leased"] as const;
export const verificationLevels = ["Reported", "Owner confirmed", "Documents verified", "Mandate signed"] as const;
export const dealStages = ["Review", "Owner outreach", "Qualified", "Site visit", "Negotiation", "Closed"] as const;
export const roles = ["Business", "Owner", "Contributor"] as const;

const text = z.string().trim().min(1, "Fill in this field").max(160);
const optional = z.string().trim().max(160).default("");
const amount = z.coerce.number().finite().nonnegative().max(1e12);
const count = z.coerce.number().int().nonnegative().max(100000);

export const propertyInput = z.object({
  name: text,
  district: z.enum(districts),
  locality: optional,
  type: z.enum(propertyTypes),
  area: amount.positive("Area must be more than 0"),
  price: amount,
  transaction: z.enum(transactions),
  construction: z.enum(constructionStages),
  market: z.enum(marketStatuses),
  verification: z.enum(verificationLevels),
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
  })
  .refine((x) => x.maxArea >= x.minArea, "Maximum area must be at least the minimum area");

export const dealInput = z.object({
  name: text,
  propertyId: z.string().min(1),
  requirementId: z.string().min(1),
  stage: z.enum(dealStages),
  followup: z.string().max(20).default(""),
  collected: amount.default(0),
  rewardRate: z.coerce.number().min(0).max(100).default(0),
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

export type PropertyInput = z.infer<typeof propertyInput>;
export type RequirementInput = z.infer<typeof requirementInput>;
export type DealInput = z.infer<typeof dealInput>;
export type ProfileInput = z.infer<typeof profileInput>;
// `shared` marks a record from another account that this user may see in part
// (a shortlisted property for a business, a requirement behind interest in an owner's property).
type Meta = { id: string; shared?: boolean };
export type Property = PropertyInput & Meta & { kind: "property" };
export type Requirement = RequirementInput & Meta & { kind: "requirement" };
export type Deal = DealInput & Meta & { kind: "deal" };
// Staff is never self-selected; it is set on a profile directly in the database.
export type Role = (typeof roles)[number] | "Staff";
export type Profile = Omit<ProfileInput, "role"> & { role: Role; verification: string };
export type Kind = "property" | "requirement" | "deal";

// Deals cannot move past owner outreach until the owner has given permission.
export const stagesNeedingConsent: readonly string[] = ["Qualified", "Site visit", "Negotiation", "Closed"];
