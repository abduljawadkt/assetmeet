"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  constructionStages,
  dealStages,
  districts,
  marketStatuses,
  propertyTypes,
  transactions,
  verificationLevels,
  type Deal,
  type Kind,
  type Property,
  type Requirement,
} from "../lib/records";

type Props = {
  kind: Kind;
  record?: Property | Requirement | Deal;
  properties: Property[];
  requirements: Requirement[];
  initial?: Partial<Deal>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
};

const titles = { property: "property", requirement: "requirement", deal: "deal" };
const numberFields = new Set(["area", "price", "parking", "months", "minArea", "maxArea", "budget", "collected", "rewardRate"]);

function Field({
  label,
  hint,
  wide,
  children,
}: {
  label: string;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
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

export default function RecordDialog({ kind, record, properties, requirements, initial, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const r = (record ?? initial ?? {}) as Record<string, unknown>;
  const [transaction, setTransaction] = useState(String(r.transaction ?? "Lease"));
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
    if (kind === "property") data.consent = data.consent === "on";
    try {
      await onSave(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save");
      setBusy(false);
    }
  }

  const v = (k: string) => (r[k] === undefined ? undefined : String(r[k]));

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
                <legend>Property</legend>
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
                <legend>Status</legend>
                <Field label="Construction">
                  <Select name="construction" options={constructionStages} value={v("construction") ?? "Completed"} />
                </Field>
                <Field label="Availability">
                  <Select name="market" options={marketStatuses} value={v("market")} />
                </Field>
                <Field label="Verification">
                  <Select name="verification" options={verificationLevels} value={v("verification")} />
                </Field>
                <label className="check field-wide">
                  <input name="consent" type="checkbox" defaultChecked={Boolean(r.consent)} />
                  <span>The owner has given permission to market this property</span>
                </label>
              </fieldset>
              <fieldset>
                <legend>Owner and source</legend>
                <Field label="Recorded by" hint="Who brought this property in. Used for contributor credit.">
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
            <fieldset>
              <legend>Opportunity</legend>
              <Field label="Deal name" wide>
                <input name="name" defaultValue={v("name")} required maxLength={160} autoFocus />
              </Field>
              <Field label="Property" wide>
                <select name="propertyId" defaultValue={v("propertyId")} required>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.district}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Requirement" wide>
                <select name="requirementId" defaultValue={v("requirementId")} required>
                  {requirements.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name} · {q.district}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Stage" hint="Past owner outreach needs the owner's permission on the property.">
                <Select name="stage" options={dealStages} value={v("stage")} />
              </Field>
              <Field label="Next follow-up">
                <input name="followup" type="date" defaultValue={v("followup")} />
              </Field>
              <Field label="Fee collected (₹)" hint="Enter once the fee is actually received">
                <input name="collected" type="number" min={0} step="any" inputMode="numeric" defaultValue={v("collected") ?? "0"} />
              </Field>
              <Field label="Contributor reward (%)">
                <input name="rewardRate" type="number" min={0} max={100} step="any" defaultValue={v("rewardRate") ?? "0"} />
              </Field>
            </fieldset>
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
