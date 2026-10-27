const inrFormat = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// Full rupee amount with Indian digit grouping: ₹4,80,000
export function inr(n: number) {
  return inrFormat.format(n || 0);
}

// Short form in lakh and crore: ₹4.8 L, ₹2.4 Cr
export function inrShort(n: number) {
  if (!n) return "Price not confirmed";
  if (n >= 1e7) return `₹${trim(n / 1e7)} Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)} L`;
  return inr(n);
}

export function sqft(n: number) {
  return `${Math.round(n).toLocaleString("en-IN")} sq.ft`;
}

export function priceLabel(price: number, transaction: string) {
  const monthly = transaction === "Lease" || transaction === "Rent";
  return price ? `${inrShort(price)}${monthly ? " / month" : ""}` : "Price not confirmed";
}

export function months(n: number) {
  if (n <= 0) return "Ready now";
  return `Ready in ${n} month${n === 1 ? "" : "s"}`;
}

function trim(n: number) {
  return n.toFixed(2).replace(/\.?0+$/, "");
}
