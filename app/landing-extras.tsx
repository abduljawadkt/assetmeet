"use client";
import { useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PlanCards } from "./plan-cards";
import { plans, type Plan } from "../lib/rules";

const journey: { stage: string; who: string; what: string; guard: string }[] = [
  {
    stage: "Flag",
    who: "Match Engine or a member's request",
    what: "A property scores well against a brief, or a subscriber asks for an introduction. Large or unusual deals raise a review alert.",
    guard: "Nobody is contacted yet. A flag is a prompt for the team, never an automatic takeover.",
  },
  {
    stage: "Qualify",
    who: "Opportunity manager",
    what: "The team confirms the business's budget, intent and timeframe, and checks the property's status and documents.",
    guard: "A property with unclear title or approvals is held until it is verified.",
  },
  {
    stage: "Sign mandate",
    who: "Relationship manager",
    what: "The owner, the client or both sign a written mandate that sets the fee, who pays it, the exclusivity term and the milestone that triggers it.",
    guard: "No brokerage without a signed agreement. Your subscription never commits you to one.",
  },
  {
    stage: "Site visit",
    who: "Relationship manager",
    what: "Visits are arranged with the owner's permission in place, and recorded with the deal.",
    guard: "Owner contact details are released to the business only now, after the mandate.",
  },
  {
    stage: "Negotiate",
    who: "Deal Desk, with an external lawyer or valuer as needed",
    what: "Offers, term sheets and due diligence are tracked in one place, with legal and technical review for joint ventures and large land deals.",
    guard: "Confidential deals release information in stages, only to qualified parties.",
  },
  {
    stage: "Close and collect",
    who: "Accounts and payout approver",
    what: "The agreement is signed and the fee is invoiced at the agreed trigger. Contributors are paid their share after the fee is collected and reviewed.",
    guard: "Only money actually received counts as revenue, and every payout has a statement and an audit trail.",
  },
];

export function DealJourney() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const step = journey[active];

  function onKey(e: React.KeyboardEvent, i: number) {
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? journey.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const n = (next + journey.length) % journey.length;
    setActive(n);
    tabs.current[n]?.focus();
  }

  return (
    <div className="journey">
      <div className="journey-track" role="tablist" aria-label="Deal Desk stages">
        {journey.map((j, i) => (
          <button
            key={j.stage}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            role="tab"
            id={`journey-tab-${i}`}
            aria-selected={active === i}
            aria-controls="journey-panel"
            tabIndex={active === i ? 0 : -1}
            className={i < active ? "passed" : ""}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span className="journey-dot">{i + 1}</span>
            <span className="journey-name">{j.stage}</span>
          </button>
        ))}
      </div>
      <div className="journey-panel" role="tabpanel" id="journey-panel" aria-labelledby={`journey-tab-${active}`} key={active}>
        <div>
          <h3>{step.stage}</h3>
          <p className="journey-who">{step.who}</p>
          <p>{step.what}</p>
        </div>
        <p className="journey-guard">
          <ShieldCheck size={20} aria-hidden="true" />
          <span>{step.guard}</span>
        </p>
      </div>
    </div>
  );
}

const paid: Plan[] = ["Connect", "Professional", "Corporate"];

export function PlanFinder() {
  const [assets, setAssets] = useState(8);
  const [demands, setDemands] = useState(3);
  const [intros, setIntros] = useState(10);
  const fit = paid.find((p) => {
    const q = plans[p];
    return (q.assets ?? Infinity) >= assets && (q.demands ?? Infinity) >= demands && q.matches >= intros;
  });

  const field = (label: string, value: number, set: (n: number) => void, max: number) => (
    <label className="finder-field">
      <span>
        {label} <output>{value}</output>
      </span>
      <input type="range" min={0} max={max} value={value} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );

  return (
    <div className="finder">
      <div className="finder-inputs">
        <p className="finder-title">Which plan fits?</p>
        {field("Properties you will list", assets, setAssets, 200)}
        {field("Requirements you will post", demands, setDemands, 120)}
        {field("Introductions you want a month", intros, setIntros, 350)}
        <p className="finder-answer" aria-live="polite">
          {fit ? (
            <>
              <strong>{fit}</strong> covers this, at ₹{plans[fit].price.toLocaleString("en-IN")} a month.
            </>
          ) : (
            <>That is beyond Corporate. Talk to the team about a portfolio arrangement.</>
          )}
        </p>
      </div>
      <PlanCards current={fit} currentLabel="Fits your numbers" />
    </div>
  );
}
