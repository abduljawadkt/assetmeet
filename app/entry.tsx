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

export type AuthOptions = { google: boolean; email: boolean; resetToken?: string; error?: string };

const authErrors: Record<string, string> = {
  account_not_linked: "This email already has an AssetMeet password. Sign in with your password instead.",
  INVALID_TOKEN: "That password reset link has expired or was already used. Request a new one.",
  access_denied: "Google sign-in was cancelled.",
};

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function EngineEntry({
  initial,
  authenticated,
  name,
  auth,
  onReady,
}: {
  initial: Engine;
  authenticated: boolean;
  name?: string;
  auth: AuthOptions;
  onReady: () => Promise<void>;
}) {
  const [engine, setEngine] = useState<Engine>(initial);
  const [role, setRole] = useState(initial === "property" ? "Owner" : "Business");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(auth.error ? (authErrors[auth.error] ?? "Sign-in didn't complete. Try again.") : "");
  const [mode, setMode] = useState<"signup" | "signin" | "forgot" | "reset">(auth.resetToken ? "reset" : auth.error === "account_not_linked" ? "signin" : "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const professional = role === "Engineer" || role === "Builder";
  const back = `/?view=app&engine=${engine}`;

  function change(e: Engine) {
    setEngine(e);
    setRole(e === "property" ? "Owner" : "Business");
    setError("");
  }

  function switchMode(next: typeof mode) {
    setMode(next);
    setError("");
    setSentTo("");
  }

  async function submitAuth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    let err: { message?: string; code?: string; status?: number } | null = null;
    if (mode === "signup") {
      ({ error: err } = await authClient.signUp.email({ name: String(form.get("name")).trim(), email, password }));
      if (err?.code === "USER_ALREADY_EXISTS" || err?.status === 422) err = { message: "An account with this email already exists. Sign in instead." };
    } else if (mode === "signin") {
      ({ error: err } = await authClient.signIn.email({ email, password }));
      if (err?.status === 401) err = { message: "That email and password don't match." };
    } else if (mode === "forgot") {
      ({ error: err } = await authClient.requestPasswordReset({ email, redirectTo: `/?view=app&engine=${engine}` }));
      if (!err) {
        setBusy(false);
        setSentTo(email);
        return;
      }
    } else {
      if (password !== String(form.get("confirm"))) err = { message: "The two passwords don't match." };
      else ({ error: err } = await authClient.resetPassword({ newPassword: password, token: auth.resetToken ?? "" }));
      if (!err) {
        setBusy(false);
        history.replaceState(null, "", back);
        switchMode("signin");
        setSentTo("reset");
        return;
      }
    }
    if (err) {
      setBusy(false);
      setError(err.message || "Something went wrong. Try again.");
      return;
    }
    // Signed in: load the session. New accounts continue to the profile step on this screen.
    try {
      await onReady();
    } catch {
      setError("You are signed in, but your workspace didn't load. Refresh the page.");
    }
    setBusy(false);
  }

  async function google() {
    setError("");
    const { error: err } = await authClient.signIn.social({ provider: "google", callbackURL: back, errorCallbackURL: back });
    if (err) setError(err.message || "Google sign-in isn't available right now.");
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
            <form className="engine-login" onSubmit={submitAuth} key={mode}>
              <span className="entry-lock">
                <ShieldCheck size={22} />
              </span>
              <h3>
                {mode === "signup"
                  ? "Create your account"
                  : mode === "signin"
                    ? "Welcome back"
                    : mode === "forgot"
                      ? "Reset your password"
                      : "Choose a new password"}
              </h3>
              <p>
                {mode === "signup"
                  ? "Your email is your user ID. One account lists properties and posts requirements."
                  : mode === "signin"
                    ? "Sign in with your email and password."
                    : mode === "forgot"
                      ? auth.email
                        ? "Enter your email and we will send you a link to choose a new password."
                        : "Password reset by email is not switched on yet. Contact the AssetMeet team and they will help you back in."
                      : "Enter a new password for your account."}
              </p>
              {sentTo && (
                <div className="notice" role="status">
                  {sentTo === "reset" ? "Your password is changed. Sign in with the new one." : `If ${sentTo} has an account, a reset link is on its way. It works once and expires in an hour.`}
                </div>
              )}
              {auth.google && (mode === "signup" || mode === "signin") && (
                <>
                  <button type="button" className="am-google" onClick={google}>
                    <GoogleMark />
                    Continue with Google
                  </button>
                  <div className="am-or" aria-hidden="true">
                    <span>or</span>
                  </div>
                </>
              )}
              {!(mode === "forgot" && !auth.email) && (
                <div className="form-grid">
                  {mode === "signup" && (
                    <label className="full">
                      Your name *
                      <input name="name" required minLength={2} maxLength={100} autoComplete="name" />
                    </label>
                  )}
                  {mode !== "reset" && (
                    <label className="full">
                      Email (your user ID) *
                      <input name="email" type="email" required autoComplete={mode === "signup" ? "email" : "username"} inputMode="email" placeholder="you@company.com" />
                    </label>
                  )}
                  {mode !== "forgot" && (
                    <label className="full">
                      {mode === "reset" ? "New password *" : "Password *"}
                      <span className="am-password">
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={mode === "signin" ? 1 : 8}
                          maxLength={128}
                          autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </span>
                      {mode !== "signin" && <small className="am-hint">At least 8 characters</small>}
                    </label>
                  )}
                  {mode === "reset" && (
                    <label className="full">
                      Confirm new password *
                      <input name="confirm" type={showPassword ? "text" : "password"} required minLength={8} maxLength={128} autoComplete="new-password" />
                    </label>
                  )}
                </div>
              )}
              {!(mode === "forgot" && !auth.email) && (
                <button className="landing-primary full" disabled={busy}>
                  {busy
                    ? "Please wait…"
                    : mode === "signup"
                      ? "Create account"
                      : mode === "signin"
                        ? "Sign in"
                        : mode === "forgot"
                          ? "Send reset link"
                          : "Save new password"}{" "}
                  <ArrowRight size={17} />
                </button>
              )}
              <div className="am-auth-links">
                {mode === "signup" && (
                  <button type="button" onClick={() => switchMode("signin")}>
                    Already have an account? <b>Sign in</b>
                  </button>
                )}
                {mode === "signin" && (
                  <>
                    <button type="button" onClick={() => switchMode("signup")}>
                      New to AssetMeet? <b>Create an account</b>
                    </button>
                    <button type="button" onClick={() => switchMode("forgot")}>
                      Forgot password?
                    </button>
                  </>
                )}
                {(mode === "forgot" || mode === "reset") && (
                  <button type="button" onClick={() => switchMode("signin")}>
                    Back to <b>sign in</b>
                  </button>
                )}
              </div>
              <Link className="quick-entry" href="/?view=app&demo=1">
                Or explore with sample data
              </Link>
              <small>Your records are private to your account. Sample data is fictional and nothing there is saved.</small>
            </form>
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
