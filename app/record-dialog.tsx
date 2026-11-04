"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
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
  staff: boolean;
  properties: Property[];
  requirements: Requirement[];
  deals: Deal[];
  opportunities: Opportunity[];
  initial?: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
};

const titles: Record<Kind, string> = {
  property: "asset",
  requirement: "demand",
  deal: "deal",
  opportunity: "opportunity",
  fee: "fee",
};
const numberFields = new Set(["area", "price", "parking", "months", "minArea", "maxArea", "budget", "value", "rewardRate", "amount"]);
const checkFields = ["consent", "mandateSigned", "optIn", "agreement", "disclosed"];
// Statuses an owner or contributor may set; the rest follow a mandate or the team's review.
const selfStatuses = ["Mapped", "Owner confirmed", "Withdrawn"];

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`field ${wide ? "field-wide" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
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
    <label className="check field-wide">
      <input name={name} type="checkbox" defaultChecked={checked} />
      <span>{children}</span>
    </label>
  );
}

export default function RecordDialog({ kind, record, staff, properties, requirements, deals, opportunities, initial, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const r = (record ?? initial ?? {}) as Record<string, unknown>;
  const [transaction, setTransaction] = useState(String(r.transaction ?? "Lease"));
  const [linkKind, setLinkKind] = useState(String(r.linkKind ?? ""));
  const monthly = transaction === "Lease" || transaction === "Rent";

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data: Record<string, unknown> = {};
    new FormData(e.currentTarget).forEach((v, k) => {
      data[k] = numberFields.has(k) ? Number(v || 0) : v;
    });
    for (const k of checkFields) if (e.currentTarget.elements.namedItem(k)) data[k] = data[k] === "on";
    // Fields this person cannot change are sent back unchanged.
    if (!staff && kind === "property") data.verification = r.verification ?? "Not checked";
    if (!staff && kind === "requirement") data.status = r.status ?? "Draft";
    try {
      await onSave(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save");
      setBusy(false);
    }
  }

  const v = (k: string) => (r[k] === undefined ? undefined : String(r[k]));
  const status = v("status") ?? "Mapped";
  const statusOptions = staff ? propertyStatuses : selfStatuses.includes(status) ? selfStatuses : [status, ...selfStatuses];

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="dialog-title">
      <form onSubmit={submit} noValidate={false}>
        <div className="dialog-head">
          <h2 id="dialog-title">
            {record ? "Edit" : "Add"} {titles[kind]}
          </h2>
          <button type="button" className="icon-button" aria-label="Close" onClick={() => ref.current?.close()}>
            <X size={20} />
          </button>
        </div>
        <div className="dialog-body">
          {kind === "property" && (
            <>
              <fieldset>
                <legend>Asset</legend>
                <Field label="Property name" wide>
                  <input name="name" defaultValue={v("name")} required maxLength={160} autoFocus placeholder="e.g. Bypass Commerce Centre" />
                </Field>
                <Field label="District">
                  <Select name="district" options={districts} value={v("district") ?? "Kozhikode"} />
                </Field>
                <Field label="Locality" hint="Optional">
                  <input name="locality" defaultValue={v("locality")} maxLength={160} placeholder="e.g. Thondayad bypass" />
                </Field>
                <Field label="Type">
                  <Select name="type" options={propertyTypes} value={v("type")} />
                </Field>
                <Field label="Deal type">
                  <select name="transaction" value={transaction} onChange={(e) => setTransaction(e.target.value)}>
                    {transactions.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </Field>
              </fieldset>
              <fieldset>
                <legend>Size and price</legend>
                <Field label="Area (sq.ft)">
                  <input name="area" type="number" min={1} step="any" inputMode="numeric" defaultValue={v("area")} required />
                </Field>
                <Field label={monthly ? "Rent per month (₹)" : "Price (₹)"} hint="Enter 0 if not confirmed">
                  <input name="price" type="number" min={0} step="any" inputMode="numeric" defaultValue={v("price") ?? "0"} required />
                </Field>
                <Field label="Parking spaces">
                  <input name="parking" type="number" min={0} step={1} inputMode="numeric" defaultValue={v("parking") ?? "0"} required />
                </Field>
                <Field label="Months until ready" hint="0 if ready now">
                  <input name="months" type="number" min={0} step={1} inputMode="numeric" defaultValue={v("months") ?? "0"} required />
                </Field>
              </fieldset>
              <fieldset>
                <legend>Status and permission</legend>
                <Field label="Construction">
                  <Select name="construction" options={constructionStages} value={v("construction") ?? "Completed"} />
                </Field>
                <Field label="Status" hint={staff ? undefined : "Mandated and later stages are set by the AssetMeet team once a mandate is signed."}>
                  <Select name="status" options={statusOptions} value={status} />
                </Field>
                {staff && (
                  <Field label="Document verification" hint="Title, permits, zoning and project registration, checked independently.">
                    <Select name="verification" options={verificationLevels} value={v("verification") ?? "Not checked"} />
                  </Field>
                )}
                <Field label="Who can see it" hint="Members see it anonymised: never the owner's name or contact.">
                  <Select name="visibility" options={visibilities} value={v("visibility") ?? "Private"} />
                </Field>
                <Check name="consent" checked={Boolean(r.consent)}>
                  The owner has given permission to market this property
                </Check>
              </fieldset>
              <fieldset>
                <legend>Owner and source</legend>
                <Field label="Recorded by" hint="Who brought this property in. Used for source attribution.">
                  <input name="source" defaultValue={v("source")} required maxLength={160} />
                </Field>
                <Field label="Owner contact" hint="Private. Shared with a business only after a mandate is signed.">
                  <input name="ownerContact" defaultValue={v("ownerContact")} maxLength={160} placeholder="Name and phone" />
                </Field>
              </fieldset>
            </>
          )}

          {kind === "requirement" && (
            <>
              <fieldset>
                <legend>What you need</legend>
                <Field label="What is the space for?" wide>
                  <input name="name" defaultValue={v("name")} required maxLength={160} autoFocus placeholder="e.g. Supermarket expansion" />
                </Field>
                <Field label="District">
                  <Select name="district" options={districts} value={v("district") ?? "Kozhikode"} />
                </Field>
                <Field label="Type">
                  <Select name="type" options={propertyTypes} value={v("type")} />
                </Field>
                <Field label="Deal type">
                  <select name="transaction" value={transaction} onChange={(e) => setTransaction(e.target.value)}>
                    {transactions.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </Field>
                {staff && (
                  <Field label="Demand status" hint="Qualified means budget, intent and timeframe are confirmed.">
                    <Select name="status" options={requirementStatuses} value={v("status") ?? "Draft"} />
                  </Field>
                )}
              </fieldset>
              <fieldset>
                <legend>Size, budget and timing</legend>
                <Field label="Minimum area (sq.ft)">
                  <input name="minArea" type="number" min={1} step="any" inputMode="numeric" defaultValue={v("minArea")} required />
                </Field>
                <Field label="Maximum area (sq.ft)">
                  <input name="maxArea" type="number" min={1} step="any" inputMode="numeric" defaultValue={v("maxArea")} required />
                </Field>
                <Field label={monthly ? "Budget per month (₹)" : "Budget (₹)"}>
                  <input name="budget" type="number" min={1} step="any" inputMode="numeric" defaultValue={v("budget")} required />
                </Field>
                <Field label="Parking spaces needed">
                  <input name="parking" type="number" min={0} step={1} inputMode="numeric" defaultValue={v("parking") ?? "0"} required />
                </Field>
                <Field label="Needed within (months)">
                  <input name="months" type="number" min={0} step={1} inputMode="numeric" defaultValue={v("months") ?? "6"} required />
                </Field>
              </fieldset>
            </>
          )}

          {kind === "deal" && (
            <>
              <fieldset>
                <legend>Opportunity</legend>
                <Field label="Deal name" wide>
                  <input name="name" defaultValue={v("name")} required maxLength={160} autoFocus />
                </Field>
                <Field label="Asset" wide>
                  <select name="propertyId" defaultValue={v("propertyId")} required>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.district}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Demand" wide>
                  <select name="requirementId" defaultValue={v("requirementId")} required>
                    {requirements.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.name} · {q.district}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Stage" hint="From Mandate signed on, the owner's permission and a signed mandate are required.">
                  <Select name="stage" options={dealStages} value={v("stage") ?? "Flagged"} />
                </Field>
                <Field label="Deal value (₹)" hint="Sale consideration or monthly rent. Pipeline only, never revenue.">
                  <input name="value" type="number" min={0} step="any" inputMode="numeric" defaultValue={v("value") ?? "0"} />
                </Field>
              </fieldset>
              <fieldset>
                <legend>Pre-deal records</legend>
                <Field label="Lead source">
                  <input name="leadSource" defaultValue={v("leadSource")} maxLength={160} placeholder="e.g. Contributor record, member request" />
                </Field>
                <Field label="Mandate from">
                  <Select name="mandateParty" options={mandateParties} value={v("mandateParty")} />
                </Field>
                <Field label="Exclusivity term">
                  <input name="exclusivity" defaultValue={v("exclusivity")} maxLength={160} placeholder="e.g. Exclusive for 90 days" />
                </Field>
                <Field label="Brokerage trigger">
                  <input name="trigger" defaultValue={v("trigger")} maxLength={160} placeholder="e.g. One month's rent on lease execution" />
                </Field>
                <Check name="mandateSigned" checked={Boolean(r.mandateSigned)}>
                  A written mandate is signed (brokerage, payer and trigger agreed in writing)
                </Check>
                <Check name="optIn" checked={Boolean(r.optIn)}>
                  The client has opted in to brokerage representation by AssetMeet
                </Check>
              </fieldset>
              <fieldset>
                <legend>Owner and next action</legend>
                <Field label="Assigned to">
                  <input name="assignee" defaultValue={v("assignee")} maxLength={160} placeholder="e.g. Relationship manager" />
                </Field>
                <Field label="Next follow-up">
                  <input name="followup" type="date" defaultValue={v("followup")} />
                </Field>
                <Field label="Next action" wide>
                  <input name="nextAction" defaultValue={v("nextAction")} maxLength={160} />
                </Field>
                <Field label="Execution notes" hint="Site visit evidence, offers, term sheets, due diligence, agreement and payment schedule." wide>
                  <textarea name="notes" defaultValue={v("notes")} maxLength={4000} rows={4} />
                </Field>
              </fieldset>
              <fieldset>
                <legend>Contributor reward</legend>
                <Field label="Contribution" hint="A basic data record does not earn a deal reward by itself.">
                  <Select name="sourceTier" options={contributorTiers} value={v("sourceTier")} />
                </Field>
                <Field label="Reward (% of collected brokerage)">
                  <input name="rewardRate" type="number" min={0} max={100} step="any" defaultValue={v("rewardRate") ?? "0"} />
                </Field>
                <Field label="Payout" hint="Approved only after the brokerage is collected and reviewed by the deal manager and finance.">
                  <Select name="payoutStatus" options={payoutStatuses} value={v("payoutStatus")} />
                </Field>
              </fieldset>
            </>
          )}

          {kind === "opportunity" && (
            <fieldset>
              <legend>Development opportunity</legend>
              <Field label="Name" wide>
                <input name="name" defaultValue={v("name")} required maxLength={160} autoFocus />
              </Field>
              <Field label="Demand behind it" wide>
                <select name="requirementId" defaultValue={v("requirementId")} required>
                  {requirements.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name} · {q.district}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Site or land" hint="Optional. Owner-authorised land or an expandable building." wide>
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
              <Field label="Notes" hint="A development lead is not a constructed project or a tenant commitment." wide>
                <textarea name="notes" defaultValue={v("notes")} maxLength={4000} rows={4} />
              </Field>
            </fieldset>
          )}

          {kind === "fee" && (
            <>
              <fieldset>
                <legend>Fee</legend>
                <Field label="Scope" wide>
                  <input name="name" defaultValue={v("name")} required maxLength={160} autoFocus placeholder="e.g. Feasibility study" />
                </Field>
                <Field label="Revenue stream">
                  <Select name="stream" options={revenueStreams} value={v("stream")} />
                </Field>
                <Field label="Payer">
                  <input name="payer" defaultValue={v("payer")} required maxLength={160} placeholder="e.g. Client, owner" />
                </Field>
                <Field label="Recorded against">
                  <select name="linkKind" value={linkKind} onChange={(e) => setLinkKind(e.target.value)}>
                    <option value="">Nothing (stand-alone)</option>
                    <option value="deal">A deal</option>
                    <option value="opportunity">An opportunity</option>
                  </select>
                </Field>
                {linkKind && (
                  <Field label={linkKind === "deal" ? "Deal" : "Opportunity"}>
                    <select name="linkId" defaultValue={v("linkId")} required>
                      {(linkKind === "deal" ? deals : opportunities).map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label="Milestone or trigger">
                  <input name="trigger" defaultValue={v("trigger")} maxLength={160} placeholder="e.g. Lease execution" />
                </Field>
              </fieldset>
              <fieldset>
                <legend>Recognition and cash</legend>
                <Field label="Status" hint="Pipeline is not revenue. Only collected money counts as received.">
                  <Select name="status" options={feeStatuses} value={v("status")} />
                </Field>
                <Field label="Amount (₹)" hint="Excluding GST">
                  <input name="amount" type="number" min={0} step="any" inputMode="numeric" defaultValue={v("amount") ?? "0"} required />
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
                  Scope, payer, milestone, conflicts of interest and any other fees on this project are disclosed to all parties
                </Check>
              </fieldset>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="dialog-foot">
          <button type="button" className="btn btn-secondary" onClick={() => ref.current?.close()}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : `Save ${titles[kind]}`}
          </button>
        </div>
      </form>
    </dialog>
  );
}
