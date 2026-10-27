"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  HandCoins,
  Handshake,
  LayoutDashboard,
  LogOut,
  Network,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { MarketPill, MatchRow, Score, VerificationPill, Wordmark } from "./brand";
import RecordDialog from "./record-dialog";
import { api, type Row, type Session } from "../lib/api";
import { authClient } from "../lib/auth-client";
import { demoDeals, demoProperties, demoRequirements } from "../lib/demo";
import { inr, priceLabel, sqft } from "../lib/format";
import { match } from "../lib/matching";
import {
  dealStages,
  districts,
  roles,
  type Deal,
  type Kind,
  type Property,
  type Requirement,
  type Role,
} from "../lib/records";

type Tab = "overview" | "requirements" | "properties" | "matches" | "deals" | "rewards" | "shortlists" | "interest";
type DialogState = { kind: Kind; record?: Row; initial?: Partial<Deal> } | null;

const tabInfo: Record<Tab, { label: string; icon: typeof Building2 }> = {
  overview: { label: "Overview", icon: LayoutDashboard },
  requirements: { label: "Requirements", icon: ClipboardList },
  properties: { label: "Properties", icon: Building2 },
  matches: { label: "Matches", icon: Network },
  deals: { label: "Deals", icon: Handshake },
  rewards: { label: "Rewards", icon: HandCoins },
  shortlists: { label: "Shortlists", icon: Search },
  interest: { label: "Interest", icon: Users },
};

const tabsFor: Record<Role, Tab[]> = {
  Staff: ["overview", "requirements", "properties", "matches", "deals", "rewards"],
  Business: ["overview", "requirements", "shortlists"],
  Owner: ["overview", "properties", "interest"],
  Contributor: ["overview", "properties", "interest"],
};

const roleCopy: Record<string, { title: string; text: string }> = {
  Business: { title: "Post your space requirement", text: "Tell us what you need. The AssetMeet team scores properties against your brief and shares a shortlist in your workspace." },
  Owner: { title: "List your property", text: "Record your building or plot, even before it is finished. You approve every introduction." },
  Contributor: { title: "Join as a contributor", text: "Record properties you know about. Your credit is saved from the first entry." },
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
  profile: { role: "Staff", name: "Sample workspace", organisation: "AssetMeet", phone: "", licenseNumber: "", licenseAuthority: "", verification: "Sample" },
};

