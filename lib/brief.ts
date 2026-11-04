// A requirement drafted in the landing page's Match Engine, kept in this browser
// until the visitor signs in as a business and saves it.
export const briefKey = "assetmeet-brief";

export function savedBrief() {
  try {
    const brief = JSON.parse(localStorage.getItem(briefKey) ?? "null");
    return brief && typeof brief === "object" ? { kind: "requirement" as const, initial: brief as Record<string, unknown> } : null;
  } catch {
    return null;
  }
}
