"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  constructionStages,
  contributorTiers,
  dealStages,
  districts,
  feeStatuses,
  mandateParties,
  opportunityStages,
  payoutStatuses,
  propertyStatuses,
  propertyTypes,
  requirementStatuses,
  revenueStreams,
  transactions,
  verificationLevels,
  visibilities,
  type Deal,
  type Kind,
  type Opportunity,
  type Property,
  type Requirement,
} from "../lib/records";
import type { Row } from "../lib/api";

type Props = {
  kind: Kind;
  record?: Row;
  initial?: Record<string, unknown>;
  staff: boolean;
  properties: Property[];
  requirements: Requirement[];
  deals: Deal[];
  opportunities: Opportunity[];
  onSave: (data: Record<string, unknown>) => Promise<void>;
};

const headings: Record<Kind, [string, string, string]> = {
  property: ["List a property.", "Edit this property.", "A building, plot or space. It stays private until you choose who can see it."],
  requirement: ["Post a requirement.", "Edit this requirement.", "Location, size, budget and timing. The AssetMeet team reviews every requirement before matching."],
  deal: ["Send to the Deal Desk.", "Move the deal forward.", "Deal Desk work follows a written mandate. Each stage needs an owner and a dated next action."],
  opportunity: ["Create an opportunity.", "Update this opportunity.", "Unmet demand connected with land or an expandable building. Not a constructed project or tenant commitment."],
  fee: ["Record a fee.", "Update this fee.", "Pipeline is not revenue. A fee is contracted only under a signed written agreement."],
};
const numberFields = new Set(["area", "price", "parking", "months", "minArea", "maxArea", "budget", "value", "rewardRate", "amount"]);
const checkFields = ["consent", "mandateSigned", "optIn", "agreement", "disclosed"];
const selfStatuses = ["Mapped", "Owner confirmed", "Withdrawn"];

