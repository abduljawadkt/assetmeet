import { AlertCircle, CheckCircle2 } from "lucide-react";
import { match } from "../lib/matching";
import { priceLabel, sqft, months } from "../lib/format";
import type { Property, Requirement } from "../lib/records";

export function Wordmark() {
  return (
    <span className="wordmark" aria-label="AssetMeet">
      <span className="wordmark-symbol" aria-hidden="true">am</span>
      <span className="wordmark-name" aria-hidden="true">
        asset<strong>meet</strong>
      </span>
    </span>
  );
}

export function Placeholder({ label, hint }: { label: string; hint?: string }) {
  return (
    <span className="placeholder">
      <span className="placeholder-tag">To add</span>
      <span>{label}</span>
      {hint && <small>{hint}</small>}
    </span>
  );
}

// Pre-market supply (mapped, or confirmed by the owner but not yet mandated) is
// the one place the laterite accent appears.
export function StatusPill({ status }: { status: string }) {
  if (status === "Mapped" || status === "Owner confirmed")
    return <span className="pill pill-laterite">{status === "Mapped" ? "Mapped · not listed" : "Owner confirmed"}</span>;
  if (status === "Closed" || status === "Withdrawn") return <span className="pill pill-muted">{status}</span>;
  return <span className="pill pill-brand">{status}</span>;
}

export function VerificationPill({ level }: { level: string }) {
  const tone =
    level === "Verified" ? "pill-brand" : level === "Issue found" ? "pill-danger" : level === "Under review" ? "pill-warning" : "pill-muted";
  return <span className={`pill ${tone}`}>{level === "Issue found" ? "On hold · issue found" : `Documents: ${level.toLowerCase()}`}</span>;
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "brand" | "warning" | "danger" | "muted" | "laterite" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

// Reasons from lib/matching.ts that mean the criterion is met.
const metReasons = new Set([
  "Preferred district",
  "Area within range",
  "Within budget",
  "Parking suitable",
  "Ready within timeline",
  "Owner permission recorded",
]);

export function Reasons({ reasons }: { reasons: string[] }) {
  return (
    <ul className="reasons">
      {reasons.map((r) => {
        const ok = metReasons.has(r);
        return (
          <li key={r} className={ok ? "reason-ok" : "reason-review"}>
            {ok ? <CheckCircle2 size={15} aria-hidden="true" /> : <AlertCircle size={15} aria-hidden="true" />}
            <span>
              <span className="visually-hidden">{ok ? "Met: " : "Needs review: "}</span>
              {r}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Score({ value }: { value: number }) {
  return (
    <div className="score" aria-label={`Fit score ${value} out of 100`}>
      <strong>{value}</strong>
      <span>fit</span>
    </div>
  );
}

export function MatchRow({ property, requirement }: { property: Property; requirement: Requirement }) {
  const m = match(property, requirement);
  if (!m) return null;
  return (
    <div className="match-row">
      <Score value={m.score} />
      <div className="match-row-body">
        <div className="match-row-head">
          <h3>{property.name}</h3>
          <StatusPill status={property.status} />
        </div>
        <p className="facts">
          {property.locality ? `${property.locality}, ` : ""}
          {property.district} · {sqft(property.area)} · {priceLabel(property.price, property.transaction)} ·{" "}
          {months(property.months)}
        </p>
        <Reasons reasons={m.reasons} />
      </div>
    </div>
  );
}
