// Weighted, deterministic Match Engine: location 25, area 20, budget 20,
// technical fit (parking) 15, possession 10, owner confirmation 10.
export type Asset = {
  id: string;
  name: string;
  district: string;
  type: string;
  area: number;
  price: number;
  transaction: string;
  construction: string;
  status: string;
  verification: string;
  parking: number;
  months: number;
  consent: boolean;
};
export type Requirement = {
  id: string;
  name: string;
  district: string;
  type: string;
  minArea: number;
  maxArea: number;
  budget: number;
  transaction: string;
  parking: number;
  months: number;
};

const closed = ["Closed", "Withdrawn"];
const mandated = ["Mandated", "Available", "In negotiation"];

export function match(a: Asset, r: Requirement) {
  if (a.type !== r.type || a.transaction !== r.transaction || closed.includes(a.status)) return null;
  const location = a.district === r.district ? 25 : 0;
  const area =
    a.area >= r.minArea && a.area <= r.maxArea
      ? 20
      : Math.max(0, 20 * (1 - Math.min(Math.abs(a.area - r.minArea), Math.abs(a.area - r.maxArea)) / Math.max(r.maxArea, 1)));
  const budget = a.price > 0 ? Math.min(20, (20 * r.budget) / a.price) : 0;
  const technical = a.parking >= r.parking ? 15 : (15 * a.parking) / Math.max(1, r.parking);
  const readiness = a.months <= r.months ? 10 : 0;
  const confirmation = mandated.includes(a.status) ? 10 : a.status === "Owner confirmed" ? 5 : 0;
  const hold = a.verification === "Issue found";
  return {
    score: Math.round(location + area + budget + technical + readiness + confirmation),
    // Private outreach comes first when the owner has not approved marketing,
    // the property is not yet offered, or its documents are under review.
    outreach: !a.consent || !["Mandated", "Available"].includes(a.status) || hold,
    hold,
    reasons: [
      location ? "Preferred district" : "Outside preferred district",
      area === 20 ? "Area within range" : "Area outside target",
      budget === 20 ? "Within budget" : a.price ? "Above budget" : "Price unconfirmed",
      technical === 15 ? "Parking suitable" : "Parking shortfall",
      readiness ? "Ready within timeline" : "Possession needs review",
      a.consent ? "Owner permission recorded" : "Owner permission pending",
      ...(hold ? ["Title or approvals under a cloud"] : []),
    ],
  };
}