export default function Workspace({ startRole, demo, signinFailed }: { startRole?: string; demo: boolean; signinFailed: boolean }) {
  const [session, setSession] = useState<Session | null>(demo ? demoSession : null);
  const [rows, setRows] = useState<Row[]>(demo ? [...demoProperties, ...demoRequirements, ...demoDeals] : []);
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
        onDone={async (profile) => {
          setSession({ ...session, profile });
          setRows(await api.records());
        }}
      />
    );
  return <Shell session={session} rows={rows} setRows={setRows} demo={demo} />;
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
  Contributor: ["I'm an engineer, architect or builder", "Record properties you know about and earn on closed deals"],
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
}: {
  session: Session;
  rows: Row[];
  setRows: (r: Row[]) => void;
  demo: boolean;
}) {
  const profile = session.profile!;
  const role = profile.role;
  const tabs = tabsFor[role] ?? tabsFor.Business;
  const [hash, setHash] = useHash();
  const tab: Tab = (tabs as string[]).includes(hash) ? (hash as Tab) : "overview";
  const [dialog, setDialog] = useState<DialogState>(null);
  const [notice, setNotice] = useState("");
  const [selectedReq, setSelectedReq] = useState("");

  const properties = rows.filter((r): r is Property => r.kind === "property");
  const requirements = rows.filter((r): r is Requirement => r.kind === "requirement");
  const deals = rows.filter((r): r is Deal => r.kind === "deal");
  const own = { properties: properties.filter((p) => !p.shared), requirements: requirements.filter((r) => !r.shared) };
  const staff = role === "Staff";

  function open(kind: Kind, record?: Row, initial?: Partial<Deal>) {
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
    setRows([...rows.filter((r) => r.id !== saved.id), saved]);
    setDialog(null);
    setNotice(`${dialog.record ? "Saved changes to" : "Added"} ${String(data.name)}.`);
  }

  async function remove(kind: Kind, row: Row & { name: string }) {
    if (demo) return setNotice("Sample data is read-only.");
    if (!window.confirm(`Delete ${row.name}? This cannot be undone.`)) return;
    try {
      await api.remove(kind, row.id);
      setRows(rows.filter((r) => r.id !== row.id));
      setNotice(`Deleted ${row.name}.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to delete");
    }
  }

  const ctx: ViewProps = { role, properties, requirements, deals, own, open, remove, staff, setHash, selectedReq, setSelectedReq };

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
            <span>{staff ? "AssetMeet team" : role}</span>
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
        {tab === "overview" && <Overview {...ctx} name={profile.name} />}
        {tab === "requirements" && <Requirements {...ctx} />}
        {tab === "properties" && <Properties {...ctx} />}
        {tab === "matches" && <Matches {...ctx} />}
        {tab === "deals" && <Deals {...ctx} />}
        {tab === "rewards" && <Rewards {...ctx} />}
        {tab === "shortlists" && <Shortlists {...ctx} />}
        {tab === "interest" && <Interest {...ctx} />}
      </main>

      <nav className="tabbar" aria-label="Workspace">
        {tabs.map((t) => {
          const Icon = tabInfo[t].icon;
          return (
            <a key={t} href={`#${t}`} aria-current={tab === t ? "page" : undefined}>
              <Icon size={20} aria-hidden="true" />
              <span>{tabInfo[t].label}</span>
            </a>
          );
        })}
      </nav>

      {dialog && (
        <RecordDialog
          kind={dialog.kind}
          record={dialog.record}
          initial={dialog.initial}
          properties={properties}
          requirements={requirements}
          onSave={save}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

type ViewProps = {
  role: Role;
  staff: boolean;
  properties: Property[];
  requirements: Requirement[];
  deals: Deal[];
  own: { properties: Property[]; requirements: Requirement[] };
  open: (kind: Kind, record?: Row, initial?: Partial<Deal>) => void;
  remove: (kind: Kind, row: Row & { name: string }) => void;
  setHash: (h: string) => void;
  selectedReq: string;
  setSelectedReq: (id: string) => void;
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

function RowActions({ onEdit, onDelete, label }: { onEdit: () => void; onDelete: () => void; label: string }) {
  return (
    <div className="row-actions">
      <button className="btn btn-quiet btn-sm" onClick={onEdit} aria-label={`Edit ${label}`}>
        <Pencil size={15} aria-hidden="true" /> Edit
      </button>
      <button className="btn btn-quiet btn-sm btn-danger" onClick={onDelete} aria-label={`Delete ${label}`}>
        <Trash2 size={15} aria-hidden="true" /> Delete
      </button>
    </div>
  );
}

function allMatches(properties: Property[], requirement: Requirement) {
  return properties
    .map((p) => ({ p, m: match(p, requirement) }))
    .filter((x): x is { p: Property; m: NonNullable<ReturnType<typeof match>> } => x.m !== null)
    .sort((a, b) => b.m.score - a.m.score);
}

function Overview(props: ViewProps & { name: string }) {
  const { role, properties, requirements, deals, own, open, staff, setHash, setSelectedReq } = props;
  const due = deals.filter((d) => d.followup && d.followup <= today() && d.stage !== "Closed");
  const pending = own.properties.filter((p) => !p.consent);

  const steps: { text: string; action: React.ReactNode }[] = [];
  if (role === "Business" && !own.requirements.length)
    steps.push({ text: "Post your first space requirement.", action: <button className="btn btn-primary btn-sm" onClick={() => open("requirement")}>Post a requirement</button> });
  if ((role === "Owner" || role === "Contributor") && !own.properties.length)
    steps.push({ text: "Record your first property.", action: <button className="btn btn-primary btn-sm" onClick={() => open("property")}>Add a property</button> });
  if (pending.length && role !== "Business")
    steps.push({ text: `${pending.length} ${pending.length === 1 ? "property needs" : "properties need"} the owner's permission before a deal can move forward.`, action: <a className="btn btn-secondary btn-sm" href="#properties">Review</a> });
  if (staff && due.length)
    steps.push({ text: `${due.length} follow-up${due.length === 1 ? " is" : "s are"} due.`, action: <a className="btn btn-secondary btn-sm" href="#deals">Open deals</a> });
  if (role === "Business" && own.requirements.length && !deals.length)
    steps.push({ text: "The AssetMeet team is reviewing properties against your brief. Shortlisted properties will appear under Shortlists.", action: null });

  const metrics: [string, number | string][] = staff
    ? [["Properties", properties.length], ["Requirements", requirements.length], ["Open deals", deals.filter((d) => d.stage !== "Closed").length], ["Follow-ups due", due.length]]
    : role === "Business"
      ? [["Requirements", own.requirements.length], ["Shortlisted", deals.length]]
      : [["Properties", own.properties.length], ["Permission pending", pending.length], ["Interest", deals.length]];

  const best = staff
    ? requirements
        .flatMap((r) => allMatches(properties, r).slice(0, 2).map((x) => ({ ...x, r })))
        .filter((x) => !deals.some((d) => d.propertyId === x.p.id && d.requirementId === x.r.id))
        .sort((a, b) => b.m.score - a.m.score)
        .slice(0, 4)
    : [];

  return (
    <>
      <PageHead title={`Welcome, ${props.name.split(" ")[0]}`} text={staff ? "Everything across AssetMeet, in one place." : "Your private AssetMeet workspace."} />
      <dl className="metrics">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
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
      {staff && (
        <section className="panel">
          <div className="panel-head">
            <h2>Strongest matches without a deal</h2>
            <a href="#matches">All matches</a>
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
            <p className="muted">No open matches. Add properties or requirements to see them here.</p>
          )}
        </section>
      )}
    </>
  );
}

function reqFacts(r: Requirement) {
  return `${r.district} · ${r.type} · ${r.transaction} · ${sqft(r.minArea)}–${sqft(r.maxArea)} · up to ${priceLabel(r.budget, r.transaction)} · ${r.parking} parking · within ${r.months} months`;
}

function Requirements(props: ViewProps) {
  const { requirements, properties, deals, open, remove, staff, setHash, setSelectedReq } = props;
  const list = staff ? requirements : requirements.filter((r) => !r.shared);
  return (
    <>
      <PageHead
        title="Requirements"
        text={staff ? "Every brief from businesses, with how many properties fit." : "Your space briefs. The AssetMeet team shortlists properties against each one."}
        action={
          <button className="btn btn-primary" onClick={() => open("requirement")}>
            <Plus size={18} aria-hidden="true" /> Add requirement
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
                <h2>{r.name}</h2>
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
                      {fits} matching {fits === 1 ? "property" : "properties"} <ArrowRight size={15} aria-hidden="true" />
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
          title="No requirements yet"
          text="Describe the space you need: district, type, area range, budget, parking and timing."
          action={
            <button className="btn btn-primary" onClick={() => open("requirement")}>
              Post a requirement
            </button>
          }
        />
      )}
    </>
  );
}

