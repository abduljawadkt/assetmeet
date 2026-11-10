"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Check, Pause, Play, Search, ShieldCheck } from "lucide-react";
import { AssetWordmark } from "./brand";
import { api } from "../lib/api";
import { authClient } from "../lib/auth-client";

export type Engine = "property" | "requirement";

export function EngineGuide({ engine }: { engine: Engine }) {
  const [pause, setPause] = useState(false);
  const steps =
    engine === "property"
      ? [
          ["01", "Capture the asset", "Add a building, plot or space—even if market availability is not yet confirmed."],
          ["02", "Keep its story connected", "Record technical details, contributor credit and owner permission."],
          ["03", "Create a possibility", "Requirements can reveal a fit. People verify the opportunity before a transaction."],
        ]
      : [
          ["01", "Describe what you need", "Choose your location, area, use, budget and possession timeline."],
          ["02", "Make the fit visible", "Structured requirements help compare compatible properties."],
          ["03", "Move forward with verification", "A potential match needs owner confirmation and review before a site visit."],
        ];
  return (
    <section className={`engine-guide ${pause ? "guide-paused" : ""}`}>
      <div className="guide-top">
        <span>SEE THE POSSIBILITY</span>
        <button onClick={() => setPause(!pause)} aria-label={pause ? "Play educational animation" : "Pause educational animation"}>
          {pause ? <Play size={14} /> : <Pause size={14} />}
        </button>
      </div>
      <div className="opportunity-scene" aria-label="Illustration: property information connects with requirements to create a reviewed opportunity">
        <div className="scene-orbit" />
        <div className="scene-building">
          <div className="building-roof" />
          <div className="building-front">
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <div className="building-side" />
        </div>
        <div className="scene-demand">
          <Search size={19} />
          <b>Space needed</b>
          <small>Location · Area · Budget</small>
          <span />
          <span />
        </div>
        <div className="scene-connection">
          <i />
          <i />
          <i />
        </div>
        <div className="scene-match">
          <Check size={15} />
          Potential match
        </div>
        <span className="scene-caption">Illustrative workflow · Not an actual match</span>
      </div>
      <h3>{engine === "property" ? "Your next building could be someone’s next opportunity." : "The right space starts with the right brief."}</h3>
      <div className="guide-steps">
        {steps.map(([n, t, d]) => (
          <div key={n}>
            <span>{n}</span>
            <section>
              <b>{t}</b>
              <p>{d}</p>
            </section>
          </div>
        ))}
      </div>
      <div className="guide-truth">
        <ShieldCheck size={16} />
        <span>Private information stays private. A match is a starting point, not a verified deal.</span>
      </div>
    </section>
  );
}

// Roles shown to people, mapped to the account roles the backend knows.
const roleMap: Record<string, "Owner" | "Contributor" | "Business"> = {
  Owner: "Owner",
  Engineer: "Contributor",
  Builder: "Contributor",
  Buyer: "Business",
  Tenant: "Business",
  Business: "Business",
};

