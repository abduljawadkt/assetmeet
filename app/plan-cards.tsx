import { Pill } from "./brand";
import { inr } from "../lib/format";
import type { PlanName } from "../lib/records";
import { planFeatures, plans } from "../lib/rules";
import { site } from "../lib/site-content";

// Subscription plans and how they differ, shown on the landing page and in the Plan view.
export function PlanCards({ current, currentLabel = "Your plan" }: { current?: PlanName; currentLabel?: string }) {
  const paidPlans = ["Connect", "Professional", "Corporate"] as const;
  return (
    <>
      <div className="plan-grid">
        {paidPlans.map((p) => {
          const q = plans[p];
          return (
            <div key={p} className={`plan-card ${p === "Professional" && !current ? "plan-card-featured" : ""} ${current === p ? "plan-card-current" : ""}`}>
              <p className="plan-name">{p}</p>
              <p className="plan-price">
                {inr(q.price)}
                <span> per month</span>
              </p>
              <ul>
                <li>
                  <strong>{q.assets}</strong> active assets
                </li>
                <li>
                  <strong>{q.demands}</strong> active demands
                </li>
                <li>
                  <strong>{q.matches}</strong> saved matches a month
                </li>
                <li>
                  {q.logins} user {q.logins === 1 ? "login" : "logins"}
                </li>
              </ul>
              {current === p && <Pill tone="brand">{currentLabel}</Pill>}
            </div>
          );
        })}
      </div>
      <p className="small muted">{site.pricingNote}</p>
      <div className="table-wrap">
        <table className="data-table plan-table">
          <thead>
            <tr>
              <th scope="col">Feature</th>
              {paidPlans.map((p) => (
                <th scope="col" key={p}>
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planFeatures.map(([feature, ...cells]) => (
              <tr key={feature}>
                <td data-label="Feature">{feature}</td>
                {cells.map((c, i) => (
                  <td key={paidPlans[i]} data-label={paidPlans[i]}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