function Properties(props: ViewProps) {
  const { properties, open, remove, staff } = props;
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("All districts");
  const list = (staff ? properties : properties.filter((p) => !p.shared)).filter(
    (p) =>
      (district === "All districts" || p.district === district) &&
      `${p.name} ${p.locality}`.toLowerCase().includes(query.toLowerCase()),
  );
  const total = staff ? properties.length : properties.filter((p) => !p.shared).length;
  return (
    <>
      <PageHead
        title="Properties"
        text={staff ? "All recorded properties, including those not yet on the market." : "Properties you have recorded. Nothing here is published."}
        action={
          <button className="btn btn-primary" onClick={() => open("property")}>
            <Plus size={18} aria-hidden="true" /> Add property
          </button>
        }
      />
      {total ? (
        <>
          <div className="toolbar">
            <label className="search">
              <Search size={17} aria-hidden="true" />
              <span className="visually-hidden">Search properties</span>
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
                  <th scope="col">Property</th>
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
                    <td data-label="Property">
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
                        <MarketPill market={p.market} />
                        <VerificationPill level={p.verification} />
                        {p.consent ? (
                          <span className="pill pill-brand">Permission given</span>
                        ) : (
                          <span className="pill pill-warning">Permission pending</span>
                        )}
                      </span>
                    </td>
                    <td>
                      <RowActions label={p.name} onEdit={() => open("property", p)} onDelete={() => remove("property", p)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && <p className="muted table-empty">No properties match these filters.</p>}
          </div>
        </>
      ) : (
        <Empty
          title="No properties yet"
          text="Record a building or plot, even if it is still under construction. Nothing is published."
          action={
            <button className="btn btn-primary" onClick={() => open("property")}>
              Add a property
            </button>
          }
        />
      )}
    </>
  );
}

