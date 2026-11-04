"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  CreditCard,
  Handshake,
  IndianRupee,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Network,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { MatchRow, Pill, Reasons, Score, StatusPill, VerificationPill, Wordmark } from "./brand";
import RecordDialog from "./record-dialog";
import { PlanCards } from "./plan-cards";
import { api, type Member, type Row, type Session } from "../lib/api";
import { authClient } from "../lib/auth-client";
import { demoDeals, demoFees, demoMembers, demoOpportunities, demoProperties, demoRequirements } from "../lib/demo";
import { inr, inrShort, months, priceLabel, sqft } from "../lib/format";
import { match } from "../lib/matching";
import { site } from "../lib/site-content";
import {
  dealStages,
  districts,
  feeStatuses,
  opportunityStages,
  planNames,
  revenueStreams,
  roles,
  type Deal,
  type Fee,
  type Kind,
  type Opportunity,
  type PlanName,
  type Property,
  type Requirement,
  type Role,
} from "../lib/records";
import {
  brokerageStreams,
  contactReleased,
  deskSignals,
  effectivePlan,
  isActiveProperty,
  plans,
  qualifiedRequirementStatuses,
  rewardFor,
  type Quota,
} from "../lib/rules";

type Tab =
  | "overview"
  | "assets"
  | "demands"
  | "matches"
  | "deals"
  | "opportunities"
  | "revenue"
  | "members"
  | "shortlists"
  | "interest"
  | "plan";
type DialogState = { kind: Kind; record?: Row; initial?: Record<string, unknown> } | null;

const tabInfo: Record<Tab, { label: string; short?: string; icon: typeof Building2 }> = {
  overview: { label: "Overview", icon: LayoutDashboard },
  assets: { label: "Asset Bank", short: "Assets", icon: Building2 },
  demands: { label: "Demand Bank", short: "Demand", icon: ClipboardList },
  matches: { label: "Match Engine", short: "Matches", icon: Network },
  deals: { label: "Deal Desk", short: "Deals", icon: Handshake },
  opportunities: { label: "Opportunity Bank", short: "Projects", icon: Lightbulb },
  revenue: { label: "Revenue", icon: IndianRupee },
  members: { label: "Members", icon: UserCog },
  shortlists: { label: "Shortlists", icon: Search },
  interest: { label: "Interest", icon: Users },
  plan: { label: "Plan", icon: CreditCard },
};

const tabsFor: Record<Role, Tab[]> = {
  Staff: ["overview", "assets", "demands", "matches", "deals", "opportunities", "revenue", "members"],
  Business: ["overview", "demands", "matches", "shortlists", "plan"],
  Owner: ["overview", "assets", "matches", "interest", "plan"],
  Contributor: ["overview", "assets", "matches", "interest", "plan"],
};

const roleCopy: Record<string, { title: string; text: string }> = {
  Business: { title: "Post your space requirement", text: "Add your demand to the Demand Bank. The AssetMeet team scores assets against your brief, and subscribers can run matches themselves." },
  Owner: { title: "List your property", text: "Add your building or plot to the Asset Bank, even before it is finished. You approve every introduction." },
  Contributor: { title: "Join as a contributor", text: "Record properties you know about, free. Your contribution is attributed to you from the first entry." },
};

const today = () => new Date().toISOString().slice(0, 10);

function useHash(): [string, (h: string) => void] {
  const hash = useSyncExternalStore(
    (cb) => {
      window.addEventListener("hashchange", cb);
      return () => window.removeEventListener("hashchange", cb);
    },
    () => window.location.hash.slice(1),
    () => "",
  );
  return [hash, (h) => (window.location.hash = h)];
}

const demoSession: Session = {
  authenticated: true,
  name: "Sample workspace",
  profile: { role: "Staff", name: "Sample workspace", organisation: "AssetMeet", phone: "", licenseNumber: "", licenseAuthority: "", verification: "Sample", plan: "Free", planUntil: "" },
};
const demoRows: Row[] = [...demoProperties, ...demoRequirements, ...demoDeals, ...demoOpportunities, ...demoFees];

export default function Workspace({ startRole, demo, signinFailed }: { startRole?: string; demo: boolean; signinFailed: boolean }) {
  const [session, setSession] = useState<Session | null>(demo ? demoSession : null);
  const [rows, setRows] = useState<Row[]>(demo ? demoRows : []);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (demo) return;
    api
      .session()
      .then(async (s) => {
        if (s.profile) setRows(await api.records());
        setSession(s);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [demo]);

  if (loadError)
    return (
      <Centered>
        <h1>We couldn&rsquo;t open your workspace.</h1>
        <p>{loadError}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </Centered>
    );
  if (!session)
    return (
      <Centered>
        <p className="loading" role="status">
          Opening your workspace…
        </p>
      </Centered>
    );
  if (!session.authenticated) return <SignIn role={startRole} failed={signinFailed} />;
  if (!session.profile)
    return (
      <Onboarding
        role={startRole}
        name={session.name}
        onDone={async () => {
          setSession(await api.session());
          setRows(await api.records());
        }}
      />
    );
  return (
    <Shell
      session={session}
      rows={rows}
      setRows={setRows}
      demo={demo}
      refreshSession={async () => {
        if (!demo) setSession(await api.session());
      }}
    />
  );
}

function SignOut({ demo, label }: { demo: boolean; label: string }) {
  async function leave() {
    if (!demo) await authClient.signOut();
    window.location.href = "/";
  }
  return (
    <button className="btn btn-quiet btn-sm" onClick={leave}>
      <LogOut size={16} aria-hidden="true" /> {label}
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="centered">
      <Link href="/" aria-label="AssetMeet home">
        <Wordmark />
      </Link>
      <div className="centered-body">{children}</div>
    </main>
  );
}

function SignIn({ role, failed }: { role?: string; failed: boolean }) {
  const copy = (role && roleCopy[role]) || { title: "Sign in to AssetMeet", text: "Your requirements, properties and deals in one private workspace." };
  const back = `/?view=app${role ? `&role=${role}` : ""}`;
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(failed ? "That sign-in link has expired or was already used. Request a new one." : "");
  const [usePassword, setUsePassword] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
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
    const { error: err } = await authClient.signIn.magicLink({
      email,
      callbackURL: back,
      errorCallbackURL: "/?view=app&signin=failed",
    });
    setBusy(false);
    if (err) setError(err.message || "We couldn't send the sign-in email. Try again.");
    else setSentTo(email);
  }

  if (sentTo)
    return (
      <Centered>
        <h1>Check your email</h1>
        <p>
          We sent a sign-in link to <strong>{sentTo}</strong>. Open it on this device to continue. The link works once
          and expires after an hour.
        </p>
        <button className="btn btn-quiet" onClick={() => setSentTo("")}>
          Use a different email
        </button>
      </Centered>
    );

  return (
    <Centered>
      <h1>{copy.title}</h1>
      <p>{copy.text}</p>
      <form className="stack" onSubmit={submit}>
        <label className="field">
          <span className="field-label">Work email</span>
          <input name="email" type="email" required autoComplete={usePassword ? "username" : "email"} inputMode="email" placeholder="you@company.com" />
        </label>
        {usePassword && (
          <label className="field">
            <span className="field-label">Password</span>
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {usePassword ? (busy ? "Signing in…" : "Sign in") : busy ? "Sending link…" : "Email me a sign-in link"}{" "}
          <ArrowRight size={18} />
        </button>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            setUsePassword(!usePassword);
            setError("");
          }}
        >
          {usePassword ? "Email me a sign-in link instead" : "Sign in with a password instead"}
        </button>
      </form>
      <Link className="btn btn-secondary btn-lg" href="/?view=app&demo=1">
        Explore with sample data
      </Link>
      <p className="small">
        <ShieldCheck size={16} aria-hidden="true" /> Your records are private to your account. Sample data is not saved.
      </p>
    </Centered>
  );
}

