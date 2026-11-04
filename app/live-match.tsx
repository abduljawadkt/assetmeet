"use client";
import { useMemo, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { StatusPill } from "./brand";
import { match } from "../lib/matching";
import { districts } from "../lib/records";
import { sampleMarket } from "../lib/sample-market";
import { inrShort, months as ready, sqft } from "../lib/format";
import { briefKey } from "../lib/brief";

const types = ["Commercial", "Warehouse", "Industrial", "Land"] as const;
const timings: [string, number][] = [
  ["Now", 1],
  ["In 6 months", 6],
  ["In a year", 12],
];

// Budget sliders run on a log scale so one control covers ₹50,000 to ₹15 lakh a month,
// or ₹50 lakh to ₹100 crore for land.
const ranges = { Lease: [50000, 1500000], Sale: [5000000, 1000000000] } as const;
function fromSlider(v: number, [lo, hi]: readonly [number, number]) {
  const raw = lo * Math.pow(hi / lo, v / 100);
  const step = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
  return Math.round(raw / step) * step;
}


export default function LiveMatch() {
  const [district, setDistrict] = useState("Kozhikode");
  const [type, setType] = useState<(typeof types)[number]>("Commercial");
  const [area, setArea] = useState(20000);
  const [budgetPos, setBudgetPos] = useState(70);
  const [within, setWithin] = useState(6);

  const transaction = type === "Land" ? "Sale" : "Lease";
  const budget = fromSlider(budgetPos, ranges[transaction]);
  const requirement = useMemo(
    () => ({
      id: "brief",
      name: "Your brief",
      district,
      type,
      transaction,
      minArea: Math.round(area * 0.8),
      maxArea: Math.round(area * 1.2),
      budget,
      parking: type === "Land" ? 0 : Math.round(area / 700),
      months: within,
    }),
    [district, type, transaction, area, budget, within],
  );

  const results = useMemo(
    () =>
      sampleMarket
        .map((p) => ({ p, m: match(p, requirement) }))
        .filter((x): x is { p: (typeof sampleMarket)[number]; m: NonNullable<ReturnType<typeof match>> } => x.m !== null)
        .sort((a, b) => b.m.score - a.m.score),
    [requirement],
  );
  const shown = results.slice(0, 3);
  const offMarket = results.filter((x) => x.p.status === "Mapped" || x.p.status === "Owner confirmed").length;

  function saveBrief() {
    try {
      localStorage.setItem(
        briefKey,
        JSON.stringify({ ...requirement, id: undefined, name: `${type} space in ${district}`, status: "Draft" }),
      );
    } catch {
      // Storage can be blocked; the brief form still opens empty.
    }
    window.location.assign("/?view=app&role=Business");
  }

  return (
    <section className="live" aria-labelledby="live-title">
      <div className="live-head">
        <h2 id="live-title">Try the Match Engine</h2>
        <p>Set a brief. Sample properties are scored as you go.</p>
      </div>

      <div className="live-controls">
        <label className="live-field">
          <span>District</span>
          <select value={district} onChange={(e) => setDistrict(e.target.value)}>
            {districts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>

        <fieldset className="live-field">
          <legend>Space</legend>
          <div className="segmented">
            {types.map((t) => (
              <label key={t}>
                <input type="radio" name="live-type" checked={type === t} onChange={() => setType(t)} />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="live-field">
          <span>
            Size <output>about {sqft(area)}</output>
          </span>
          <input type="range" min={2000} max={100000} step={500} value={area} onChange={(e) => setArea(Number(e.target.value))} />
        </label>

        <label className="live-field">
          <span>
            {transaction === "Lease" ? "Rent up to" : "Budget up to"}{" "}
            <output>
              {inrShort(budget)}
              {transaction === "Lease" ? " / month" : ""}
            </output>
          </span>
          <input type="range" min={0} max={100} value={budgetPos} onChange={(e) => setBudgetPos(Number(e.target.value))} />
        </label>

        <fieldset className="live-field">
          <legend>Needed</legend>
          <div className="segmented">
            {timings.map(([label, m]) => (
              <label key={label}>
                <input type="radio" name="live-when" checked={within === m} onChange={() => setWithin(m)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="live-summary" aria-live="polite">
        {results.length ? (
          <>
            <strong>
              {results.length} {results.length === 1 ? "property fits" : "properties fit"}
            </strong>
            {results.length > shown.length && <span className="muted small">best {shown.length} shown</span>}
            {offMarket > 0 && (
              <span className="live-offmarket">
                {offMarket} not on the open market yet
              </span>
            )}
          </>
        ) : (
          <strong>No sample property fits this brief</strong>
        )}
      </p>

      {results.length ? (
        <ol className="live-results">
          {shown.map(({ p, m }) => {
            const gaps = m.reasons.filter((r) => !metReasons.has(r));
            return (
              <li key={p.id}>
                <div className="live-score" style={{ "--score": m.score } as React.CSSProperties}>
                  <strong>{m.score}</strong>
                </div>
                <div className="live-body">
                  <div className="live-title">
                    <h3>{p.name}</h3>
                    <StatusPill status={p.status} />
                  </div>
                  <p className="live-facts">
                    {p.locality}, {p.district} · {sqft(p.area)} · {inrShort(p.price)}
                    {p.transaction === "Lease" ? " / month" : ""} · {ready(p.months)}
                  </p>
                  <p className={`live-why ${gaps.length ? "" : "ok"}`}>
                    {gaps.length ? <AlertCircle size={14} aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
                    {gaps.length ? `To check: ${gaps.join(", ").toLowerCase()}` : "Fits on every criterion"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="live-empty">
          <Sparkles size={20} aria-hidden="true" />
          <p>
            On AssetMeet this is where a new search starts. A confirmed brief with nothing to match can become a
            development opportunity: land, a developer and a project proposal.
          </p>
        </div>
      )}

      <div className="live-foot">
        <button type="button" className="btn btn-primary" onClick={saveBrief}>
          Save this brief and get a shortlist <ArrowRight size={18} aria-hidden="true" />
        </button>
        <p>Sample properties are fictional. Real records stay private until the owner agrees.</p>
      </div>
    </section>
  );
}

const metReasons = new Set([
  "Preferred district",
  "Area within range",
  "Within budget",
  "Parking suitable",
  "Ready within timeline",
  "Owner permission recorded",
]);