function Matches(props: ViewProps) {
  const { properties, requirements, deals, open, selectedReq, setSelectedReq, setHash } = props;
  const req = requirements.find((r) => r.id === selectedReq) ?? requirements[0];
  const results = useMemo(() => (req ? allMatches(properties, req) : []), [properties, req]);
  return (
    <>
      <PageHead title="Matches" text="Properties scored against a requirement. A score supports a person's review; it does not certify suitability." />
      {req ? (
        <>
          <div className="toolbar">
            <label className="field inline">
              <span className="field-label">Requirement</span>
              <select value={req.id} onChange={(e) => setSelectedReq(e.target.value)}>
                {requirements.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.district}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted small">{reqFacts(req)}</p>
          </div>
          {results.length ? (
            <div className="match-list">
              {results.map(({ p, m }) => {
                const existing = deals.find((d) => d.propertyId === p.id && d.requirementId === req.id);
                return (
                  <article className="card match-card" key={p.id}>
                    <MatchRow property={p} requirement={req} />
                    <div className="card-foot">
                      <p className="small">
                        {m.outreach ? (
                          <span className="pill pill-warning">Private outreach first</span>
                        ) : (
                          <span className="pill pill-brand">Ready to introduce</span>
                        )}{" "}
                        Owner: {p.ownerContact || "contact not recorded"} · Recorded by {p.source}
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
                              stage: m.outreach ? "Owner outreach" : "Review",
                            })
                          }
                        >
                          Create deal
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty title="No compatible properties" text="No recorded property has the same type and deal type as this requirement." />
          )}
          <p className="footnote">Score weights: location 25, area 20, budget 20, parking 15, possession timeline 10, verification 10.</p>
        </>
      ) : (
        <Empty title="No requirements yet" text="Matches appear once a business posts a requirement." />
      )}
    </>
  );
}

function Deals(props: ViewProps) {
  const { deals, properties, requirements, open } = props;
  const name = (list: { id: string; name: string }[], id: string) => list.find((x) => x.id === id)?.name ?? "Removed record";
  return (
    <>
      <PageHead
        title="Deals"
        text="Every opportunity from review to closing. Deals cannot pass owner outreach without the owner's permission."
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
                const overdue = d.followup && d.followup < today() && stage !== "Closed";
                return (
                  <article className="deal" key={d.id}>
                    <strong>{d.name}</strong>
                    <span className="sub">
                      {name(properties, d.propertyId)} → {name(requirements, d.requirementId)}
                    </span>
                    {d.followup && (
                      <span className={`pill ${overdue ? "pill-warning" : "pill-neutral"}`}>
                        {overdue ? "Overdue · " : "Follow up "}
                        {d.followup}
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

function Rewards(props: ViewProps) {
  const { deals, properties } = props;
  const collected = deals.reduce((s, d) => s + d.collected, 0);
  const rewards = deals.reduce((s, d) => s + (d.collected * d.rewardRate) / 100, 0);
  return (
    <>
      <PageHead title="Rewards" text="Contributor rewards calculated from fees actually collected. These figures do not trigger payments." />
      <dl className="metrics">
        <div>
          <dt>Fees collected</dt>
          <dd>{inr(collected)}</dd>
        </div>
        <div>
          <dt>Contributor rewards</dt>
          <dd>{inr(rewards)}</dd>
        </div>
        <div>
          <dt>Net after rewards</dt>
          <dd>{inr(collected - rewards)}</dd>
        </div>
      </dl>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Deal</th>
              <th scope="col">Contributor</th>
              <th scope="col">Collected</th>
              <th scope="col">Reward rate</th>
              <th scope="col">Reward</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id}>
                <td data-label="Deal">
                  <strong>{d.name}</strong>
                  <span className="sub">{d.stage}</span>
                </td>
                <td data-label="Contributor">{properties.find((p) => p.id === d.propertyId)?.source ?? "—"}</td>
                <td data-label="Collected" className="num">{inr(d.collected)}</td>
                <td data-label="Reward rate" className="num">{d.rewardRate}%</td>
                <td data-label="Reward" className="num">{inr((d.collected * d.rewardRate) / 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!deals.length && <p className="muted table-empty">No deals yet.</p>}
      </div>
    </>
  );
}

function Shortlists(props: ViewProps) {
  const { own, deals, properties, open } = props;
  return (
    <>
      <PageHead title="Shortlists" text="Properties the AssetMeet team has shortlisted for your requirements." />
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
                        <span className="pill pill-neutral">{d.stage}</span>{" "}
                        {p.ownerContact ? `Owner: ${p.ownerContact}` : "Owner details are shared after the mandate is signed."}
                      </p>
                    </article>
                  );
                })
              ) : (
                <p className="muted">The team is reviewing properties for this brief. Shortlisted properties will appear here.</p>
              )}
            </section>
          );
        })
      ) : (
        <Empty
          title="No requirements yet"
          text="Post a requirement and the AssetMeet team will shortlist properties against it."
          action={
            <button className="btn btn-primary" onClick={() => open("requirement")}>
              Post a requirement
            </button>
          }
        />
      )}
    </>
  );
}