export default function EngineEntry({
  initial,
  authenticated,
  name,
  signinFailed,
  onReady,
}: {
  initial: Engine;
  authenticated: boolean;
  name?: string;
  signinFailed: boolean;
  onReady: () => Promise<void>;
}) {
  const [engine, setEngine] = useState<Engine>(initial);
  const [role, setRole] = useState(initial === "property" ? "Owner" : "Business");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(signinFailed ? "That sign-in link has expired or was already used. Request a new one." : "");
  const [sentTo, setSentTo] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const professional = role === "Engineer" || role === "Builder";
  const back = `/?view=app&engine=${engine}`;

  function change(e: Engine) {
    setEngine(e);
    setRole(e === "property" ? "Owner" : "Business");
    setError("");
  }

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    if (usePassword) {
      const { error: err } = await authClient.signIn.email({ email, password: String(form.get("password")) });
      if (err) {
        setBusy(false);
        setError(err.status === 401 ? "That email and password don't match." : err.message || "Sign-in failed. Try again.");
      } else window.location.assign(back);
      return;
    }
    const { error: err } = await authClient.signIn.magicLink({ email, callbackURL: back, errorCallbackURL: "/?view=app&signin=failed" });
    setBusy(false);
    if (err) setError(err.message || "We couldn't send the sign-in email. Try again.");
    else setSentTo(email);
  }

  async function createProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api.saveProfile({ ...data, role: roleMap[role] });
      await onReady();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your workspace");
      setBusy(false);
    }
  }

  return (
    <main className="engine-entry">
      <header>
        <Link href="/" aria-label="Back to AssetMeet home">
          <AssetWordmark />
        </Link>
        <span>YOUR NEXT CONNECTION STARTS HERE</span>
      </header>
      <div className="entry-columns">
        <section className="entry-form-panel">
          <div className="engine-selector">
            <button className={engine === "property" ? "selected" : ""} onClick={() => change("property")}>
              <Building2 size={18} />I have a property
            </button>
            <button className={engine === "requirement" ? "selected" : ""} onClick={() => change("requirement")}>
              <Search size={18} />I need a property
            </button>
          </div>
          <div className="entry-tagline">
            <span>Every building is an asset.</span>
            <span>Every requirement is an opportunity.</span>
            <span>Every verified match is a potential transaction.</span>
          </div>
          <h1>{engine === "property" ? "Start with your property." : "Tell us what you need."}</h1>
          <p>
            {engine === "property"
              ? "For owners, engineers and builders. One workspace for your properties, requirements and introductions."
              : "For buyers, tenants and businesses. One workspace to post requirements and list your own properties."}
          </p>
          {error && (
            <div className="notice" role="alert">
              {error}
            </div>
          )}
          {!authenticated ? (
            sentTo ? (
              <div className="engine-login">
                <span className="entry-lock">
                  <ShieldCheck size={22} />
                </span>
                <h3>Check your email</h3>
                <p>
                  We sent a sign-in link to <b>{sentTo}</b>. Open it on this device to continue. The link works once and
                  expires after an hour.
                </p>
                <button className="quick-entry" type="button" onClick={() => setSentTo("")}>
                  Use a different email
                </button>
              </div>
            ) : (
              <form className="engine-login" onSubmit={signIn}>
                <span className="entry-lock">
                  <ShieldCheck size={22} />
                </span>
                <h3>{engine === "property" ? "List your property" : "Post your requirement"}</h3>
                <p>
                  Sign in with your email. We send a one-time link, so there is no password to remember. You can list
                  properties and post requirements with one account.
                </p>
                <div className="form-grid">
                  <label className="full">
                    Work email *
                    <input name="email" type="email" required autoComplete={usePassword ? "username" : "email"} inputMode="email" placeholder="you@company.com" />
                  </label>
                  {usePassword && (
                    <label className="full">
                      Password *
                      <input name="password" type="password" required autoComplete="current-password" />
                    </label>
                  )}
                </div>
                <button className="landing-primary full" disabled={busy}>
                  {usePassword ? (busy ? "Signing in…" : "Sign in") : busy ? "Sending link…" : "Email me a sign-in link"} <ArrowRight size={17} />
                </button>
                <button
                  className="quick-entry"
                  type="button"
                  onClick={() => {
                    setUsePassword(!usePassword);
                    setError("");
                  }}
                >
                  {usePassword ? "Email me a sign-in link instead" : "Sign in with a password instead"}
                </button>
                <Link className="quick-entry" href="/?view=app&demo=1">
                  Or explore with sample data
                </Link>
                <small>Your records are private to your account. Sample data is fictional and nothing there is saved.</small>
              </form>
            )
          ) : (
            <form onSubmit={createProfile} key={engine}>
              <p className="demo-customise-label">Set up your workspace{name && !name.includes("@") ? `, ${name.split(" ")[0]}` : ""}. Choose what describes you.</p>
              <div className="role-options">
                {(engine === "property" ? ["Owner", "Engineer", "Builder"] : ["Buyer", "Tenant", "Business"]).map((r) => (
                  <button type="button" className={role === r ? "selected" : ""} onClick={() => setRole(r)} key={r} aria-pressed={role === r}>
                    {r}
                  </button>
                ))}
              </div>
              <div className="form-grid">
                <label>
                  Your name *
                  <input name="name" required minLength={2} maxLength={100} autoComplete="name" defaultValue={name && !name.includes("@") ? name : ""} />
                </label>
                <label>
                  Phone
                  <input name="phone" type="tel" maxLength={30} autoComplete="tel" />
                </label>
                <label className="full">
                  {roleMap[role] === "Business" ? (role === "Business" ? "Company *" : "Organisation, or your name if you are an individual *") : "Organisation (optional)"}
                  <input name="organisation" required={roleMap[role] === "Business"} maxLength={160} autoComplete="organization" />
                </label>
                {professional && (
                  <>
                    <label>
                      Licence / registration number
                      <input name="licenseNumber" maxLength={100} />
                    </label>
                    <label>
                      Issuing authority
                      <input name="licenseAuthority" maxLength={160} />
                    </label>
                    <p className="full licence-note">Optional. Recorded as submitted and not verified until the AssetMeet team checks it.</p>
                  </>
                )}
              </div>
              <button className="landing-primary full" disabled={busy}>
                {busy ? "Creating workspace…" : "Create my workspace"}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
        </section>
        <EngineGuide engine={engine} />
      </div>
    </main>
  );
}