function Field({ label, hint, full, children }: { label: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={full ? "am-full" : ""}>
      {label}
      {children}
      {hint && <small className="am-hint">{hint}</small>}
    </label>
  );
}
function Select({ name, options, value }: { name: string; options: readonly string[]; value?: string }) {
  return (
    <select name={name} defaultValue={value ?? options[0]} required>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
function Check({ name, checked, children }: { name: string; checked: boolean; children: React.ReactNode }) {
  return (
    <label className="am-check am-full">
      <input name={name} type="checkbox" defaultChecked={checked} />
      <span>{children}</span>
    </label>
  );
}

export default function RecordForm({ kind, record, initial, staff, properties, requirements, deals, opportunities, onSave }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const r = (record ?? initial ?? {}) as Record<string, unknown>;
  const [transaction, setTransaction] = useState(String(r.transaction ?? "Lease"));
  const [linkKind, setLinkKind] = useState(String(r.linkKind ?? ""));
  const monthly = transaction === "Lease" || transaction === "Rent";
  const v = (k: string) => (r[k] === undefined ? undefined : String(r[k]));
  const status = v("status") ?? "Mapped";
  const statusOptions = staff ? propertyStatuses : selfStatuses.includes(status) ? selfStatuses : [status, ...selfStatuses];
  const [title, editTitle, lede] = headings[kind];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data: Record<string, unknown> = {};
    new FormData(e.currentTarget).forEach((val, k) => {
      data[k] = numberFields.has(k) ? Number(val || 0) : val;
    });
    for (const k of checkFields) if (e.currentTarget.elements.namedItem(k)) data[k] = data[k] === "on";
    if (!staff && kind === "property") data.verification = r.verification ?? "Not checked";
    if (!staff && kind === "requirement") data.status = r.status ?? "Draft";
    try {
      await onSave(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save");
      setBusy(false);
    }
  }

  const transactionSelect = (
    <Field label="Transaction">
      <select name="transaction" value={transaction} onChange={(e) => setTransaction(e.target.value)}>
        {transactions.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </Field>
  );

  return (
    <>
      <span className="hw-eyebrow">{record ? "ASSETMEET WORKSPACE" : "YOUR NEXT OPPORTUNITY"}</span>
      <h2>{record ? editTitle : title}</h2>
      <p>{lede}</p>
      <form className="hw-form am-form" onSubmit={submit}>
        {kind === "property" && (
          <>
            <Field label="Property name *" full>
              <input name="name" defaultValue={v("name")} required maxLength={160} placeholder="e.g. Bypass Commerce Centre" />
            </Field>
            <Field label="District">
              <Select name="district" options={districts} value={v("district") ?? "Kozhikode"} />
            </Field>
            <Field label="Locality">
              <input name="locality" defaultValue={v("locality")} maxLength={160} placeholder="e.g. Thondayad bypass" />
            </Field>
            <Field label="Property type">
              <Select name="type" options={propertyTypes} value={v("type")} />
            </Field>
            {transactionSelect}
            <Field label="Area (sq.ft) *">
              <input name="area" type="number" min={1} step="any" inputMode="numeric" defaultValue={v("area")} required />
            </Field>
            <Field label={monthly ? "Rent per month (₹)" : "Price (₹)"} hint="0 if not confirmed">
              <input name="price" type="number" min={0} step="any" inputMode="numeric" defaultValue={v("price") ?? "0"} required />
            </Field>
            <Field label="Parking spaces">
              <input name="parking" type="number" min={0} step={1} defaultValue={v("parking") ?? "0"} required />
            </Field>
            <Field label="Months until ready" hint="0 if ready now">
              <input name="months" type="number" min={0} step={1} defaultValue={v("months") ?? "0"} required />
            </Field>
            <Field label="Construction">
              <Select name="construction" options={constructionStages} value={v("construction") ?? "Completed"} />
            </Field>
            <Field label="Status" hint={staff ? undefined : "Mandated and later are set by the team"}>
              <Select name="status" options={statusOptions} value={status} />
            </Field>
            {staff && (
              <Field label="Document verification">
                <Select name="verification" options={verificationLevels} value={v("verification") ?? "Not checked"} />
              </Field>
            )}
            <Field label="Who can see it" hint="Members see it anonymised">
              <Select name="visibility" options={visibilities} value={v("visibility") ?? "Private"} />
            </Field>
            <Field label="Recorded by *" hint="Used for source attribution">
              <input name="source" defaultValue={v("source")} required maxLength={160} />
            </Field>
            <Field label="Owner contact" hint="Private until a mandate is signed">
              <input name="ownerContact" defaultValue={v("ownerContact")} maxLength={160} placeholder="Name and phone" />
            </Field>
            <Check name="consent" checked={Boolean(r.consent)}>
              The owner has given permission to market this property
            </Check>
          </>
        )}

        {kind === "requirement" && (
          <>
            <Field label="Requirement title *" full>
              <input name="name" defaultValue={v("name")} required maxLength={160} placeholder="e.g. Supermarket expansion" />
            </Field>
            <Field label="District">
              <Select name="district" options={districts} value={v("district") ?? "Kozhikode"} />
            </Field>
            <Field label="Property type">
              <Select name="type" options={propertyTypes} value={v("type")} />
            </Field>
            {transactionSelect}
            {staff && (
              <Field label="Demand status" hint="Qualified: budget, intent and timing confirmed">
                <Select name="status" options={requirementStatuses} value={v("status") ?? "Draft"} />
              </Field>
            )}
            <Field label="Minimum area (sq.ft) *">
              <input name="minArea" type="number" min={1} step="any" defaultValue={v("minArea")} required />
            </Field>
            <Field label="Maximum area (sq.ft) *">
              <input name="maxArea" type="number" min={1} step="any" defaultValue={v("maxArea")} required />
            </Field>
            <Field label={monthly ? "Budget per month (₹) *" : "Budget (₹) *"}>
              <input name="budget" type="number" min={1} step="any" defaultValue={v("budget")} required />
            </Field>
            <Field label="Parking spaces needed">
              <input name="parking" type="number" min={0} step={1} defaultValue={v("parking") ?? "0"} required />
            </Field>
            <Field label="Possession within (months)">
              <input name="months" type="number" min={0} step={1} defaultValue={v("months") ?? "6"} required />
            </Field>
          </>
        )}

        {kind === "deal" && (
          <>
            <Field label="Deal name *" full>
              <input name="name" defaultValue={v("name")} required maxLength={160} />
            </Field>
            <Field label="Property" full>
              <select name="propertyId" defaultValue={v("propertyId")} required>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.district}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Requirement" full>
              <select name="requirementId" defaultValue={v("requirementId")} required>
                {requirements.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name} · {q.district}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Stage">
              <Select name="stage" options={dealStages} value={v("stage") ?? "Flagged"} />
            </Field>
            <Field label="Deal value (₹)" hint="Pipeline only, never revenue">
              <input name="value" type="number" min={0} step="any" defaultValue={v("value") ?? "0"} />
            </Field>
            <Field label="Lead source">
              <input name="leadSource" defaultValue={v("leadSource")} maxLength={160} />
            </Field>
            <Field label="Mandate from">
              <Select name="mandateParty" options={mandateParties} value={v("mandateParty")} />
            </Field>
            <Field label="Exclusivity term">
              <input name="exclusivity" defaultValue={v("exclusivity")} maxLength={160} placeholder="e.g. Exclusive for 90 days" />
            </Field>
            <Field label="Brokerage trigger">
              <input name="trigger" defaultValue={v("trigger")} maxLength={160} placeholder="e.g. Lease execution" />
            </Field>
            <Check name="mandateSigned" checked={Boolean(r.mandateSigned)}>
              A written mandate is signed (fee, payer and trigger agreed in writing)
            </Check>
            <Check name="optIn" checked={Boolean(r.optIn)}>
              The client has opted in to brokerage representation by AssetMeet
            </Check>
            <Field label="Assigned to">
              <input name="assignee" defaultValue={v("assignee")} maxLength={160} placeholder="e.g. Relationship manager" />
            </Field>
            <Field label="Next follow-up">
              <input name="followup" type="date" defaultValue={v("followup")} />
            </Field>
            <Field label="Next action" full>
              <input name="nextAction" defaultValue={v("nextAction")} maxLength={160} />
            </Field>
            <Field label="Execution notes" hint="Site visits, offers, term sheets, due diligence, payment schedule" full>
              <textarea name="notes" defaultValue={v("notes")} maxLength={4000} rows={3} />
            </Field>
            <Field label="Contribution">
              <Select name="sourceTier" options={contributorTiers} value={v("sourceTier")} />
            </Field>
            <Field label="Reward (% of collected brokerage)">
              <input name="rewardRate" type="number" min={0} max={100} step="any" defaultValue={v("rewardRate") ?? "0"} />
            </Field>
            <Field label="Payout" hint="Approved only after brokerage is collected" full>
              <Select name="payoutStatus" options={payoutStatuses} value={v("payoutStatus")} />
            </Field>
          </>
        )}

        {kind === "opportunity" && (
          <>
            <Field label="Name *" full>
              <input name="name" defaultValue={v("name")} required maxLength={160} />
            </Field>
            <Field label="Demand behind it" full>
              <select name="requirementId" defaultValue={v("requirementId")} required>
                {requirements.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name} · {q.district}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Site or land" full>
              <select name="propertyId" defaultValue={v("propertyId") ?? ""}>
                <option value="">Not chosen yet</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.type} · {p.district}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Stage">
              <Select name="stage" options={opportunityStages} value={v("stage")} />
            </Field>
            <Field label="Assigned to">
              <input name="assignee" defaultValue={v("assignee")} maxLength={160} />
            </Field>
            <Field label="Next action">
              <input name="nextAction" defaultValue={v("nextAction")} maxLength={160} />
            </Field>
            <Field label="Next follow-up">
              <input name="followup" type="date" defaultValue={v("followup")} />
            </Field>
            <Field label="Notes" full>
              <textarea name="notes" defaultValue={v("notes")} maxLength={4000} rows={3} />
            </Field>
          </>
        )}

        {kind === "fee" && (
          <>
            <Field label="Scope *" full>
              <input name="name" defaultValue={v("name")} required maxLength={160} placeholder="e.g. Feasibility study" />
            </Field>
            <Field label="Revenue stream">
              <Select name="stream" options={revenueStreams} value={v("stream")} />
            </Field>
            <Field label="Payer *">
              <input name="payer" defaultValue={v("payer")} required maxLength={160} />
            </Field>
            <Field label="Recorded against">
              <select name="linkKind" value={linkKind} onChange={(e) => setLinkKind(e.target.value)}>
                <option value="">Nothing (stand-alone)</option>
                <option value="deal">A deal</option>
                <option value="opportunity">An opportunity</option>
              </select>
            </Field>
            {linkKind ? (
              <Field label={linkKind === "deal" ? "Deal" : "Opportunity"}>
                <select name="linkId" defaultValue={v("linkId")} required>
                  {(linkKind === "deal" ? deals : opportunities).map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <span />
            )}
            <Field label="Milestone or trigger">
              <input name="trigger" defaultValue={v("trigger")} maxLength={160} />
            </Field>
            <Field label="Status">
              <Select name="status" options={feeStatuses} value={v("status")} />
            </Field>
            <Field label="Amount (₹, excl. GST) *">
              <input name="amount" type="number" min={0} step="any" defaultValue={v("amount") ?? "0"} required />
            </Field>
            <Field label="Invoice number">
              <input name="invoice" defaultValue={v("invoice")} maxLength={160} />
            </Field>
            <Field label="Money received on">
              <input name="collectedOn" type="date" defaultValue={v("collectedOn")} />
            </Field>
            <Check name="agreement" checked={Boolean(r.agreement)}>
              Covered by a signed written agreement
            </Check>
            <Check name="disclosed" checked={Boolean(r.disclosed)}>
              Scope, payer, milestone, conflicts and any other fees on this project are disclosed to all parties
            </Check>
          </>
        )}
        {error && (
          <p role="alert" className="error am-full">
            {error}
          </p>
        )}
        <button className="hw-primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : record ? "Save changes" : kind === "property" ? "List this property" : kind === "requirement" ? "Post this requirement" : "Save"} <ArrowRight size={16} />
        </button>
      </form>
    </>
  );
}