function Interest(props: ViewProps) {
  const { own, deals, requirements, role } = props;
  const withInterest = own.properties.filter((p) => deals.some((d) => d.propertyId === p.id));
  return (
    <>
      <PageHead
        title="Interest"
        text={
          role === "Contributor"
            ? "Businesses being matched with properties you recorded, and the rewards earned."
            : "Businesses being matched with your properties. You approve every introduction."
        }
      />
      {withInterest.length ? (
        withInterest.map((p) => (
          <section className="panel" key={p.id}>
            <div className="panel-head">
              <h2>{p.name}</h2>
              <MarketPill market={p.market} />
            </div>
            <ul className="interest-list">
              {deals
                .filter((d) => d.propertyId === p.id)
                .map((d) => {
                  const r = requirements.find((x) => x.id === d.requirementId);
                  const reward = (d.collected * d.rewardRate) / 100;
                  return (
                    <li key={d.id}>
                      <div>
                        <strong>{r?.name ?? "A business requirement"}</strong>
                        {r && <span className="sub">{sqft(r.minArea)}–{sqft(r.maxArea)} · {r.transaction}</span>}
                      </div>
                      <span className="pill pill-neutral">{d.stage}</span>
                      {role === "Contributor" && reward > 0 && <span className="pill pill-brand">Reward {inr(reward)}</span>}
                    </li>
                  );
                })}
            </ul>
            {!p.consent && <p className="small warning-text">Owner permission is pending. This deal cannot move past owner outreach until it is given.</p>}
          </section>
        ))
      ) : (
        <Empty
          title="No interest yet"
          text="When the AssetMeet team matches one of your properties with a business, it will appear here."
          action={
            <a className="btn btn-secondary" href="#properties">
              View your properties
            </a>
          }
        />
      )}
    </>
  );
}
