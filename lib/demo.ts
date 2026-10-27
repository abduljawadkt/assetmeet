import type { Deal, Property, Requirement } from "./records";

// Fictional sample records for the read-only demo workspace and the landing page preview.
export const demoProperties: Property[] = [
  { kind: "property", id: "demo-p1", name: "Bypass Commerce Centre", district: "Kozhikode", locality: "Thondayad bypass", type: "Commercial", area: 22000, price: 480000, transaction: "Lease", construction: "Completed", market: "Available", verification: "Mandate signed", parking: 40, months: 0, consent: true, source: "Sample engineer", ownerContact: "Sample owner · +91 00000 00000" },
  { kind: "property", id: "demo-p2", name: "West Hill Retail Square", district: "Kozhikode", locality: "West Hill", type: "Commercial", area: 18500, price: 560000, transaction: "Lease", construction: "Under construction", market: "Unknown", verification: "Reported", parking: 28, months: 8, consent: false, source: "Sample architect", ownerContact: "" },
  { kind: "property", id: "demo-p3", name: "North Gate Logistics Park", district: "Ernakulam", locality: "Kalamassery", type: "Warehouse", area: 34000, price: 620000, transaction: "Lease", construction: "Completed", market: "Exploring", verification: "Owner confirmed", parking: 24, months: 1, consent: true, source: "Sample builder", ownerContact: "" },
  { kind: "property", id: "demo-p4", name: "Riverside Commercial Plot", district: "Thrissur", locality: "Puzhakkal", type: "Land", area: 54000, price: 24000000, transaction: "Sale", construction: "Sanctioned", market: "Unknown", verification: "Reported", parking: 0, months: 3, consent: false, source: "Sample engineer", ownerContact: "" },
];

export const demoRequirements: Requirement[] = [
  { kind: "requirement", id: "demo-r1", name: "Supermarket expansion", district: "Kozhikode", type: "Commercial", minArea: 15000, maxArea: 25000, budget: 500000, transaction: "Lease", parking: 30, months: 6 },
  { kind: "requirement", id: "demo-r2", name: "Regional distribution hub", district: "Ernakulam", type: "Warehouse", minArea: 30000, maxArea: 40000, budget: 650000, transaction: "Lease", parking: 20, months: 3 },
];

export const demoDeals: Deal[] = [
  { kind: "deal", id: "demo-d1", name: "Bypass Commerce Centre · Supermarket", propertyId: "demo-p1", requirementId: "demo-r1", stage: "Site visit", followup: "2026-11-04", collected: 0, rewardRate: 15 },
  { kind: "deal", id: "demo-d2", name: "North Gate · Distribution hub", propertyId: "demo-p3", requirementId: "demo-r2", stage: "Qualified", followup: "2026-10-20", collected: 0, rewardRate: 15 },
];
