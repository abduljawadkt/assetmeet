import type { Member } from "./api";
import type { Deal, Fee, Opportunity, Property, Requirement } from "./records";

// Fictional sample records for the read-only demo workspace and the landing page preview.
export const demoProperties: Property[] = [
  { kind: "property", id: "demo-p1", name: "Bypass Commerce Centre", district: "Kozhikode", locality: "Thondayad bypass", type: "Commercial", area: 22000, price: 480000, transaction: "Lease", construction: "Completed", status: "Available", verification: "Verified", visibility: "Members", parking: 40, months: 0, consent: true, source: "Sample engineer", ownerContact: "Sample owner · +91 00000 00000" },
  { kind: "property", id: "demo-p2", name: "West Hill Retail Square", district: "Kozhikode", locality: "West Hill", type: "Commercial", area: 18500, price: 560000, transaction: "Lease", construction: "Under construction", status: "Mapped", verification: "Not checked", visibility: "Private", parking: 28, months: 8, consent: false, source: "Sample architect", ownerContact: "" },
  { kind: "property", id: "demo-p3", name: "North Gate Logistics Park", district: "Ernakulam", locality: "Kalamassery", type: "Warehouse", area: 34000, price: 620000, transaction: "Lease", construction: "Completed", status: "Owner confirmed", verification: "Under review", visibility: "Private", parking: 24, months: 1, consent: true, source: "Sample builder", ownerContact: "" },
  { kind: "property", id: "demo-p4", name: "Riverside Commercial Plot", district: "Thrissur", locality: "Puzhakkal", type: "Land", area: 54000, price: 24000000, transaction: "Sale", construction: "Sanctioned", status: "Mapped", verification: "Not checked", visibility: "Private", parking: 0, months: 3, consent: false, source: "Sample engineer", ownerContact: "" },
  { kind: "property", id: "demo-p6", name: "Kakkanad Warehouse Bay", district: "Ernakulam", locality: "Kakkanad", type: "Warehouse", area: 36000, price: 600000, transaction: "Lease", construction: "Completed", status: "Available", verification: "Verified", visibility: "Members", parking: 22, months: 0, consent: true, source: "Sample engineer", ownerContact: "Sample owner · +91 00000 00002" },
  { kind: "property", id: "demo-p5", name: "Kondotty Highway Land", district: "Malappuram", locality: "Kondotty", type: "Land", area: 130000, price: 52000000, transaction: "Joint venture", construction: "Sanctioned", status: "Owner confirmed", verification: "Under review", visibility: "Mandate only", parking: 0, months: 0, consent: true, source: "Sample sourcing partner", ownerContact: "Sample landowner · +91 00000 00001" },
];

export const demoRequirements: Requirement[] = [
  { kind: "requirement", id: "demo-r1", name: "Supermarket expansion", district: "Kozhikode", type: "Commercial", minArea: 15000, maxArea: 25000, budget: 500000, transaction: "Lease", parking: 30, months: 6, status: "Viewing" },
  { kind: "requirement", id: "demo-r2", name: "Regional distribution hub", district: "Ernakulam", type: "Warehouse", minArea: 30000, maxArea: 40000, budget: 650000, transaction: "Lease", parking: 20, months: 3, status: "Qualified" },
  { kind: "requirement", id: "demo-r3", name: "Logistics warehouse, long-term lease", district: "Malappuram", type: "Warehouse", minArea: 38000, maxArea: 42000, budget: 900000, transaction: "Lease", parking: 30, months: 18, status: "Development lead" },
];

const dealDefaults = { leadSource: "", value: 0, mandateSigned: false, mandateParty: "Owner" as const, exclusivity: "", trigger: "", optIn: false, assignee: "", nextAction: "", followup: "", notes: "", sourceTier: "Data contributor" as const, rewardRate: 0, payoutStatus: "Not due" as const };

export const demoDeals: Deal[] = [
  { ...dealDefaults, kind: "deal", id: "demo-d1", name: "Bypass Commerce Centre · Supermarket", propertyId: "demo-p1", requirementId: "demo-r1", stage: "Site visit", leadSource: "Contributor record", value: 480000, mandateSigned: true, mandateParty: "Both", exclusivity: "Exclusive for 90 days", trigger: "One month's rent on lease execution", optIn: true, assignee: "Relationship manager", nextAction: "Second site visit with the client's projects team", followup: "2026-11-06", notes: "First visit done. Client asked for fire NOC and parking layout.", sourceTier: "Qualified sourcer", rewardRate: 15 },
  { ...dealDefaults, kind: "deal", id: "demo-d2", name: "North Gate · Distribution hub", propertyId: "demo-p3", requirementId: "demo-r2", stage: "Qualified", leadSource: "Staff match", value: 620000, assignee: "Opportunity manager", nextAction: "Send mandate to owner", followup: "2026-10-30", sourceTier: "Data contributor" },
];

export const demoOpportunities: Opportunity[] = [
  { kind: "opportunity", id: "demo-o1", name: "Malappuram 40,000 sq.ft logistics warehouse", requirementId: "demo-r3", propertyId: "demo-p5", stage: "Feasibility initiated", assignee: "Opportunity manager", nextAction: "Zoning and approach-road check", followup: "2026-11-12", notes: "No suitable existing building. Three potential land records; this plot is the strongest. Not a constructed project or tenant commitment." },
];

export const demoFees: Fee[] = [
  { kind: "fee", id: "demo-f1", name: "Lease brokerage, one month's rent", stream: "Lease brokerage", linkKind: "deal", linkId: "demo-d1", payer: "Client", trigger: "Lease execution", status: "Contracted", amount: 480000, agreement: true, disclosed: false, invoice: "", collectedOn: "" },
  { kind: "fee", id: "demo-f2", name: "Feasibility study", stream: "Feasibility & advisory", linkKind: "opportunity", linkId: "demo-o1", payer: "Client", trigger: "Report delivered", status: "Invoiced", amount: 250000, agreement: true, disclosed: true, invoice: "AM-0001", collectedOn: "" },
  { kind: "fee", id: "demo-f3", name: "Final leasing mandate", stream: "Lease brokerage", linkKind: "opportunity", linkId: "demo-o1", payer: "Client", trigger: "Lease execution on delivery", status: "Pipeline", amount: 500000, agreement: false, disclosed: true, invoice: "", collectedOn: "" },
];

export const demoMembers: Member[] = [
  { owner: "demo-m1", name: "Sample Retail Pvt Ltd", organisation: "Sample Retail", role: "Business", plan: "Professional", planUntil: "2026-12-31", email: "sample-business@example.com", created: 0 },
  { owner: "demo-m2", name: "Sample Owner", organisation: "", role: "Owner", plan: "Connect", planUntil: "2026-11-30", email: "sample-owner@example.com", created: 0 },
  { owner: "demo-m3", name: "Sample Engineer", organisation: "Sample Associates", role: "Contributor", plan: "Free", planUntil: "", email: "sample-engineer@example.com", created: 0 },
];