const roleOptions: Record<(typeof roles)[number], [string, string]> = {
  Business: ["I need space for my business", "Post requirements and receive shortlists"],
  Owner: ["I own or develop property", "List buildings and plots, approve introductions"],
  Contributor: ["I'm an engineer, architect or builder", "Record properties you know about, free, and earn on verified contributions"],
};

function Onboarding({
  role,
  name,
  onDone,
}: {
  role?: string;
  name?: string;
  onDone: (p: NonNullable<Session["profile"]>) => Promise<void>;
}) {
  const [chosen, setChosen] = useState<(typeof roles)[number]>(
    (roles as readonly string[]).includes(role ?? "") ? (role as (typeof roles)[number]) : "Business",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await onDone(await api.saveProfile({ ...data, role: chosen }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save");
      setBusy(false);
    }
  }
  return (
    <Centered>
      <h1>Set up your workspace</h1>
      <p>Choose what describes you. You can change this later.</p>
      <form className="onboarding" onSubmit={submit}>
        <fieldset className="role-options">
          <legend className="visually-hidden">Your role</legend>
          {roles.map((r) => (
            <label key={r} className={`role-option ${chosen === r ? "selected" : ""}`}>
              <input type="radio" name="role-choice" value={r} checked={chosen === r} onChange={() => setChosen(r)} />
              <span>
                <strong>{roleOptions[r][0]}</strong>
                <small>{roleOptions[r][1]}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Your name</span>
            <input name="name" defaultValue={name?.includes("@") ? "" : name} required minLength={2} maxLength={100} autoComplete="name" />
          </label>
          <label className="field">
            <span className="field-label">{chosen === "Business" ? "Company" : "Organisation"}</span>
            <input name="organisation" required={chosen === "Business"} maxLength={160} autoComplete="organization" />
            {chosen !== "Business" && <span className="field-hint">Optional</span>}
          </label>
          <label className="field">
            <span className="field-label">Phone</span>
            <input name="phone" type="tel" maxLength={30} autoComplete="tel" />
            <span className="field-hint">Optional. Used by the AssetMeet team to reach you.</span>
          </label>
          {chosen === "Contributor" && (
            <>
              <label className="field">
                <span className="field-label">Licence or registration number</span>
                <input name="licenseNumber" maxLength={100} />
                <span className="field-hint">Optional. Recorded as submitted, not yet verified.</span>
              </label>
              <label className="field">
                <span className="field-label">Issuing authority</span>
                <input name="licenseAuthority" maxLength={160} />
              </label>
            </>
          )}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? "Creating workspace…" : "Create my workspace"}
        </button>
      </form>
    </Centered>
  );
}

function Shell({
  session,
  rows,
  setRows,
  demo,
  refreshSession,
}: {
  session: Session;
  rows: Row[];
  setRows: (r: Row[]) => void;
  demo: boolean;
  refreshSession: () => Promise<void>;
}) {
  const profile = session.profile!;
  const role = profile.role;
  const tabs = tabsFor[role] ?? tabsFor.Business;
  const [hash, setHash] = useHash();
  const tab: Tab = (tabs as string[]).includes(hash) ? (hash as Tab) : "overview";
  const [dialog, setDialog] = useState<DialogState>(null);
  const [intro, setIntro] = useState<{ property: Property; requirement: Requirement } | null>(null);
  const [notice, setNotice] = useState("");
  const [selectedReq, setSelectedReq] = useState("");
  const staff = role === "Staff";
  const [members, setMembers] = useState<Member[]>(demo ? demoMembers : []);

  useEffect(() => {
    if (!staff || demo) return;
    api
      .members()
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [staff, demo]);

  const properties = rows.filter((r): r is Property => r.kind === "property");
  const requirements = rows.filter((r): r is Requirement => r.kind === "requirement");
  const deals = rows.filter((r): r is Deal => r.kind === "deal");
  const opportunities = rows.filter((r): r is Opportunity => r.kind === "opportunity");
  const fees = rows.filter((r): r is Fee => r.kind === "fee");
  const own = {
    properties: properties.filter((p) => !p.shared),
    requirements: requirements.filter((r) => !r.shared),
  };
  const plan = session.plan ?? "Free";
  const quota = session.quota ?? plans.Free;
  const usage = session.usage ?? { assets: 0, demands: 0, matches: 0 };

  function open(kind: Kind, record?: Row, initial?: Record<string, unknown>) {
    if (demo) {
      setNotice("Sample data is read-only. Sign in to save your own records.");
      return;
    }
    setNotice("");
    setDialog({ kind, record, initial });
  }

  async function save(data: Record<string, unknown>) {
    if (!dialog) return;
    const saved = await api.save(dialog.kind, data, dialog.record?.id);
    // Creating an opportunity also moves its demand to "Development lead".
    let next = [...rows.filter((r) => r.id !== saved.id), saved];
    if (dialog.kind === "opportunity" && !dialog.record)
      next = next.map((r) => (r.kind === "requirement" && r.id === data.requirementId ? { ...r, status: "Development lead" as const } : r));
    setRows(next);
    setDialog(null);
    setNotice(`${dialog.record ? "Saved changes to" : "Added"} ${String(data.name)}.`);
    refreshSession();
  }

  async function requestIntro(optIn: boolean) {
    if (!intro) return;
    const { property, requirement } = intro;
    const saved = await api.save("deal", {
      name: `${property.name} for ${requirement.name}`,
      propertyId: property.id,
      requirementId: requirement.id,
      stage: "Flagged",
      optIn,
    });
    setRows([...rows, { ...saved, shared: true } as Deal]);
    setIntro(null);
    setNotice("Saved. The Deal Desk will review this match and contact you before any introduction.");
    refreshSession();
  }

  async function remove(kind: Kind, row: Row & { name: string }) {
    if (demo) return setNotice("Sample data is read-only.");
    if (!window.confirm(`Delete ${row.name}? This cannot be undone.`)) return;
    try {
      await api.remove(kind, row.id);
      setRows(rows.filter((r) => r.id !== row.id));
      setNotice(`Deleted ${row.name}.`);
      refreshSession();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to delete");
    }
  }

  const ctx: ViewProps = {
    role,
    staff,
    demo,
    properties,
    requirements,
    deals,
    opportunities,
    fees,
    members,
    setMembers,
    own,
    plan,
    quota,
    usage,
    open,
    remove,
    setHash,
    selectedReq,
    setSelectedReq,
    setIntro: (x) => (demo ? setNotice("Sample data is read-only.") : setIntro(x)),
    setNotice,
  };

  return (
    <div className="app">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/" className="sidebar-brand" aria-label="AssetMeet home">
          <Wordmark />
        </Link>
        <nav aria-label="Workspace">
          {tabs.map((t) => {
            const Icon = tabInfo[t].icon;
            return (
              <a key={t} href={`#${t}`} aria-current={tab === t ? "page" : undefined}>
                <Icon size={19} aria-hidden="true" />
                <span>{tabInfo[t].label}</span>
              </a>
            );
          })}
        </nav>
        <div className="sidebar-user">
          <p>
            <strong>{profile.name}</strong>
            <span>{staff ? "AssetMeet team" : `${role} · ${plan} plan`}</span>
          </p>
          <SignOut demo={demo} label={demo ? "Leave sample data" : "Sign out"} />
        </div>
      </aside>

      <header className="app-topbar">
        <Link href="/" aria-label="AssetMeet home">
          <Wordmark />
        </Link>
        <SignOut demo={demo} label={demo ? "Leave" : "Sign out"} />
      </header>

      <main className="app-main" id="content">
        {demo && (
          <p className="banner">
            <strong>Sample workspace.</strong> Fictional records, shown as the AssetMeet team sees them. Nothing here is
            saved. <Link href="/?view=app">Sign in</Link> to start your own.
          </p>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {tab === "overview" && (staff ? <ControlDashboard {...ctx} name={profile.name} /> : <Overview {...ctx} name={profile.name} />)}
        {tab === "demands" && <Demands {...ctx} />}
        {tab === "assets" && <Assets {...ctx} />}
        {tab === "matches" && (staff ? <Matches {...ctx} /> : <MemberMatches {...ctx} />)}
        {tab === "deals" && <DealDesk {...ctx} />}
        {tab === "opportunities" && <Opportunities {...ctx} />}
        {tab === "revenue" && <Revenue {...ctx} />}
        {tab === "members" && <Members {...ctx} />}
        {tab === "shortlists" && <Shortlists {...ctx} />}
        {tab === "interest" && <Interest {...ctx} />}
        {tab === "plan" && <PlanView {...ctx} planUntil={profile.planUntil} />}
      </main>

      <nav className="tabbar" aria-label="Workspace">
        {tabs.map((t) => {
          const Icon = tabInfo[t].icon;
          return (
            <a key={t} href={`#${t}`} aria-current={tab === t ? "page" : undefined}>
              <Icon size={20} aria-hidden="true" />
              <span>{tabInfo[t].short ?? tabInfo[t].label}</span>
            </a>
          );
        })}
      </nav>

      {dialog && (
        <RecordDialog
          kind={dialog.kind}
          record={dialog.record}
          initial={dialog.initial}
          staff={staff}
          properties={properties}
          requirements={requirements}
          deals={deals}
          opportunities={opportunities}
          onSave={save}
          onClose={() => setDialog(null)}
        />
      )}
      {intro && <IntroDialog {...intro} onConfirm={requestIntro} onClose={() => setIntro(null)} />}
    </div>
  );
}

type ViewProps = {
  role: Role;
  staff: boolean;
  demo: boolean;
  properties: Property[];
  requirements: Requirement[];
  deals: Deal[];
  opportunities: Opportunity[];
  fees: Fee[];
  members: Member[];
  setMembers: (m: Member[]) => void;
  own: { properties: Property[]; requirements: Requirement[] };
  plan: PlanName;
  quota: Quota;
  usage: { assets: number; demands: number; matches: number };
  open: (kind: Kind, record?: Row, initial?: Record<string, unknown>) => void;
  remove: (kind: Kind, row: Row & { name: string }) => void;
  setHash: (h: string) => void;
  selectedReq: string;
  setSelectedReq: (id: string) => void;
  setIntro: (x: { property: Property; requirement: Requirement }) => void;
  setNotice: (s: string) => void;
};

function PageHead({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {action}
    </div>
  );
}

function Empty({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}

function RowActions({ onEdit, onDelete, label }: { onEdit: () => void; onDelete?: () => void; label: string }) {
  return (
    <div className="row-actions">
      <button className="btn btn-quiet btn-sm" onClick={onEdit} aria-label={`Edit ${label}`}>
        <Pencil size={15} aria-hidden="true" /> Edit
      </button>
      {onDelete && (
        <button className="btn btn-quiet btn-sm btn-danger" onClick={onDelete} aria-label={`Delete ${label}`}>
          <Trash2 size={15} aria-hidden="true" /> Delete
        </button>
      )}
    </div>
  );
}

function Metrics({ items }: { items: [string, React.ReactNode, string?][] }) {
  return (
    <dl className="metrics">
      {items.map(([label, value, note]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
          {note && <small>{note}</small>}
        </div>
      ))}
    </dl>
  );
}

function Signals({ property }: { property: Property }) {
  const list = deskSignals(property);
  if (!list.length) return null;
  return (
    <>
      {list.map((s) => (
        <span key={s.label} className={`pill pill-${s.tone}`} title={s.action}>
          {s.label}
        </span>
      ))}
    </>
  );
}

function allMatches(properties: Property[], requirement: Requirement) {
  return properties
    .map((p) => ({ p, m: match(p, requirement) }))
    .filter((x): x is { p: Property; m: NonNullable<ReturnType<typeof match>> } => x.m !== null)
    .sort((a, b) => b.m.score - a.m.score);
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
const nameOf = (list: { id: string; name: string }[], id: string) => list.find((x) => x.id === id)?.name ?? "Removed record";

function collectedFor(fees: Fee[], dealId: string) {
  return sum(
    fees
      .filter((f) => f.linkKind === "deal" && f.linkId === dealId && f.status === "Collected" && brokerageStreams.includes(f.stream))
      .map((f) => f.amount),
  );
}

function paidMembers(members: Member[]) {
  return members
    .map((m) => ({ ...m, effective: effectivePlan(m.plan, m.planUntil, today()) }))
    .filter((m) => m.effective !== "Free");
}

// ------------------------------------------------------------------ Staff: control dashboard

function ControlDashboard(props: ViewProps & { name: string }) {
  const { properties, requirements, deals, opportunities, fees, members, setHash, setSelectedReq } = props;
  const paid = paidMembers(members);
  const mrr = sum(paid.map((m) => plans[m.effective].price));
  const tiers = (["Connect", "Professional", "Corporate"] as const).map((t) => `${paid.filter((m) => m.effective === t).length} ${t}`).join(" · ");
  const confirmed = properties.filter((p) => !["Mapped", "Withdrawn"].includes(p.status));
  const verified = properties.filter((p) => p.verification === "Verified");
  const qualified = requirements.filter((r) => qualifiedRequirementStatuses.includes(r.status));
  const live = deals.filter((d) => d.stage !== "Dropped");
  const advanced = live.filter((d) => d.stage !== "Flagged");
  const eligible = live.filter((d) => d.stage !== "Flagged");
  const mandated = live.filter((d) => d.mandateSigned);
  const closed = deals.filter((d) => d.stage === "Closed");
  const byStatus = (s: string) => sum(fees.filter((f) => f.status === s).map((f) => f.amount));
  const contracted = byStatus("Contracted") + byStatus("Invoiced") + byStatus("Collected");
  const activeOpps = opportunities.filter((o) => o.stage !== "Dropped" && o.stage !== "Delivered / leased");
  const paidStudies = fees.filter((f) => f.stream === "Feasibility & advisory" && ["Contracted", "Invoiced", "Collected"].includes(f.status));
  const rewards = deals.map((d) => ({ d, reward: rewardFor(d.rewardRate, collectedFor(fees, d.id)) }));
  const liability = sum(rewards.filter((x) => x.d.payoutStatus === "Approved").map((x) => x.reward));
  const paidOut = sum(rewards.filter((x) => x.d.payoutStatus === "Paid").map((x) => x.reward));
  const due = [...deals, ...opportunities].filter(
    (x) => x.followup && x.followup <= today() && !["Closed", "Dropped", "Delivered / leased"].includes(x.stage),
  );
  const review = properties.filter((p) => deskSignals(p).some((s) => s.label === "High value") && !deals.some((d) => d.propertyId === p.id));
  const unmet = requirements.filter((r) => r.status === "Unmet" && !opportunities.some((o) => o.requirementId === r.id));

  const steps: { text: string; action: React.ReactNode }[] = [];
  if (due.length)
    steps.push({ text: `${due.length} follow-up${due.length === 1 ? " is" : "s are"} due across deals and opportunities.`, action: <a className="btn btn-secondary btn-sm" href="#deals">Open Deal Desk</a> });
  if (review.length)
    steps.push({ text: `${review.length} high-value ${review.length === 1 ? "asset needs" : "assets need"} a Deal Desk review.`, action: <a className="btn btn-secondary btn-sm" href="#assets">Review</a> });
  if (unmet.length)
    steps.push({ text: `${unmet.length} unmet ${unmet.length === 1 ? "demand" : "demands"} could become a development opportunity.`, action: <a className="btn btn-secondary btn-sm" href="#opportunities">Open Opportunity Bank</a> });

  const best = requirements
    .filter((r) => !["Closed", "Development lead"].includes(r.status))
    .flatMap((r) => allMatches(properties, r).slice(0, 2).map((x) => ({ ...x, r })))
    .filter((x) => !deals.some((d) => d.propertyId === x.p.id && d.requirementId === x.r.id))
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, 4);

  return (
    <>
      <PageHead title={`Welcome, ${props.name.split(" ")[0]}`} text="Control dashboard: activity, not just listings. Data quality, useful matches, qualified enquiries and collected revenue." />
      <section className="panel">
        <h2>Marketplace</h2>
        <Metrics
          items={[
            ["Active subscribers", paid.length, tiers],
            ["Recurring revenue (MRR)", inr(mrr), "Billed, excluding GST"],
            ["Owner-confirmed assets", confirmed.length, `${verified.length} with verified documents`],
            ["Qualified demands", qualified.length, `of ${requirements.length} posted`],
          ]}
        />
      </section>
      <section className="panel">
        <h2>Transactions</h2>
        <Metrics
          items={[
            ["Useful match rate", pct(advanced.length, live.length), "Flagged matches advanced to enquiry"],
            ["Mandate conversion", pct(mandated.length, eligible.length), `${mandated.length} signed ${mandated.length === 1 ? "mandate" : "mandates"}`],
            ["Deals closed", closed.length, `${inr(contracted)} in fees contracted to date`],
            ["Cash collected", inr(byStatus("Collected")), `${inr(byStatus("Invoiced"))} invoiced, awaiting payment`],
          ]}
        />
      </section>
      <section className="panel">
        <h2>Development and partners</h2>
        <Metrics
          items={[
            ["Development pipeline", activeOpps.length, `${paidStudies.length} paid ${paidStudies.length === 1 ? "study" : "studies"}`],
            ["Fees in pipeline", inr(byStatus("Pipeline")), "Not yet agreed. Not revenue."],
            ["Approved reward liability", inr(liability), "Contributor payouts approved, unpaid"],
            ["Partner rewards paid", inr(paidOut)],
          ]}
        />
      </section>
      {steps.length > 0 && (
        <section className="panel">
          <h2>Next steps</h2>
          <ul className="next-steps">
            {steps.map((s) => (
              <li key={s.text}>
                <span>{s.text}</span>
                {s.action}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="panel">
        <div className="panel-head">
          <h2>Strongest matches not yet with the Deal Desk</h2>
          <a href="#matches">Match Engine</a>
        </div>
        {best.length ? (
          <ul className="compact-list">
            {best.map(({ p, r, m }) => (
              <li key={p.id + r.id}>
                <Score value={m.score} />
                <div>
                  <strong>{p.name}</strong>
                  <span>for {r.name}</span>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedReq(r.id);
                    setHash("matches");
                  }}
                >
                  Review
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No open matches. Add assets or demands to see them here.</p>
        )}
      </section>
    </>
  );
}

// ------------------------------------------------------------------ Members: overview

function Overview(props: ViewProps & { name: string }) {
  const { role, deals, own, open, plan, quota, usage } = props;
  const pending = own.properties.filter((p) => !p.consent);
  const steps: { text: string; action: React.ReactNode }[] = [];
  if (role === "Business" && !own.requirements.length)
    steps.push({ text: "Post your first space requirement to the Demand Bank.", action: <button className="btn btn-primary btn-sm" onClick={() => open("requirement")}>Post a demand</button> });
  if ((role === "Owner" || role === "Contributor") && !own.properties.length)
    steps.push({ text: "Add your first property to the Asset Bank.", action: <button className="btn btn-primary btn-sm" onClick={() => open("property")}>Add an asset</button> });
  if (pending.length)
    steps.push({ text: `${pending.length} ${pending.length === 1 ? "property needs" : "properties need"} the owner's permission before a deal can move forward.`, action: <a className="btn btn-secondary btn-sm" href="#assets">Review</a> });
  if (plan === "Free")
    steps.push({ text: "Subscribe to run matches yourself and request introductions through the Deal Desk.", action: <a className="btn btn-secondary btn-sm" href="#plan">See plans</a> });
  if (role === "Business" && own.requirements.length && !deals.length)
    steps.push({ text: "The AssetMeet team is reviewing assets against your brief. Shortlisted properties will appear under Shortlists.", action: null });

  const cap = (n: number | null) => (n === null ? "no limit" : `of ${n}`);
  const metrics: [string, React.ReactNode, string?][] =
    role === "Business"
      ? [
          ["Active demands", usage.demands, cap(quota.demands)],
          ["Shortlisted", deals.length],
          ["Saved matches this month", usage.matches, `of ${quota.matches}`],
        ]
      : [
          ["Active assets", usage.assets, cap(quota.assets)],
          ["Permission pending", pending.length],
          ["Interest", deals.length],
        ];

  return (
    <>
      <PageHead title={`Welcome, ${props.name.split(" ")[0]}`} text={`Your private AssetMeet workspace · ${plan} plan.`} />
      <Metrics items={metrics} />
      {steps.length > 0 && (
        <section className="panel">
          <h2>Next steps</h2>
          <ul className="next-steps">
            {steps.map((s) => (
              <li key={s.text}>
                <span>{s.text}</span>
                {s.action}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function reqFacts(r: Requirement) {
  return `${r.district} · ${r.type} · ${r.transaction} · ${sqft(r.minArea)}–${sqft(r.maxArea)} · up to ${priceLabel(r.budget, r.transaction)} · ${r.parking} parking · within ${r.months} months`;
}

function demandTone(status: string) {
  if (status === "Draft") return "muted" as const;
  if (status === "Unmet") return "warning" as const;
  if (status === "Development lead") return "laterite" as const;
  if (status === "Closed") return "muted" as const;
  return "brand" as const;
}

// ------------------------------------------------------------------ Demand Bank

function Demands(props: ViewProps) {
  const { requirements, properties, deals, open, remove, staff, setHash, setSelectedReq } = props;
  const list = requirements.filter((r) => !r.shared);
  return (
    <>
      <PageHead
        title="Demand Bank"
        text={staff ? "Buy, lease, rent, expansion, corporate and investor requirements, with how many assets fit." : "Your space requirements. The AssetMeet team qualifies each one and shortlists assets against it."}
        action={
          <button className="btn btn-primary" onClick={() => open("requirement")}>
            <Plus size={18} aria-hidden="true" /> Add demand
          </button>
        }
      />
      {list.length ? (
        <div className="cards">
          {list.map((r) => {
            const fits = allMatches(properties, r).length;
            const shortlisted = deals.filter((d) => d.requirementId === r.id).length;
            return (
              <article className="card" key={r.id}>
                <div className="panel-head">
                  <h2>{r.name}</h2>
                  <Pill tone={demandTone(r.status)}>{r.status}</Pill>
                </div>
                <p className="facts">{reqFacts(r)}</p>
                <div className="card-foot">
                  {staff ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedReq(r.id);
                        setHash("matches");
                      }}
                    >
                      {fits} matching {fits === 1 ? "asset" : "assets"} <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  ) : (
                    <a className="btn btn-secondary btn-sm" href="#shortlists">
                      {shortlisted} shortlisted <ArrowRight size={15} aria-hidden="true" />
                    </a>
                  )}
                  <RowActions label={r.name} onEdit={() => open("requirement", r)} onDelete={() => remove("requirement", r)} />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty
          title="No demands yet"
          text="Describe the space you need: district, type, area range, budget, parking and timing."
          action={
            <button className="btn btn-primary" onClick={() => open("requirement")}>
              Post a demand
            </button>
          }
        />
      )}
    </>
  );
}

// ------------------------------------------------------------------ Asset Bank

function Assets(props: ViewProps) {
  const { properties, open, remove, staff } = props;
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("All districts");
  const mine = properties.filter((p) => !p.shared);
  const list = mine.filter(
    (p) =>
      (district === "All districts" || p.district === district) &&
      `${p.name} ${p.locality}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHead
        title="Asset Bank"
        text={
          staff
            ? "Existing buildings, land and spaces: sanctioned, ongoing and completed, including those not yet on the market."
            : "Properties you have recorded. Nothing is public. Members see a property only if you choose, and never your contact details."
        }
        action={
          <button className="btn btn-primary" onClick={() => open("property")}>
            <Plus size={18} aria-hidden="true" /> Add asset
          </button>
        }
      />
      {mine.length ? (
        <>
          <div className="toolbar">
            <label className="search">
              <Search size={17} aria-hidden="true" />
              <span className="visually-hidden">Search assets</span>
              <input type="search" placeholder="Search by name or locality" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label>
              <span className="visually-hidden">District</span>
              <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option>All districts</option>
                {districts.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Asset</th>
                  <th scope="col">Area</th>
                  <th scope="col">Price</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Asset">
                      <strong>{p.name}</strong>
                      <span className="sub">
                        {p.locality ? `${p.locality}, ` : ""}
                        {p.district} · {p.type} · {p.transaction}
                      </span>
                    </td>
                    <td data-label="Area" className="num">{sqft(p.area)}</td>
                    <td data-label="Price" className="num">{priceLabel(p.price, p.transaction)}</td>
                    <td data-label="Status">
                      <span className="status-pills">
                        <span className="pill pill-neutral">{p.construction}</span>
                        <StatusPill status={p.status} />
                        <VerificationPill level={p.verification} />
                        {p.consent ? <Pill tone="brand">Permission given</Pill> : <Pill tone="warning">Permission pending</Pill>}
                        {p.visibility !== "Private" && <Pill>{p.visibility === "Members" ? "Visible to members" : "Mandate only"}</Pill>}
                        {staff && <Signals property={p} />}
                      </span>
                    </td>
                    <td>
                      <RowActions label={p.name} onEdit={() => open("property", p)} onDelete={() => remove("property", p)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && <p className="muted table-empty">No assets match these filters.</p>}
          </div>
        </>
      ) : (
        <Empty
          title="No assets yet"
          text="Record a building or plot, even if it is still under construction. Basic submission is free and nothing is published."
          action={
            <button className="btn btn-primary" onClick={() => open("property")}>
              Add an asset
            </button>
          }
        />
      )}
    </>
  );
}

// ------------------------------------------------------------------ Staff: Match Engine

function Matches(props: ViewProps) {
  const { properties, requirements, deals, opportunities, open, selectedReq, setSelectedReq, setHash } = props;
  const req = requirements.find((r) => r.id === selectedReq) ?? requirements[0];
  const results = useMemo(() => (req ? allMatches(properties, req) : []), [properties, req]);
  const opportunity = req && opportunities.find((o) => o.requirementId === req.id);
  const createOpportunity = () =>
    req && open("opportunity", undefined, { name: `${req.name} · ${req.district}`, requirementId: req.id, stage: "Demand gap detected" });
  return (
    <>
      <PageHead title="Match Engine" text="Location, area, budget, technical fit, possession and owner permission. A score supports a person's review; it does not certify suitability." />
      {req ? (
        <>
          <div className="toolbar">
            <label className="field inline">
              <span className="field-label">Demand</span>
              <select value={req.id} onChange={(e) => setSelectedReq(e.target.value)}>
                {requirements.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.district}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted small">
              <Pill tone={demandTone(req.status)}>{req.status}</Pill> {reqFacts(req)}
            </p>
          </div>
          {results.length ? (
            <div className="match-list">
              {results.map(({ p, m }) => {
                const existing = deals.find((d) => d.propertyId === p.id && d.requirementId === req.id);
                return (
                  <article className="card match-card" key={p.id}>
                    <MatchRow property={p} requirement={req} />
                    <div className="card-foot">
                      <p className="small status-pills">
                        {m.hold ? (
                          <Pill tone="danger">Hold until verification</Pill>
                        ) : m.outreach ? (
                          <Pill tone="warning">Private outreach first</Pill>
                        ) : (
                          <Pill tone="brand">Ready to introduce</Pill>
                        )}
                        <Signals property={p} />
                        <span>
                          Owner: {p.ownerContact || "contact not recorded"} · Recorded by {p.source}
                        </span>
                      </p>
                      {existing ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => setHash("deals")}>
                          Deal at {existing.stage} <ArrowRight size={15} aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            open("deal", undefined, {
                              name: `${p.name} · ${req.name}`,
                              propertyId: p.id,
                              requirementId: req.id,
                              stage: m.outreach ? "Flagged" : "Qualified",
                              leadSource: "Staff match",
                              value: p.price,
                            })
                          }
                        >
                          Send to Deal Desk
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty
              title="No suitable asset found"
              text="That is not the end of the search. After the demand is validated, it can become a development opportunity: site search, feasibility and a project proposal."
              action={
                opportunity ? (
                  <button className="btn btn-secondary" onClick={() => setHash("opportunities")}>
                    Opportunity at {opportunity.stage} <ArrowRight size={15} aria-hidden="true" />
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={createOpportunity}>
                    Create development opportunity
                  </button>
                )
              }
            />
          )}
          <p className="footnote">Score weights: location 25, area 20, budget 20, parking 15, possession timeline 10, owner confirmation 10.</p>
        </>
      ) : (
        <Empty title="No demands yet" text="Matches appear once a business posts a requirement." />
      )}
    </>
  );
}

// ------------------------------------------------------------------ Members: self-service matching

function MemberMatches(props: ViewProps) {
  const { role, properties, requirements, deals, own, plan, quota, usage, setIntro } = props;
  const pool = { properties: properties.filter((p) => p.pool), requirements: requirements.filter((r) => r.pool) };
  const business = role === "Business";
  const left = Math.max(0, quota.matches - usage.matches);

  if (plan === "Free")
    return (
      <>
        <PageHead title="Match Engine" text="Run matches yourself across the AssetMeet network." />
        <Empty
          title="Self-service matching is part of a paid plan"
          text={
            business
              ? "On the Free plan the AssetMeet team still reviews assets against your demand and shares a shortlist. Subscribe to see scored matches from owner-approved assets yourself and save them for an introduction."
              : "On the Free plan the AssetMeet team still matches your properties with businesses. Subscribe to see qualified demand that fits your assets and ask for introductions."
          }
          action={
            <a className="btn btn-primary" href="#plan">
              See plans
            </a>
          }
        />
      </>
    );

  const groups = business
    ? own.requirements.map((r) => ({
        key: r.id,
        title: r.name,
        facts: reqFacts(r),
        results: allMatches(pool.properties, r).map((x) => ({ property: x.p, requirement: r, score: x.m.score, reasons: x.m.reasons })),
      }))
    : own.properties.map((p) => ({
        key: p.id,
        title: p.name,
        facts: `${p.district} · ${p.type} · ${sqft(p.area)} · ${priceLabel(p.price, p.transaction)}`,
        results: pool.requirements
          .map((r) => ({ r, m: match(p, r) }))
          .filter((x) => x.m)
          .sort((a, b) => b.m!.score - a.m!.score)
          .map((x) => ({ property: p, requirement: x.r, score: x.m!.score, reasons: x.m!.reasons })),
      }));

  return (
    <>
      <PageHead
        title="Match Engine"
        text={
          business
            ? "Owner-approved assets scored against your demands. You see the data, not the owner's identity; owner details are released only under a signed mandate."
            : "Qualified business demand scored against your assets. Business names are released only through the Deal Desk."
        }
      />
      <p className="notice">
        {left} of {quota.matches} saved matches left this month on the {plan} plan.
      </p>
      {groups.length ? (
        groups.map((g) => (
          <section className="panel" key={g.key}>
            <div className="panel-head">
              <h2>{g.title}</h2>
              <span className="muted small">{g.results.length} {g.results.length === 1 ? "match" : "matches"}</span>
            </div>
            <p className="facts">{g.facts}</p>
            {g.results.length ? (
              g.results.map((x) => {
                const saved = deals.some((d) => d.propertyId === x.property.id && d.requirementId === x.requirement.id);
                return (
                  <article className="shortlist-item member-match" key={x.property.id + x.requirement.id}>
                    <div className="match-row">
                      <Score value={x.score} />
                      <div className="match-row-body">
                        <div className="match-row-head">
                          <h3>{business ? x.property.name : x.requirement.name}</h3>
                          {business && <StatusPill status={x.property.status} />}
                        </div>
                        <p className="facts">
                          {business
                            ? `${sqft(x.property.area)} · ${priceLabel(x.property.price, x.property.transaction)} · ${months(x.property.months)} · ${x.property.parking} parking · ${x.property.construction}`
                            : `${sqft(x.requirement.minArea)}–${sqft(x.requirement.maxArea)} · up to ${priceLabel(x.requirement.budget, x.requirement.transaction)} · within ${x.requirement.months} months`}
                        </p>
                        <Reasons reasons={x.reasons} />
                      </div>
                    </div>
                    <div className="card-foot">
                      {saved ? (
                        <Pill tone="brand">With the Deal Desk</Pill>
                      ) : (
                        <button className="btn btn-primary btn-sm" disabled={!left} onClick={() => setIntro({ property: x.property, requirement: x.requirement })}>
                          Save and request introduction
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="muted">No matches yet. New {business ? "assets" : "demands"} are added as the network grows.</p>
            )}
          </section>
        ))
      ) : (
        <Empty
          title={business ? "No demands yet" : "No assets yet"}
          text={business ? "Post a demand to see matching assets." : "Add an asset to see matching demand."}
          action={
            <a className="btn btn-primary" href={business ? "#demands" : "#assets"}>
              {business ? "Go to Demand Bank" : "Go to Asset Bank"}
            </a>
          }
        />
      )}
    </>
  );
}

function IntroDialog({
  property,
  requirement,
  onConfirm,
  onClose,
}: {
  property: Property;
  requirement: Requirement;
  onConfirm: (optIn: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [optIn, setOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);
  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="intro-title">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onConfirm(optIn);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to save");
            setBusy(false);
          }
        }}
      >
        <div className="dialog-head">
          <h2 id="intro-title">Request an introduction</h2>
        </div>
        <div className="dialog-body">
          <p>
            <strong>{property.name}</strong> for <strong>{requirement.name}</strong>
          </p>
          <p className="small">
            This uses one saved match. The Deal Desk reviews it and contacts you. Details of the other side are released
            only with their permission.
          </p>
          <label className="check">
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
            <span>
              I would like AssetMeet to represent me in this deal. I understand brokerage is charged only under a separate
              written agreement.
            </span>
          </label>
          <p className="small muted">Leave this unticked if you only want the introduction. Your subscription does not commit you to brokerage.</p>
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
            {busy ? "Saving…" : "Request introduction"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

// ------------------------------------------------------------------ Deal Desk

function DealDesk(props: ViewProps) {
  const { deals, properties, requirements, fees, open } = props;
  return (
    <>
      <PageHead
        title="Deal Desk"
        text="Flag, qualify, sign the mandate, visit, negotiate, close and collect. Deal Desk work follows a written mandate; each stage needs an owner and a dated next action."
        action={
          properties.length && requirements.length ? (
            <button className="btn btn-primary" onClick={() => open("deal")}>
              <Plus size={18} aria-hidden="true" /> Add deal
            </button>
          ) : null
        }
      />
      <div className="board" role="list">
        {dealStages.map((stage) => {
          const list = deals.filter((d) => d.stage === stage);
          return (
            <section className="board-col" key={stage} role="listitem" aria-label={`${stage}, ${list.length} deals`}>
              <h2>
                {stage} <span>{list.length}</span>
              </h2>
              {list.map((d) => {
                const done = stage === "Closed" || stage === "Dropped";
                const overdue = d.followup && d.followup < today() && !done;
                const property = properties.find((p) => p.id === d.propertyId);
                const contracted = sum(fees.filter((f) => f.linkKind === "deal" && f.linkId === d.id && ["Contracted", "Invoiced", "Collected"].includes(f.status)).map((f) => f.amount));
                return (
                  <article className="deal" key={d.id}>
                    <strong>{d.name}</strong>
                    <span className="sub">
                      {nameOf(properties, d.propertyId)} → {nameOf(requirements, d.requirementId)}
                    </span>
                    <span className="status-pills">
                      {d.mandateSigned ? <Pill tone="brand">Mandate · {d.mandateParty.toLowerCase()}</Pill> : <Pill tone="muted">No mandate</Pill>}
                      {d.optIn && <Pill>Client opted in</Pill>}
                      {property && <Signals property={property} />}
                    </span>
                    {(d.assignee || d.nextAction) && (
                      <span className="sub">
                        {d.assignee && <strong>{d.assignee}: </strong>}
                        {d.nextAction || "No next action set"}
                      </span>
                    )}
                    {!done && !d.nextAction && <span className="small warning-text">Set a next action</span>}
                    {d.followup && (
                      <span className={`pill ${overdue ? "pill-warning" : "pill-neutral"}`}>
                        {overdue ? "Overdue · " : "Follow up "}
                        {d.followup}
                      </span>
                    )}
                    {(d.value > 0 || contracted > 0) && (
                      <span className="sub">
                        {d.value > 0 && <>Value {property ? priceLabel(d.value, property.transaction) : inrShort(d.value)}</>}
                        {contracted > 0 && <> · Fee contracted {inr(contracted)}</>}
                      </span>
                    )}
                    <button className="btn btn-quiet btn-sm" onClick={() => open("deal", d)} aria-label={`Update ${d.name}`}>
                      <Pencil size={15} aria-hidden="true" /> Update
                    </button>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Opportunity Bank

function Opportunities(props: ViewProps) {
  const { opportunities, requirements, properties, fees, open, remove } = props;
  const gaps = requirements.filter(
    (r) => !opportunities.some((o) => o.requirementId === r.id) && (r.status === "Unmet" || (qualifiedRequirementStatuses.includes(r.status) && !allMatches(properties, r).length)),
  );
  const land = properties.filter((p) => p.type === "Land" && isActiveProperty(p));
  return (
    <>
      <PageHead
        title="Opportunity Bank"
        text="No match? Create an opportunity. Qualified unmet demand is connected with land or expandable buildings to start a project proposal."
        action={
          requirements.length ? (
            <button className="btn btn-primary" onClick={() => open("opportunity", undefined, { stage: "Demand gap detected" })}>
              <Plus size={18} aria-hidden="true" /> Add opportunity
            </button>
          ) : null
        }
      />
      {gaps.length > 0 && (
        <section className="panel">
          <h2>Demand gaps detected</h2>
          <p className="muted small">Qualified or unmet demands with no suitable asset in the Asset Bank. {land.length} land {land.length === 1 ? "record is" : "records are"} available as site options.</p>
          <ul className="next-steps">
            {gaps.map((r) => (
              <li key={r.id}>
                <span>
                  <strong>{r.name}</strong> · {reqFacts(r)}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => open("opportunity", undefined, { name: `${r.name} · ${r.district}`, requirementId: r.id, stage: "Demand gap detected" })}
                >
                  Create opportunity
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {opportunities.length ? (
        <div className="cards">
          {opportunities.map((o) => {
            const stack = fees.filter((f) => f.linkKind === "opportunity" && f.linkId === o.id && f.status !== "Cancelled");
            const step = opportunityStages.indexOf(o.stage);
            const site = properties.find((p) => p.id === o.propertyId);
            return (
              <article className="card" key={o.id}>
                <div className="panel-head">
                  <h2>{o.name}</h2>
                  <Pill tone={o.stage === "Dropped" ? "muted" : "laterite"}>{o.stage}</Pill>
                </div>
                <ol className="stage-track" aria-label={`Stage ${step + 1} of ${opportunityStages.length - 1}`}>
                  {opportunityStages.slice(0, -1).map((s, i) => (
                    <li key={s} className={i <= step && o.stage !== "Dropped" ? "done" : ""} title={s} />
                  ))}
                </ol>
                <p className="facts">
                  Demand: {nameOf(requirements, o.requirementId)}
                  <br />
                  Site: {site ? `${site.name} · ${site.district}` : "Not chosen yet"}
                </p>
                {(o.assignee || o.nextAction) && (
                  <p className="small">
                    {o.assignee && <strong>{o.assignee}: </strong>}
                    {o.nextAction}
                    {o.followup && <> · by {o.followup}</>}
                  </p>
                )}
                {stack.length > 0 && (
                  <table className="fee-stack">
                    <tbody>
                      {stack.map((f) => (
                        <tr key={f.id}>
                          <td>{f.name}</td>
                          <td>
                            <Pill tone={f.status === "Collected" ? "brand" : f.status === "Pipeline" ? "muted" : "neutral"}>{f.status}</Pill>
                          </td>
                          <td className="num">{inr(f.amount)}</td>
                        </tr>
                      ))}
                      <tr>
                        <th scope="row">Combined potential</th>
                        <td className="small muted">Not guaranteed</td>
                        <td className="num">
                          <strong>{inr(sum(stack.map((f) => f.amount)))}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
                <div className="card-foot">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => open("fee", undefined, { linkKind: "opportunity", linkId: o.id, stream: "Feasibility & advisory", status: "Pipeline", payer: "Client" })}
                  >
                    <Plus size={15} aria-hidden="true" /> Add fee
                  </button>
                  <RowActions label={o.name} onEdit={() => open("opportunity", o)} onDelete={() => remove("opportunity", o)} />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty
          title="No opportunities yet"
          text="When a validated demand has no suitable asset, create an opportunity here to run site search, feasibility and a proposal."
        />
      )}
      <p className="footnote">A development lead is not a constructed project or a tenant commitment. Each service (feasibility, design, PMC, leasing) needs its own agreement, disclosed to every party.</p>
    </>
  );
}

// ------------------------------------------------------------------ Revenue

function Revenue(props: ViewProps) {
  const { fees, deals, properties, opportunities, members, open, remove } = props;
  const paid = paidMembers(members);
  const mrr = sum(paid.map((m) => plans[m.effective].price));
  const live = fees.filter((f) => f.status !== "Cancelled");
  const amount = (xs: Fee[], status: string) => sum(xs.filter((f) => f.status === status).map((f) => f.amount));
  const stages = feeStatuses.filter((s) => s !== "Cancelled");
  const linkName = (f: Fee) =>
    f.linkKind === "deal" ? nameOf(deals, f.linkId) : f.linkKind === "opportunity" ? nameOf(opportunities, f.linkId) : "Stand-alone";
  const payouts = deals
    .filter((d) => d.rewardRate > 0)
    .map((d) => {
      const collected = collectedFor(fees, d.id);
      return { d, collected, reward: rewardFor(d.rewardRate, collected) };
    });
  return (
    <>
      <PageHead
        title="Revenue"
        text="Stable recurring income, variable transaction income and specialist project services, tracked separately from pipeline to cash. Unsigned deal value is never shown as revenue."
        action={
          <button className="btn btn-primary" onClick={() => open("fee", undefined, { status: "Pipeline" })}>
            <Plus size={18} aria-hidden="true" /> Add fee
          </button>
        }
      />
      <Metrics
        items={[
          ["Recurring (MRR)", inr(mrr), `${paid.length} paying ${paid.length === 1 ? "member" : "members"}, excl. GST`],
          ["Pipeline", inr(amount(live, "Pipeline")), "Not agreed. Not revenue."],
          ["Contracted", inr(amount(live, "Contracted")), "Signed, not yet invoiced"],
          ["Invoiced", inr(amount(live, "Invoiced")), "Awaiting payment"],
          ["Collected", inr(amount(live, "Collected")), "Money received"],
        ]}
      />
      <section className="panel">
        <h2>By revenue stream</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Stream</th>
                {stages.map((s) => (
                  <th scope="col" key={s} className="num">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td data-label="Stream">
                  <strong>Subscriptions</strong>
                  <span className="sub">Billed monthly from active plans</span>
                </td>
                <td data-label="Pipeline" className="num">—</td>
                <td data-label="Contracted" className="num">—</td>
                <td data-label="Invoiced" className="num">{inr(mrr)} / month</td>
                <td data-label="Collected" className="num">Recorded outside the app</td>
              </tr>
              {revenueStreams.map((stream) => {
                const xs = live.filter((f) => f.stream === stream);
                return (
                  <tr key={stream}>
                    <td data-label="Stream">
                      <strong>{stream}</strong>
                    </td>
                    {stages.map((s) => (
                      <td key={s} data-label={s} className="num">
                        {amount(xs, s) ? inr(amount(xs, s)) : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2>Fees</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Scope</th>
                <th scope="col">Payer and trigger</th>
                <th scope="col">Status</th>
                <th scope="col" className="num">Amount</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => (
                <tr key={f.id}>
                  <td data-label="Scope">
                    <strong>{f.name}</strong>
                    <span className="sub">
                      {f.stream} · {linkName(f)}
                    </span>
                  </td>
                  <td data-label="Payer and trigger">
                    {f.payer}
                    {f.trigger && <span className="sub">{f.trigger}</span>}
                  </td>
                  <td data-label="Status">
                    <span className="status-pills">
                      <Pill tone={f.status === "Collected" ? "brand" : f.status === "Pipeline" || f.status === "Cancelled" ? "muted" : "neutral"}>{f.status}</Pill>
                      {f.agreement ? <Pill tone="brand">Agreement signed</Pill> : <Pill tone="warning">No agreement</Pill>}
                      {f.invoice && <Pill>Invoice {f.invoice}</Pill>}
                      {f.collectedOn && <Pill>Received {f.collectedOn}</Pill>}
                    </span>
                  </td>
                  <td data-label="Amount" className="num">{inr(f.amount)}</td>
                  <td>
                    <RowActions label={f.name} onEdit={() => open("fee", f)} onDelete={() => remove("fee", f)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!fees.length && <p className="muted table-empty">No fees recorded yet.</p>}
        </div>
      </section>
      <section className="panel">
        <h2>Partner earnings</h2>
        <p className="muted small">
          Rewards are worked out from brokerage actually collected. A payout needs a source lock, lawful eligibility, the fee
          event, deal manager and finance review, and a payout statement. These figures do not trigger payments.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Deal</th>
                <th scope="col">Contributor</th>
                <th scope="col" className="num">Brokerage collected</th>
                <th scope="col" className="num">Reward</th>
                <th scope="col">Payout</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(({ d, collected, reward }) => (
                <tr key={d.id}>
                  <td data-label="Deal">
                    <strong>{d.name}</strong>
                    <span className="sub">{d.stage}</span>
                  </td>
                  <td data-label="Contributor">
                    {properties.find((p) => p.id === d.propertyId)?.source ?? "—"}
                    <span className="sub">
                      {d.sourceTier} · {d.rewardRate}%
                    </span>
                  </td>
                  <td data-label="Brokerage collected" className="num">{inr(collected)}</td>
                  <td data-label="Reward" className="num">{inr(reward)}</td>
                  <td data-label="Payout">
                    <Pill tone={d.payoutStatus === "Paid" ? "brand" : d.payoutStatus === "Approved" ? "warning" : "muted"}>{d.payoutStatus}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!payouts.length && <p className="muted table-empty">No deals carry a contributor reward yet.</p>}
        </div>
      </section>
    </>
  );
}

// ------------------------------------------------------------------ Members (staff)

function Members(props: ViewProps) {
  const { members, setMembers, demo, setNotice } = props;
  const [busy, setBusy] = useState("");
  async function save(m: Member, form: HTMLFormElement) {
    if (demo) return setNotice("Sample data is read-only.");
    const data = new FormData(form);
    const plan = String(data.get("plan")) as PlanName;
    const planUntil = String(data.get("planUntil") ?? "");
    setBusy(m.owner);
    try {
      await api.setPlan(m.owner, plan, planUntil);
      setMembers(members.map((x) => (x.owner === m.owner ? { ...x, plan, planUntil: plan === "Free" ? "" : planUntil } : x)));
      setNotice(`${m.name} is now on the ${plan} plan${plan === "Free" ? "" : ` until ${planUntil}`}.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to save");
    }
    setBusy("");
  }
  const list = members.filter((m) => m.role !== "Staff");
  return (
    <>
      <PageHead
        title="Members"
        text="Subscription plans. Take payment outside the app, then record the plan and the date it is paid up to. A plan lapses to Free after that date."
      />
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Member</th>
              <th scope="col">Plan</th>
              <th scope="col">
                <span className="visually-hidden">Change plan</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => {
              const effective = effectivePlan(m.plan, m.planUntil, today());
              return (
                <tr key={m.owner}>
                  <td data-label="Member">
                    <strong>{m.name}</strong>
                    <span className="sub">
                      {m.role}
                      {m.organisation && ` · ${m.organisation}`}
                      {m.email && ` · ${m.email}`}
                    </span>
                  </td>
                  <td data-label="Plan">
                    <Pill tone={effective === "Free" ? "muted" : "brand"}>{effective}</Pill>
                    {m.plan !== "Free" && (
                      <span className="sub">
                        {effective === "Free" ? `${m.plan} lapsed ${m.planUntil || ""}` : `Paid until ${m.planUntil}`}
                      </span>
                    )}
                  </td>
                  <td>
                    <form
                      className="plan-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        save(m, e.currentTarget);
                      }}
                    >
                      <label>
                        <span className="visually-hidden">Plan for {m.name}</span>
                        <select name="plan" defaultValue={m.plan}>
                          {planNames.map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="visually-hidden">Paid until</span>
                        <input type="date" name="planUntil" defaultValue={m.planUntil} />
                      </label>
                      <button className="btn btn-secondary btn-sm" disabled={busy === m.owner}>
                        {busy === m.owner ? "Saving…" : "Save"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!list.length && <p className="muted table-empty">No members yet.</p>}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Plan (members)

function PlanView(props: ViewProps & { planUntil: string }) {
  const { plan, quota, usage, planUntil } = props;
  const cap = (used: number, n: number | null) => (n === null ? `${used} · no limit` : `${used} of ${n}`);
  const contact = site.contact.email || site.contact.phone || site.contact.whatsapp;
  return (
    <>
      <PageHead
        title="Plan"
        text="Subscription gives access to tools and intelligence. Brokerage needs a separate agreed mandate."
      />
      <Metrics
        items={[
          ["Your plan", plan, plan === "Free" ? "Free access" : `Paid until ${planUntil}`],
          ["Active assets", cap(usage.assets, quota.assets)],
          ["Active demands", cap(usage.demands, quota.demands)],
          ["Saved matches this month", `${usage.matches} of ${quota.matches}`],
        ]}
      />
      <PlanCards current={plan} />
      <p className="small">
        To subscribe or change plan, contact the AssetMeet team
        {contact ? (
          <>
            : {site.contact.email && <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>}
            {site.contact.phone && <> · {site.contact.phone}</>}
          </>
        ) : (
          "."
        )}{" "}
        Online payment is not available yet.
      </p>
    </>
  );
}

// ------------------------------------------------------------------ Business: shortlists

function Shortlists(props: ViewProps) {
  const { own, deals, properties, open } = props;
  return (
    <>
      <PageHead title="Shortlists" text="Assets the AssetMeet team has shortlisted for your demands, and matches you asked the Deal Desk to introduce." />
      {own.requirements.length ? (
        own.requirements.map((r) => {
          const list = deals.filter((d) => d.requirementId === r.id);
          return (
            <section className="panel" key={r.id}>
              <div className="panel-head">
                <h2>{r.name}</h2>
                <span className="muted small">{list.length} shortlisted</span>
              </div>
              <p className="facts">{reqFacts(r)}</p>
              {list.length ? (
                list.map((d) => {
                  const p = properties.find((x) => x.id === d.propertyId);
                  if (!p) return null;
                  return (
                    <article className="shortlist-item" key={d.id}>
                      <MatchRow property={p} requirement={r} />
                      <p className="small">
                        <Pill>{d.stage === "Flagged" ? "With the Deal Desk" : d.stage}</Pill>{" "}
                        {p.ownerContact && contactReleased(p)
                          ? `Owner: ${p.ownerContact}`
                          : "Owner details are shared after the owner signs a mandate."}
                      </p>
                    </article>
                  );
                })
              ) : (
                <p className="muted">The team is reviewing assets for this demand. Shortlisted properties will appear here.</p>
              )}
            </section>
          );
        })
      ) : (
        <Empty
          title="No demands yet"
          text="Post a demand and the AssetMeet team will shortlist assets against it."
          action={
            <button className="btn btn-primary" onClick={() => open("requirement")}>
              Post a demand
            </button>
          }
        />
      )}
    </>
  );
}

// ------------------------------------------------------------------ Owner / contributor: interest

function Interest(props: ViewProps) {
  const { own, deals, requirements, role } = props;
  const withInterest = own.properties.filter((p) => deals.some((d) => d.propertyId === p.id));
  return (
    <>
      <PageHead
        title="Interest"
        text={
          role === "Contributor"
            ? "Businesses being matched with properties you recorded, and any rewards approved on collected brokerage."
            : "Businesses being matched with your properties. You approve every introduction."
        }
      />
      {withInterest.length ? (
        withInterest.map((p) => (
          <section className="panel" key={p.id}>
            <div className="panel-head">
              <h2>{p.name}</h2>
              <StatusPill status={p.status} />
            </div>
            <ul className="interest-list">
              {deals
                .filter((d) => d.propertyId === p.id)
                .map((d) => {
                  const r = requirements.find((x) => x.id === d.requirementId);
                  const reward = d.reward ?? 0;
                  return (
                    <li key={d.id}>
                      <div>
                        <strong>{r?.name ?? "A business requirement"}</strong>
                        {r && <span className="sub">{sqft(r.minArea)}–{sqft(r.maxArea)} · {r.transaction}</span>}
                      </div>
                      <Pill>{d.stage === "Flagged" ? "With the Deal Desk" : d.stage}</Pill>
                      {role === "Contributor" && reward > 0 && (d.payoutStatus === "Approved" || d.payoutStatus === "Paid") && (
                        <Pill tone="brand">
                          Reward {d.payoutStatus.toLowerCase()} {inr(reward)}
                        </Pill>
                      )}
                    </li>
                  );
                })}
            </ul>
            {!p.consent && <p className="small warning-text">Owner permission is pending. This deal cannot reach the mandate stage until it is given.</p>}
          </section>
        ))
      ) : (
        <Empty
          title="No interest yet"
          text="When the AssetMeet team matches one of your properties with a business, it will appear here."
          action={
            <a className="btn btn-secondary" href="#assets">
              View your assets
            </a>
          }
        />
      )}
    </>
  );
}
