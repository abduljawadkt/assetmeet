import type { Property } from "./records";

// Fictional properties for the landing page's live Match Engine. Names, owners and
// figures are invented for illustration and are labelled as samples on the page.
const base = { kind: "property" as const, verification: "Verified" as const, visibility: "Members" as const, source: "", ownerContact: "", consent: true };

export const sampleMarket: Property[] = [
  { ...base, id: "s1", name: "Bypass Commerce Centre", district: "Kozhikode", locality: "Thondayad", type: "Commercial", area: 22000, price: 480000, transaction: "Lease", construction: "Completed", status: "Available", parking: 40, months: 0 },
  { ...base, id: "s2", name: "West Hill Retail Square", district: "Kozhikode", locality: "West Hill", type: "Commercial", area: 18500, price: 560000, transaction: "Lease", construction: "Under construction", status: "Mapped", verification: "Not checked", consent: false, parking: 28, months: 8 },
  { ...base, id: "s3", name: "Mavoor Road Showroom Block", district: "Kozhikode", locality: "Mavoor Road", type: "Commercial", area: 6500, price: 210000, transaction: "Lease", construction: "Completed", status: "Owner confirmed", parking: 12, months: 1 },
  { ...base, id: "s4", name: "Edappally Junction Tower", district: "Ernakulam", locality: "Edappally", type: "Commercial", area: 14000, price: 640000, transaction: "Lease", construction: "Under construction", status: "Owner confirmed", parking: 30, months: 5 },
  { ...base, id: "s5", name: "Vyttila Hub Retail Floor", district: "Ernakulam", locality: "Vyttila", type: "Commercial", area: 9000, price: 380000, transaction: "Lease", construction: "Completed", status: "Available", parking: 16, months: 0 },
  { ...base, id: "s6", name: "North Gate Logistics Park", district: "Ernakulam", locality: "Kalamassery", type: "Warehouse", area: 34000, price: 620000, transaction: "Lease", construction: "Completed", status: "Available", parking: 24, months: 1 },
  { ...base, id: "s7", name: "Angamaly Cold Chain Shed", district: "Ernakulam", locality: "Angamaly", type: "Warehouse", area: 52000, price: 900000, transaction: "Lease", construction: "Sanctioned", status: "Mapped", verification: "Not checked", consent: false, parking: 30, months: 11 },
  { ...base, id: "s8", name: "Kanjikode Industrial Bay", district: "Palakkad", locality: "Kanjikode", type: "Industrial", area: 40000, price: 520000, transaction: "Lease", construction: "Completed", status: "Owner confirmed", parking: 35, months: 2 },
  { ...base, id: "s9", name: "Puzhakkal Commercial Plot", district: "Thrissur", locality: "Puzhakkal", type: "Land", area: 54000, price: 24000000, transaction: "Sale", construction: "Sanctioned", status: "Mapped", verification: "Under review", parking: 0, months: 3 },
  { ...base, id: "s10", name: "Swaraj Round Corner Floor", district: "Thrissur", locality: "Round North", type: "Commercial", area: 7200, price: 300000, transaction: "Lease", construction: "Completed", status: "Available", parking: 8, months: 0 },
  { ...base, id: "s11", name: "Kondotty Highway Warehouse", district: "Malappuram", locality: "Kondotty", type: "Warehouse", area: 28000, price: 430000, transaction: "Lease", construction: "Under construction", status: "Owner confirmed", parking: 20, months: 7 },
  { ...base, id: "s12", name: "Pattom Office Floors", district: "Thiruvananthapuram", locality: "Pattom", type: "Commercial", area: 16000, price: 720000, transaction: "Lease", construction: "Completed", status: "Mandated", parking: 32, months: 0 },
  { ...base, id: "s13", name: "Kazhakkoottam Tech Plot", district: "Thiruvananthapuram", locality: "Kazhakkoottam", type: "Land", area: 87000, price: 61000000, transaction: "Sale", construction: "Sanctioned", status: "Owner confirmed", parking: 0, months: 0 },
  { ...base, id: "s14", name: "Thavakkara Retail Arcade", district: "Kannur", locality: "Thavakkara", type: "Commercial", area: 12000, price: 260000, transaction: "Lease", construction: "Under construction", status: "Mapped", verification: "Not checked", consent: false, parking: 18, months: 6 },
];
