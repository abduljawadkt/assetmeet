"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  Calendar,
  Check,
  Handshake,
  IndianRupee,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  MapPin,
  Network,
  Plus,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react";
import EngineEntry, { type Engine } from "./entry";
import RecordForm from "./record-form";
import { AssetWordmark, photo } from "./brand";
import { api, type Member, type Row, type Session } from "../lib/api";
import { authClient } from "../lib/auth-client";
import { demoDeals, demoFees, demoMembers, demoOpportunities, demoProperties, demoRequirements } from "../lib/demo";
import { inr, months, priceLabel, sqft } from "../lib/format";
import { match } from "../lib/matching";
import {
  dealStages,
  feeStatuses,
  opportunityStages,
  planNames,
  revenueStreams,
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
  planFeatures,
  plans,
  qualifiedRequirementStatuses,
  rewardFor,
  type Quota,
} from "../lib/rules";

const today = () => new Date().toISOString().slice(0, 10);
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

// ------------------------------------------------------------------ Entry point

const demoSession: Session = {
  authenticated: true,
  name: "Sample workspace",
  profile: { role: "Staff", name: "Sample workspace", organisation: "AssetMeet", phone: "", licenseNumber: "", licenseAuthority: "", verification: "Sample", plan: "Free", planUntil: "" },
};
const demoRows: Row[] = [...demoProperties, ...demoRequirements, ...demoDeals, ...demoOpportunities, ...demoFees];

export default function Workspace({ engine, demo, signinFailed }: { engine: Engine; demo: boolean; signinFailed: boolean }) {
  const [session, setSession] = useState<Session | null>(demo ? demoSession : null);
  const [rows, setRows] = useState<Row[]>(demo ? demoRows : []);
  const [loadError, setLoadError] = useState("");

  async function load() {
    const s = await api.session();
    if (s.profile) setRows(await api.records());
    setSession(s);
  }

  useEffect(() => {
    if (demo) return;
    // Loads the session and records once; state is set after the requests resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch((e: Error) => setLoadError(e.message));
  }, [demo]);

  if (loadError || !session)
    return (
      <main className="engine-entry">
        <header>
          <Link href="/" aria-label="AssetMeet home">
            <AssetWordmark />
          </Link>
          <span>YOUR NEXT CONNECTION STARTS HERE</span>
        </header>
        <div className="entry-loading" role="status">
          {loadError ? (
            <>
              <p>We couldn’t open your workspace. {loadError}</p>
              <button className="outline" onClick={() => window.location.reload()}>
                Try again
              </button>
            </>
          ) : (
            "Opening your workspace…"
          )}
        </div>
      </main>
    );
  if (!session.authenticated || !session.profile)
    return (
      <div className="asset-app public-shell">
        <div className="app-content">
          <EngineEntry initial={engine} authenticated={session.authenticated} name={session.name} signinFailed={signinFailed} onReady={load} />
        </div>
      </div>
    );
  return (
    <Shell
      session={session}
      rows={rows}
      setRows={setRows}
      demo={demo}
      refresh={async () => {
        if (!demo) setSession(await api.session());
      }}
    />
  );
}

// ------------------------------------------------------------------ Boards: one view of properties and requirements

type Board = {
  id: string;
  kind: "asset" | "demand";
  title: string;
  city: string;
  type: string;
  transaction: string;
  area: number;
  maxArea: number;
  price: number;
  status: string;
  live: boolean;
  help: string;
  mine: boolean;
  record: Property | Requirement;
};

function assetStatus(s: string): [string, boolean, string] {
  if (s === "Available" || s === "Mandated") return ["Live", true, "Open to matching"];
  if (s === "In negotiation") return ["In negotiation", true, "Deal in progress"];
  if (s === "Mapped") return ["Private", false, "Not yet offered"];
  if (s === "Owner confirmed") return ["Owner confirmed", false, "Awaiting mandate"];
  return [s, false, "Listing closed"];
}
function demandStatus(s: string): [string, boolean, string] {
  if (qualifiedRequirementStatuses.includes(s)) return ["Live", true, s === "Qualified" || s === "Matching" ? "Being matched" : s];
  if (s === "Draft") return ["In review", false, "Awaiting team review"];
  if (s === "Development lead") return ["Development lead", true, "New project search"];
  return [s, false, s === "Unmet" ? "No suitable asset yet" : "Requirement closed"];
}

function toBoard(r: Property | Requirement): Board {
  if (r.kind === "property") {
    const [status, live, help] = assetStatus(r.status);
    return { id: r.id, kind: "asset", title: r.name, city: r.district, type: r.type, transaction: r.transaction, area: r.area, maxArea: r.area, price: r.price, status, live, help, mine: !r.shared, record: r };
  }
  const [status, live, help] = demandStatus(r.status);
  return { id: r.id, kind: "demand", title: r.name, city: r.district, type: r.type, transaction: r.transaction, area: r.minArea, maxArea: r.maxArea, price: r.budget, status, live, help, mine: !r.shared, record: r };
}

type Fit = { board: Board; score: number; reasons: string[]; hold: boolean };

// ------------------------------------------------------------------ Shell

type Screen =
  | "Dashboard"
  | "My properties"
  | "My requirements"
  | "Introductions"
  | "Market view"
  | "Plan"
  | "Asset Bank"
  | "Demand Bank"
  | "Match Engine"
  | "Deal Desk"
  | "Opportunity Bank"
  | "Revenue"
  | "Members";

const screenIcons: Record<Screen, typeof Building2> = {
  Dashboard: LayoutDashboard,
  "My properties": Building2,
  "My requirements": Search,
  Introductions: Users,
  "Market view": Route,
  Plan: Settings,
  "Asset Bank": Building2,
  "Demand Bank": Search,
  "Match Engine": Network,
  "Deal Desk": Handshake,
  "Opportunity Bank": Lightbulb,
  Revenue: IndianRupee,
  Members: UserCog,
};

const memberScreens: Screen[] = ["Dashboard", "My properties", "My requirements", "Introductions", "Market view", "Plan"];
const staffScreens: Screen[] = ["Dashboard", "Asset Bank", "Demand Bank", "Match Engine", "Deal Desk", "Opportunity Bank", "Revenue", "Members", "Market view"];
const listScreens: Screen[] = ["My properties", "My requirements", "Asset Bank", "Demand Bank"];

const headings: Record<Screen, [string, string]> = {
  Dashboard: ["Your dashboard.", "Your listings, their status, and what needs your attention."],
  "My properties": ["My properties", "Select a property to see its details, introductions and matches."],
  "My requirements": ["My requirements", "Select a requirement to see matching properties and introductions."],
  Introductions: ["Introductions", "Every match the Deal Desk is working on, and the listing behind it."],
  "Market view": ["Market view", "Explore assets and requirements as roadside billboards."],
  Plan: ["Your plan", "Subscription gives access to tools and intelligence. Brokerage needs a separate agreed mandate."],
  "Asset Bank": ["Asset Bank", "Existing buildings, land and spaces: sanctioned, ongoing and completed."],
  "Demand Bank": ["Demand Bank", "Buy, lease, rent, expansion, corporate and investor requirements."],
  "Match Engine": ["Match Engine", "Location, area, budget, technical fit, possession and owner permission."],
  "Deal Desk": ["Deal Desk", "Flag, qualify, sign the mandate, visit, negotiate, close and collect."],
  "Opportunity Bank": ["Opportunity Bank", "No match? Create an opportunity: site search, feasibility and a project proposal."],
  Revenue: ["Revenue", "Recurring, transaction and project income, tracked from pipeline to cash."],
  Members: ["Members", "Subscription plans. Record the plan and the date it is paid up to."],
};

type Panel = { board: Board; tab: string } | { form: Kind; record?: Row; initial?: Record<string, unknown> } | null;

function Shell({ session, rows, setRows, demo, refresh }: { session: Session; rows: Row[]; setRows: (r: Row[]) => void; demo: boolean; refresh: () => Promise<void> }) {
  const profile = session.profile!;
  const role: Role = profile.role;
  const staff = role === "Staff";
  const plan: PlanName = session.plan ?? "Free";
  const quota: Quota = session.quota ?? plans.Free;
  const usage = session.usage ?? { assets: 0, demands: 0, matches: 0 };
  const screens = staff ? staffScreens : memberScreens;
  const [screen, setScreen] = useState<Screen>("Dashboard");
  // Open the screen named in the address (#Revenue) after hydration.
  useEffect(() => {
    const h = decodeURIComponent(window.location.hash.slice(1));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if ((screens as string[]).includes(h)) setScreen(h as Screen);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [panel, setPanel] = useState<Panel>(null);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [wide, setWide] = useState(false);
  const [members, setMembers] = useState<Member[]>(demo ? demoMembers : []);

  useEffect(() => {
    const media = window.matchMedia("(min-width:1100px)");
    const change = () => setWide(media.matches);
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!staff || demo) return;
    api.members().then(setMembers).catch(() => setMembers([]));
  }, [staff, demo]);

  const properties = rows.filter((r): r is Property => r.kind === "property");
  const requirements = rows.filter((r): r is Requirement => r.kind === "requirement");
  const deals = rows.filter((r): r is Deal => r.kind === "deal");
  const opportunities = rows.filter((r): r is Opportunity => r.kind === "opportunity");
  const fees = rows.filter((r): r is Fee => r.kind === "fee");
  const boards = useMemo(() => rows.filter((r): r is Property | Requirement => r.kind === "property" || r.kind === "requirement").map(toBoard), [rows]);
  const own = boards.filter((b) => staff || b.mine);

  // Matches a member may see: owner-approved pool records; the team sees everything.
  function fitsFor(b: Board): Fit[] {
    // A member's own listing is compared with member listings; a member listing with the member's own.
    const others = boards.filter((o) => o.kind !== b.kind && (staff || (b.mine ? o.record.pool || (o.record.shared && !o.mine) : o.mine)));
    return others
      .map((o) => {
        const p = (b.kind === "asset" ? b.record : o.record) as Property;
        const r = (b.kind === "demand" ? b.record : o.record) as Requirement;
        const m = match(p, r);
        return m ? { board: o, score: m.score, reasons: m.reasons, hold: m.hold } : null;
      })
      .filter((x): x is Fit => x !== null)
      .sort((a, z) => z.score - a.score);
  }
  const dealsFor = (b: Board) => deals.filter((d) => (b.kind === "asset" ? d.propertyId : d.requirementId) === b.id);

  const kindOf = (s: Screen) => (s === "My properties" || s === "Asset Bank" ? "asset" : "demand");
  const inline = wide && listScreens.includes(screen) && !(panel && "form" in panel);

  function navigate(next: Screen) {
    setScreen(next);
    setQuery("");
    setFilter("All");
    setNotice("");
    history.replaceState(null, "", `#${encodeURIComponent(next)}`);
    if (wide && listScreens.includes(next)) {
      const first = own.find((b) => b.kind === kindOf(next));
      setPanel(first ? { board: first, tab: "Details" } : null);
    } else setPanel(null);
    window.scrollTo(0, 0);
  }
  function open(b: Board, tab = "Details") {
    if (inline && b.kind !== kindOf(screen) && (staff || b.mine)) setScreen(b.kind === "asset" ? (staff ? "Asset Bank" : "My properties") : staff ? "Demand Bank" : "My requirements");
    setPanel({ board: b, tab });
  }
  function form(kind: Kind, record?: Row, initial?: Record<string, unknown>) {
    if (demo) return setNotice("Sample data is read-only. Sign in to save your own records.");
    setNotice("");
    setPanel({ form: kind, record, initial });
  }

  async function save(kind: Kind, data: Record<string, unknown>, id?: string) {
    const saved = await api.save(kind, data, id);
    const keep = rows.find((r) => r.id === saved.id);
    let next = [...rows.filter((r) => r.id !== saved.id), { ...saved, shared: keep?.shared, pool: keep?.pool } as Row];
    if (kind === "opportunity" && !id)
      next = next.map((r) => (r.kind === "requirement" && r.id === data.requirementId ? { ...r, status: "Development lead" as const } : r));
    setRows(next);
    setNotice(`${id ? "Saved changes to" : "Added"} ${String(data.name)}.`);
    if (kind === "property" || kind === "requirement") {
      const b = toBoard(saved as Property | Requirement);
      if (!id) setScreen(b.kind === "asset" ? (staff ? "Asset Bank" : "My properties") : staff ? "Demand Bank" : "My requirements");
      setPanel({ board: b, tab: "Details" });
    } else setPanel(null);
    refresh();
  }
  async function remove(kind: Kind, row: Row & { name: string }) {
    if (demo) return setNotice("Sample data is read-only.");
    if (!window.confirm(`Delete ${row.name}? This cannot be undone.`)) return;
    try {
      await api.remove(kind, row.id);
      setRows(rows.filter((r) => r.id !== row.id));
      setPanel(null);
      setNotice(`Deleted ${row.name}.`);
      refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to delete");
    }
  }
  async function requestIntro(asset: Board, demand: Board, optIn: boolean) {
    if (demo) return setNotice("Sample data is read-only.");
    const saved = await api.save("deal", { name: `${asset.title} for ${demand.title}`, propertyId: asset.id, requirementId: demand.id, stage: "Flagged", optIn });
    setRows([...rows, { ...saved, shared: true } as Deal]);
    setNotice("Saved. The Deal Desk will review this match and contact you before any introduction.");
    refresh();
  }
  async function signOut() {
    if (!demo) await authClient.signOut();
    window.location.href = "/";
  }

  // Keep the inline detail on a record from the current list.
  useEffect(() => {
    if (!inline) return;
    const list = own.filter((b) => b.kind === kindOf(screen));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!panel || !("board" in panel) || !list.some((b) => b.id === panel.board.id)) setPanel(list[0] ? { board: list[0], tab: "Details" } : null);
  }, [inline, screen, rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const dialog = useRef<HTMLDialogElement>(null);
  const isOpen = !!panel;
  useEffect(() => {
    const d = dialog.current;
    if (!d || !isOpen) return;
    if (inline) {
      d.show();
      return () => d.close();
    }
    d.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      d.close();
    };
  }, [isOpen, inline]);

  const ctx: Ctx = { staff, demo, plan, quota, usage, boards, own, properties, requirements, deals, opportunities, fees, members, setMembers, fitsFor, dealsFor, open, form, remove, navigate, query, setQuery, filter, setFilter, setNotice };
  const [title, lede] = headings[screen];
  const current = panel && "board" in panel ? boards.find((b) => b.id === panel.board.id) ?? panel.board : null;

  return (
    <div className="asset-app public-shell">
      <div className="app-content">
        <header>
          <Link className="logo-button" href="/" aria-label="AssetMeet home">
            <AssetWordmark />
          </Link>
          <button className="outline" onClick={signOut}>
            {demo ? "Exit sample workspace" : "Sign out"}
          </button>
        </header>
        <section className={`hw md-shell ${inline ? "md-split" : ""}`}>
          <aside className="md-sidebar">
            <span className="md-nav-label">{staff ? "ASSETMEET TEAM" : "YOUR WORKSPACE"}</span>
            <nav aria-label="Workspace sections">
              {screens.map((label) => {
                const Icon = screenIcons[label];
                return (
                  <button key={label} aria-current={screen === label ? "page" : undefined} onClick={() => navigate(label)}>
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="md-sidebar-plan">
              {staff ? (
                <>
                  <small>SUBSCRIBERS</small>
                  <b>{paidMembers(members).length} paying</b>
                  <span>{inr(sum(paidMembers(members).map((m) => plans[m.effective].price)))} a month</span>
                  <button onClick={() => navigate("Members")}>
                    Manage members <ArrowRight size={13} />
                  </button>
                </>
              ) : (
                <>
                  <small>CURRENT PLAN</small>
                  <b>{plan}</b>
                  <span>
                    {usage.assets}
                    {quota.assets === null ? "" : `/${quota.assets}`} properties · {usage.demands}/{quota.demands} requirements
                  </span>
                  <button onClick={() => navigate("Plan")}>
                    View plans <ArrowRight size={13} />
                  </button>
                </>
              )}
            </div>
          </aside>
          <div className="md-main">
            <div className="hw-demo">
              <span>
                <i />
                {demo ? "SAMPLE WORKSPACE" : staff ? "ASSETMEET TEAM" : "YOUR WORKSPACE"}
              </span>
              {demo
                ? "Fictional records, shown as the AssetMeet team sees them · Nothing is saved"
                : staff
                  ? "Every property, requirement and deal across AssetMeet"
                  : `${profile.name} · ${plan} plan · Private to your account`}
            </div>
            <header className="md-page-heading">
              <div>
                <span className="hw-eyebrow">ASSETMEET</span>
                <h1>{title}</h1>
                <p>{lede}</p>
              </div>
              <div className="md-create-actions">
                <button className="hw-primary" onClick={() => form("property")}>
                  <Plus size={16} />
                  List a property
                </button>
                <button className="hw-secondary" onClick={() => form("requirement")}>
                  <Plus size={16} />
                  Post a requirement
                </button>
              </div>
            </header>
            {notice && (
              <div className="hw-notice" role="status">
                {notice}
                <button onClick={() => setNotice("")} aria-label="Dismiss notice">
                  <X size={16} />
                </button>
              </div>
            )}
            {screen === "Dashboard" && (staff ? <StaffDashboard {...ctx} /> : <MemberDashboard {...ctx} />)}
            {listScreens.includes(screen) && <Listings {...ctx} kind={kindOf(screen)} selected={current?.id ?? null} />}
            {screen === "Introductions" && <Introductions {...ctx} />}
            {screen === "Market view" && <MarketView {...ctx} />}
            {screen === "Plan" && <PlanScreen {...ctx} planUntil={profile.planUntil} />}
            {screen === "Match Engine" && <MatchEngine {...ctx} />}
            {screen === "Deal Desk" && <DealDesk {...ctx} />}
            {screen === "Opportunity Bank" && <Opportunities {...ctx} />}
            {screen === "Revenue" && <Revenue {...ctx} />}
            {screen === "Members" && <Members {...ctx} />}
            <footer className="md-footnote">Photos are illustrative, not the actual property. Scores support human review; they do not certify suitability.</footer>
          </div>
          <dialog
            ref={dialog}
            aria-label={panel && "form" in panel ? "Record form" : current?.title || "Listing details"}
            className={`hw-dialog ${inline ? "md-inline-detail" : ""}`}
            onCancel={() => setPanel(null)}
            onClick={(e) => {
              if (e.target === e.currentTarget) setPanel(null);
            }}
          >
            <div className="hw-panel">
              <button className="hw-close" onClick={() => setPanel(null)} aria-label="Close panel">
                <X />
              </button>
              {panel && "form" in panel ? (
                <RecordForm
                  key={`${panel.form}-${panel.record?.id ?? "new"}`}
                  kind={panel.form}
                  record={panel.record}
                  initial={panel.initial}
                  staff={staff}
                  properties={properties}
                  requirements={requirements}
                  deals={deals}
                  opportunities={opportunities}
                  onSave={(data) => save(panel.form, data, panel.record?.id)}
                />
              ) : (
                current && (
                  <Detail
                    key={current.id}
                    {...ctx}
                    board={current}
                    tab={panel && "board" in panel ? panel.tab : "Details"}
                    setTab={(t) => setPanel({ board: current, tab: t })}
                    requestIntro={requestIntro}
                  />
                )
              )}
            </div>
          </dialog>
        </section>
      </div>
    </div>
  );
}

type Ctx = {
  staff: boolean;
  demo: boolean;
  plan: PlanName;
  quota: Quota;
  usage: { assets: number; demands: number; matches: number };
  boards: Board[];
  own: Board[];
  properties: Property[];
  requirements: Requirement[];
  deals: Deal[];
  opportunities: Opportunity[];
  fees: Fee[];
  members: Member[];
  setMembers: (m: Member[]) => void;
  fitsFor: (b: Board) => Fit[];
  dealsFor: (b: Board) => Deal[];
  open: (b: Board, tab?: string) => void;
  form: (kind: Kind, record?: Row, initial?: Record<string, unknown>) => void;
  remove: (kind: Kind, row: Row & { name: string }) => void;
  navigate: (s: Screen) => void;
  query: string;
  setQuery: (s: string) => void;
  filter: string;
  setFilter: (s: string) => void;
  setNotice: (s: string) => void;
};

function paidMembers(members: Member[]) {
  return members.map((m) => ({ ...m, effective: effectivePlan(m.plan, m.planUntil, today()) })).filter((m) => m.effective !== "Free");
}
function collectedFor(fees: Fee[], dealId: string) {
  return sum(fees.filter((f) => f.linkKind === "deal" && f.linkId === dealId && f.status === "Collected" && brokerageStreams.includes(f.stream)).map((f) => f.amount));
}
const nameOf = (list: { id: string; name: string }[], id: string) => list.find((x) => x.id === id)?.name ?? "Removed record";

// ------------------------------------------------------------------ Shared pieces

function StatusTag({ b }: { b: Board }) {
  return <span className={`md-status ${b.live ? "active" : ""}`}>{b.status}</span>;
}

function BoardTable({ rows, kind, ctx }: { rows: Board[]; kind: string; ctx: Ctx }) {
  return (
    <div className="md-table-wrap">
      <table className="md-table">
        <thead>
          <tr>
            <th>{kind}</th>
            <th>Status</th>
            <th>Matches</th>
            <th>Introductions</th>
            <th>{kind === "Property" ? "Price" : "Budget"}</th>
            <th>Next step</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const fits = ctx.fitsFor(b).length;
            const intros = ctx.dealsFor(b).length;
            const pending = b.kind === "asset" && !(b.record as Property).consent;
            return (
              <tr key={b.id}>
                <td>
                  <button className="md-record" onClick={() => ctx.open(b)}>
                    <img src={photo(b.type, 200)} alt="" />
                    <span>
                      <strong>{b.title}</strong>
                      <small>
                        {b.city} · {b.transaction} · {sqft(b.area)}
                        {b.kind === "demand" ? `–${sqft(b.maxArea)}` : ""}
                      </small>
                    </span>
                  </button>
                </td>
                <td>
                  <StatusTag b={b} />
                  <small className="md-status-help">{b.help}</small>
                </td>
                <td>
                  <button className="md-count" onClick={() => ctx.open(b, "Matches")}>
                    {fits}
                    <small>View matches</small>
                  </button>
                </td>
                <td>
                  <button className="md-count" onClick={() => ctx.open(b, "Introductions")}>
                    {intros}
                    <small>{intros ? "With the Deal Desk" : "None yet"}</small>
                  </button>
                </td>
                <td>{priceLabel(b.price, b.transaction)}</td>
                <td>
                  <button className="md-row-action" onClick={() => ctx.open(b, pending ? "Details" : fits ? "Matches" : "Details")}>
                    {pending ? "Add permission" : fits ? "Review matches" : "Manage"} <ArrowRight size={13} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && <p className="md-empty">Nothing here yet. Use the buttons above to add your first record.</p>}
    </div>
  );
}

function Group({ rows, title, target, kind, ctx }: { rows: Board[]; title: string; target: Screen; kind: string; ctx: Ctx }) {
  return (
    <section className="md-section">
      <div className="md-section-head">
        <div>
          <h2>{title}</h2>
          <p>
            {rows.length} total · {rows.filter((b) => b.live).length} live · {rows.filter((b) => !b.live).length} private, in review or closed
          </p>
        </div>
        <button onClick={() => ctx.navigate(target)}>
          View all <ArrowRight size={15} />
        </button>
      </div>
      <BoardTable rows={rows.slice(0, 3)} kind={kind} ctx={ctx} />
    </section>
  );
}

type Alert = { b?: Board; icon: typeof Bell; title: string; text: string; tab?: string; go?: Screen };

function Attention({ items, ctx, empty }: { items: Alert[]; ctx: Ctx; empty: string }) {
  return (
    <section className="md-attention">
      <div>
        <h2>Needs your attention</h2>
        <p>{items.length ? `${items.length} ${items.length === 1 ? "item needs" : "items need"} a next step.` : empty}</p>
      </div>
      <div>
        {items.slice(0, 6).map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.title + a.text} onClick={() => (a.b ? ctx.open(a.b, a.tab) : a.go && ctx.navigate(a.go))}>
              <span className="md-alert-icon">
                <Icon size={18} />
              </span>
              <span>
                <b>{a.title}</b>
                <small>{a.text}</small>
              </span>
              <ArrowRight size={16} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Summary({ items }: { items: [typeof Bell, string, React.ReactNode, string, (() => void) | null][] }) {
  return (
    <div className="md-summary">
      {items.map(([Icon, label, value, detail, go]) => (
        <button key={label} onClick={go ?? undefined} className={go ? "" : "am-static"} tabIndex={go ? undefined : -1}>
          <span>
            <Icon size={18} />
            {label}
          </span>
          <strong>{value}</strong>
          <small>
            {detail}
            {go && <ArrowRight size={14} />}
          </small>
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ Member dashboard

function MemberDashboard(ctx: Ctx) {
  const { own, plan, quota, usage, deals, navigate } = ctx;
  const props = own.filter((b) => b.kind === "asset");
  const reqs = own.filter((b) => b.kind === "demand");
  const matchCount = plan === "Free" ? null : sum(own.map((b) => ctx.fitsFor(b).length));
  const alerts: Alert[] = [
    ...props.filter((b) => !(b.record as Property).consent).map((b) => ({ b, icon: ShieldCheck, title: b.title, text: "Property · Owner permission pending" })),
    ...reqs.filter((b) => (b.record as Requirement).status === "Draft").map((b) => ({ b, icon: Search, title: b.title, text: "Requirement · Awaiting team review" })),
    ...own.flatMap((b) =>
      ctx
        .dealsFor(b)
        .filter((d) => !["Flagged", "Closed", "Dropped"].includes(d.stage))
        .map((d) => ({ b, icon: Calendar, title: b.title, text: `Introduction · ${d.stage}`, tab: "Introductions" })),
    ),
  ];
  if (plan === "Free") alerts.push({ icon: Network, title: "Run matches yourself", text: "Self-service matching is part of a paid plan", go: "Plan" });
  return (
    <div className="md-content">
      <Summary
        items={[
          [Building2, "My properties", props.length, `${props.filter((b) => b.live).length} live${quota.assets === null ? "" : ` · ${usage.assets}/${quota.assets} active`}`, () => navigate("My properties")],
          [Search, "My requirements", reqs.length, `${reqs.filter((b) => b.live).length} live · ${usage.demands}/${quota.demands} active`, () => navigate("My requirements")],
          [Users, "Introductions", deals.length, "With the Deal Desk", () => navigate("Introductions")],
          [Network, "Potential matches", matchCount ?? "—", matchCount === null ? "Available on paid plans" : `${usage.matches}/${quota.matches} saved this month`, () => navigate(matchCount === null ? "Plan" : "Market view")],
        ]}
      />
      <Attention items={alerts} ctx={ctx} empty="You are up to date. Nothing is waiting on you." />
      <Group rows={props} title="My properties" target="My properties" kind="Property" ctx={ctx} />
      <Group rows={reqs} title="My requirements" target="My requirements" kind="Requirement" ctx={ctx} />
    </div>
  );
}

// ------------------------------------------------------------------ Staff dashboard

function StaffDashboard(ctx: Ctx) {
  const { properties, requirements, deals, opportunities, fees, members, navigate, own } = ctx;
  const paid = paidMembers(members);
  const mrr = sum(paid.map((m) => plans[m.effective].price));
  const confirmed = properties.filter((p) => !["Mapped", "Withdrawn"].includes(p.status));
  const qualified = requirements.filter((r) => qualifiedRequirementStatuses.includes(r.status));
  const live = deals.filter((d) => d.stage !== "Dropped");
  const advanced = live.filter((d) => d.stage !== "Flagged");
  const mandated = live.filter((d) => d.mandateSigned);
  const byStatus = (s: string) => sum(fees.filter((f) => f.status === s).map((f) => f.amount));
  const rewards = deals.map((d) => ({ d, reward: rewardFor(d.rewardRate, collectedFor(fees, d.id)) }));
  const board = (id: string) => own.find((b) => b.id === id);
  const due = (x: { followup: string; stage: string }) => x.followup && x.followup <= today() && !["Closed", "Dropped", "Delivered / leased"].includes(x.stage);
  const alerts: Alert[] = [
    ...deals.filter(due).map((d) => ({ b: board(d.propertyId), icon: Calendar, title: d.name, text: `Deal Desk · Follow-up due ${d.followup}`, tab: "Introductions" })),
    ...opportunities.filter(due).map((o) => ({ icon: Lightbulb, title: o.name, text: `Opportunity · Follow-up due ${o.followup}`, go: "Opportunity Bank" as Screen })),
    ...properties
      .filter((p) => deskSignals(p).some((s) => s.label === "High value") && !deals.some((d) => d.propertyId === p.id))
      .map((p) => ({ b: board(p.id), icon: Bell, title: p.name, text: "Property · High value: Deal Desk review" })),
    ...requirements
      .filter((r) => r.status === "Unmet" && !opportunities.some((o) => o.requirementId === r.id))
      .map((r) => ({ icon: Lightbulb, title: r.name, text: "Requirement · Unmet: create an opportunity", go: "Opportunity Bank" as Screen })),
    ...requirements.filter((r) => r.status === "Draft").map((r) => ({ b: board(r.id), icon: Search, title: r.name, text: "Requirement · Awaiting qualification" })),
  ];
  return (
    <div className="md-content">
      <Summary
        items={[
          [Users, "Active subscribers", paid.length, `${inr(mrr)} recurring a month`, () => navigate("Members")],
          [Building2, "Owner-confirmed assets", confirmed.length, `${properties.filter((p) => p.verification === "Verified").length} with verified documents`, () => navigate("Asset Bank")],
          [Search, "Qualified demands", qualified.length, `of ${requirements.length} posted`, () => navigate("Demand Bank")],
          [Network, "Useful match rate", pct(advanced.length, live.length), "Flagged matches advanced", () => navigate("Deal Desk")],
        ]}
      />
      <Summary
        items={[
          [Handshake, "Mandate conversion", pct(mandated.length, advanced.length), `${mandated.length} signed ${mandated.length === 1 ? "mandate" : "mandates"}`, () => navigate("Deal Desk")],
          [IndianRupee, "Cash collected", inr(byStatus("Collected")), `${inr(byStatus("Invoiced"))} invoiced`, () => navigate("Revenue")],
          [Lightbulb, "Development pipeline", opportunities.filter((o) => !["Dropped", "Delivered / leased"].includes(o.stage)).length, "Active opportunities", () => navigate("Opportunity Bank")],
          [UserCog, "Reward liability", inr(sum(rewards.filter((x) => x.d.payoutStatus === "Approved").map((x) => x.reward))), "Approved, unpaid", () => navigate("Revenue")],
        ]}
      />
      <Attention items={alerts} ctx={ctx} empty="You are up to date. No follow-ups due." />
      <Group rows={own.filter((b) => b.kind === "asset")} title="Asset Bank" target="Asset Bank" kind="Property" ctx={ctx} />
      <Group rows={own.filter((b) => b.kind === "demand")} title="Demand Bank" target="Demand Bank" kind="Requirement" ctx={ctx} />
    </div>
  );
}

// ------------------------------------------------------------------ Listings (list + detail)

function Filters({ ctx, count, statuses }: { ctx: Ctx; count: number; statuses: string[] }) {
  return (
    <div className="md-filters">
      <label>
        <Search size={17} />
        <input aria-label="Search listings" placeholder="Search listing or location" value={ctx.query} onChange={(e) => ctx.setQuery(e.target.value)} />
      </label>
      <select aria-label="Status filter" value={ctx.filter} onChange={(e) => ctx.setFilter(e.target.value)}>
        {["All", ...statuses].map((s) => (
          <option key={s} value={s}>
            {s === "All" ? "All statuses" : s}
          </option>
        ))}
      </select>
      <span>{count} listings</span>
    </div>
  );
}

const matchesQuery = (b: Board, q: string) => `${b.title} ${b.city} ${b.type}`.toLowerCase().includes(q.toLowerCase());

function Listings(props: Ctx & { kind: "asset" | "demand"; selected: string | null }) {
  const { own, kind, query, filter, selected, open } = props;
  const list = own.filter((b) => b.kind === kind);
  const statuses = [...new Set(list.map((b) => b.status))];
  const visible = list.filter((b) => (filter === "All" || b.status === filter) && matchesQuery(b, query));
  return (
    <div className="md-content">
      <Filters ctx={props} count={visible.length} statuses={statuses} />
      <div className="md-listings">
        {visible.map((b) => {
          const intros = props.dealsFor(b).length;
          const pending = b.kind === "asset" && !(b.record as Property).consent;
          return (
            <button className={`md-listing ${selected === b.id ? "selected" : ""}`} key={b.id} onClick={() => open(b)} aria-pressed={selected === b.id}>
              <img src={photo(b.type, 400)} alt="Illustrative property" />
              <span className="md-listing-copy">
                <StatusTag b={b} />
                <strong>{b.title}</strong>
                <small>
                  {b.city} · {b.transaction} · {sqft(b.area)}
                  {b.kind === "demand" ? `–${sqft(b.maxArea)}` : ""}
                </small>
                <span className="md-listing-stats">
                  {props.fitsFor(b).length} matches · {intros} {intros === 1 ? "introduction" : "introductions"}
                </span>
                {pending && <em>Owner permission pending</em>}
              </span>
              <ArrowRight size={16} />
            </button>
          );
        })}
        {!visible.length && (
          <p className="md-empty">
            {list.length ? "No listings match this search or status." : kind === "asset" ? "No properties yet. List your first property above." : "No requirements yet. Post your first requirement above."}
          </p>
        )}
      </div>
    </div>
  );
}

function Detail(props: Ctx & { board: Board; tab: string; setTab: (t: string) => void; requestIntro: (a: Board, d: Board, optIn: boolean) => Promise<void> }) {
  const { board: b, tab, setTab, staff, form, remove, plan } = props;
  const editable = staff || b.mine;
  const intros = props.dealsFor(b);
  const fits = props.fitsFor(b);
  const p = b.kind === "asset" ? (b.record as Property) : null;
  const r = b.kind === "demand" ? (b.record as Requirement) : null;
  const [asking, setAsking] = useState<string | null>(null);
  const [optIn, setOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const facts: [string, React.ReactNode][] = p
    ? [
        ["Construction", p.construction],
        ["Status", p.status],
        ["Documents", p.verification],
        ["Who can see it", p.visibility],
        ["Owner permission", p.consent ? "Given" : "Pending"],
        ["Ready", months(p.months)],
        ["Parking", `${p.parking} spaces`],
        ...(editable ? ([["Recorded by", p.source || "—"]] as [string, string][]) : []),
        ...(editable || contactReleased(p) ? ([["Owner contact", p.ownerContact || "Not recorded"]] as [string, string][]) : []),
      ]
    : [
        ["Status", r!.status],
        ["Needed within", `${r!.months} months`],
        ["Parking needed", `${r!.parking} spaces`],
        ["Type", `${r!.type} · ${r!.transaction}`],
      ];
  return (
    <>
      <div className="hw-panel-heading">
        <span className="hw-eyebrow">
          {b.kind === "asset" ? "PROPERTY" : "REQUIREMENT"} · {editable ? (staff && !b.mine ? "MEMBER RECORD" : "YOUR LISTING") : "MEMBER LISTING"}
        </span>
        <h2>{b.title}</h2>
        <p>
          {b.city} · {b.type} · {b.transaction}
        </p>
      </div>
      <div className="hw-tabs">
        {["Details", "Introductions", "Matches"].map((t) => (
          <button className={tab === t ? "selected" : ""} aria-pressed={tab === t} key={t} onClick={() => setTab(t)}>
            {t}
            {t === "Introductions" && intros.length ? ` (${intros.length})` : ""}
            {t === "Matches" && fits.length && (staff || plan !== "Free") ? ` (${fits.length})` : ""}
          </button>
        ))}
      </div>
      {tab === "Details" && (
        <>
          <img className="hw-detail-image" src={photo(b.type)} alt="Illustrative photograph, not the actual property" />
          <div className="hw-detail-values">
            <div>
              <small>{b.kind === "asset" ? "Asking price" : "Budget"}</small>
              <strong>{priceLabel(b.price, b.transaction)}</strong>
            </div>
            <div>
              <small>Area</small>
              <strong>
                {sqft(b.area)}
                {b.kind === "demand" ? `–${sqft(b.maxArea)}` : ""}
              </strong>
            </div>
          </div>
          <dl className="am-facts">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {p && staff && deskSignals(p).length > 0 && (
            <div className="am-signals">
              {deskSignals(p).map((s) => (
                <span key={s.label} className={`am-signal ${s.tone}`}>
                  <b>{s.label}</b> {s.action}
                </span>
              ))}
            </div>
          )}
          {p && !p.consent && editable && <p className="hw-fine">Owner permission is pending. This property stays private and no deal can reach the mandate stage until it is given.</p>}
          {editable ? (
            <div className="hw-actions">
              <button className="hw-primary" onClick={() => form(b.kind === "asset" ? "property" : "requirement", b.record)}>
                Edit {b.kind === "asset" ? "property" : "requirement"}
              </button>
              <button className="hw-secondary" onClick={() => remove(b.kind === "asset" ? "property" : "requirement", b.record)}>
                <Trash2 size={15} /> Delete
              </button>
            </div>
          ) : (
            <p className="hw-fine">
              {b.kind === "asset"
                ? "Shown with the owner’s permission. The owner’s identity and contact are released only through the Deal Desk under a signed mandate."
                : "A qualified business requirement. The business’s name is released only through the Deal Desk."}
            </p>
          )}
        </>
      )}
      {tab === "Introductions" && (
        <>
          <h3>Introductions</h3>
          <p>The Deal Desk runs every introduction. Names are released only with permission.</p>
          {intros.map((d) => (
            <div className="hw-visit" key={d.id}>
              <Handshake size={20} />
              <span>
                <b>{staff ? d.name : b.kind === "asset" ? "A business" : "A property owner"}</b>
                <small>
                  {d.stage === "Flagged" ? "With the Deal Desk for review" : d.stage}
                  {staff && d.nextAction ? ` · ${d.nextAction}` : ""}
                </small>
              </span>
              {staff && <button onClick={() => form("deal", d)}>Update</button>}
            </div>
          ))}
          {!intros.length && <div className="hw-empty">No introductions yet. {plan === "Free" && !staff ? "The AssetMeet team shortlists matches for you." : "Start one from the Matches tab."}</div>}
        </>
      )}
      {tab === "Matches" && (
        <>
          <h3>Fit comes first.</h3>
          <p>Explainable rules, not a connected AI model. Subscription does not affect ranking.</p>
          {!staff && plan === "Free" ? (
            <div className="hw-empty">Self-service matching is part of a paid plan. The AssetMeet team still reviews matches for you and shares them under Introductions.</div>
          ) : (
            <>
              {fits.map((m) => {
                const asset = b.kind === "asset" ? b : m.board;
                const demand = b.kind === "demand" ? b : m.board;
                const existing = props.deals.some((d) => d.propertyId === asset.id && d.requirementId === demand.id);
                return (
                  <div key={m.board.id} className="am-match-wrap">
                    <button className="hw-match" onClick={() => props.open(m.board)}>
                      <span className="hw-match-score">
                        {m.score}
                        <small>FIT</small>
                      </span>
                      <span>
                        <b>{m.board.title}</b>
                        <small>{m.reasons.join(" · ")}</small>
                      </span>
                      <ArrowUpRight size={18} />
                    </button>
                    {existing ? (
                      <span className="am-match-state">
                        <Check size={14} /> With the Deal Desk
                      </span>
                    ) : staff ? (
                      <button
                        className="am-match-action"
                        onClick={() =>
                          form("deal", undefined, {
                            name: `${asset.title} · ${demand.title}`,
                            propertyId: asset.id,
                            requirementId: demand.id,
                            stage: m.hold || !(asset.record as Property).consent ? "Flagged" : "Qualified",
                            leadSource: "Staff match",
                            value: asset.price,
                          })
                        }
                      >
                        Send to Deal Desk <ArrowRight size={14} />
                      </button>
                    ) : asking === m.board.id ? (
                      <form
                        className="am-intro"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setBusy(true);
                          try {
                            await props.requestIntro(asset, demand, optIn);
                            setAsking(null);
                          } catch (err) {
                            props.setNotice(err instanceof Error ? err.message : "Unable to save");
                          }
                          setBusy(false);
                        }}
                      >
                        <label>
                          <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />I would like AssetMeet to represent me. Brokerage is charged only under a separate written agreement.
                        </label>
                        <div>
                          <button type="button" className="hw-secondary" onClick={() => setAsking(null)}>
                            Cancel
                          </button>
                          <button className="hw-primary" disabled={busy}>
                            {busy ? "Saving…" : "Request introduction"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button className="am-match-action" disabled={props.usage.matches >= props.quota.matches} onClick={() => setAsking(m.board.id)}>
                        Request introduction <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
              {!fits.length && <div className="hw-empty">No compatible listings yet. New {b.kind === "asset" ? "requirements" : "properties"} are added as the network grows.</div>}
              <p className="hw-fine">
                Score out of 100: location 25, area 20, budget 20, parking 15, readiness 10, owner confirmation 10.
                {!staff && ` ${props.usage.matches} of ${props.quota.matches} saved matches used this month.`} All matches need human review.
              </p>
            </>
          )}
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Introductions

function Introductions(ctx: Ctx) {
  const { own, query, filter, staff } = ctx;
  const withIntros = own.filter((b) => ctx.dealsFor(b).length && (b.kind === "asset" || !staff));
  const visible = withIntros.filter((b) => (filter === "All" || b.status === filter) && matchesQuery(b, query));
  return (
    <div className="md-content">
      <Filters ctx={ctx} count={visible.length} statuses={[...new Set(withIntros.map((b) => b.status))]} />
      <div className="md-explainer">
        <Handshake size={20} />
        <div>
          <b>A match is a start. The Deal Desk makes the introduction.</b>
          <p>Names are released only with permission. Owner contact details reach a business only after the owner signs a mandate.</p>
        </div>
      </div>
      <div className="md-people">
        {visible.map((b) => (
          <section key={b.id}>
            <div className="md-section-head">
              <div>
                <small className="md-kind">{b.kind === "asset" ? "PROPERTY" : "REQUIREMENT"}</small>
                <h3>{b.title}</h3>
                <p>
                  {b.city} · <StatusTag b={b} />
                </p>
              </div>
              <span className="md-visitor-total">
                <Handshake size={15} />
                {ctx.dealsFor(b).length} introductions
              </span>
            </div>
            {ctx.dealsFor(b).map((d) => {
              const who = staff ? d.name : b.kind === "asset" ? "A business" : "A property owner";
              return (
                <button className="md-person" key={d.id} onClick={() => ctx.open(b, "Introductions")}>
                  <span className="md-avatar">{who[0]}</span>
                  <span>
                    <b>{who}</b>
                    <small>{d.stage === "Flagged" ? "With the Deal Desk for review" : `Stage: ${d.stage}`}</small>
                  </span>
                  <span className="md-person-action">
                    Open details <ArrowRight size={14} />
                  </span>
                </button>
              );
            })}
            <div className="md-people-footer">
              <span>{b.kind === "asset" ? ((b.record as Property).consent ? "Owner permission given" : "Owner permission pending") : b.help}</span>
              <button onClick={() => ctx.open(b, "Matches")}>View matches</button>
            </div>
          </section>
        ))}
      </div>
      {!visible.length && <p className="md-empty">No introductions yet. When a match moves to the Deal Desk, it appears here.</p>}
    </div>
  );
}

// ------------------------------------------------------------------ Market view (highway)

function BoardCard({ b, ctx }: { b: Board; ctx: Ctx }) {
  const fits = ctx.fitsFor(b).length;
  const intros = ctx.dealsFor(b).length;
  const rec = b.record;
  const pending = b.kind === "asset" && !(rec as Property).consent;
  return (
    <article className={`hw-board small ${b.kind} ${b.live ? "" : "muted-board"}`}>
      <div className="hw-board-media">
        <img src={photo(b.type, 700)} alt={`${b.type} illustration, not the actual property`} />
        <span className="hw-type">{b.kind === "asset" ? "LAB · ASSET" : "LDB · WANTED"}</span>
      </div>
      <div className="hw-board-copy">
        <div className="hw-board-top">
          <span className={`hw-status ${b.live ? "active" : ""}`}>
            <i />
            {b.status}
          </span>
          {b.mine || ctx.staff ? (
            pending && (
              <button className="hw-alert" onClick={() => ctx.open(b)}>
                <Bell size={13} />
                Permission
              </button>
            )
          ) : (
            <span className="hw-alert">Member</span>
          )}
        </div>
        <button className="hw-title" onClick={() => ctx.open(b)}>
          {b.title}
          <ArrowUpRight size={17} />
        </button>
        <p>
          <MapPin size={12} />
          {b.city} · {b.area.toLocaleString("en-IN")}
          {b.kind === "demand" ? `–${b.maxArea.toLocaleString("en-IN")}` : ""} sq.ft
        </p>
        <div className="hw-price">
          {inr(b.price)}
          <small>
            {b.transaction === "Lease" || b.transaction === "Rent" ? " / month" : ""} · {b.transaction}
          </small>
        </div>
        <div className="hw-board-stats">
          <button onClick={() => ctx.open(b, "Matches")}>
            <Network size={14} />
            <b>{fits}</b>
            <small>Matches</small>
          </button>
          <button onClick={() => ctx.open(b, "Introductions")}>
            <Handshake size={14} />
            <b>{intros}</b>
            <small>Introductions</small>
          </button>
          <span>
            <Calendar size={14} />
            <b>{b.kind === "asset" ? (rec as Property).months : (rec as Requirement).months}</b>
            <small>{b.kind === "asset" ? "Months to ready" : "Needed in (mo)"}</small>
          </span>
        </div>
        <div className="hw-card-actions">
          <button onClick={() => ctx.open(b)}>
            View details <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

function MarketView(ctx: Ctx) {
  const { boards, staff, query, setQuery, filter, setFilter, own } = ctx;
  const [mode, setMode] = useState("Road");
  const market = staff ? boards : boards.filter((b) => b.mine || b.record.pool);
  const visible = market.filter((b) => (filter === "All" || (filter === "Live" ? b.live : filter === "Yours" ? b.mine : !b.mine)) && matchesQuery(b, query));
  const pairs = sum(market.filter((b) => b.kind === "asset").map((b) => ctx.fitsFor(b).filter((f) => market.includes(f.board)).length));
  const signals = own.flatMap((b) =>
    ctx
      .dealsFor(b)
      .filter((d) => !["Closed", "Dropped"].includes(d.stage) && (b.kind === "asset" || !staff))
      .map((d) => ({ b, d })),
  );
  return (
    <>
      <div className="hw-controls">
        <div className="hw-switch" aria-label="Market view">
          {["Road", "List"].map((m) => (
            <button key={m} aria-pressed={mode === m} className={mode === m ? "selected" : ""} onClick={() => setMode(m)}>
              {m === "Road" ? <Route size={16} /> : <LayoutGrid size={16} />} {m} view
            </button>
          ))}
        </div>
        <label className="hw-search">
          <Search size={16} />
          <input aria-label="Search market boards" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a place or property…" />
        </label>
        <select aria-label="Filter boards" value={filter} onChange={(e) => setFilter(e.target.value)}>
          {(staff ? ["All", "Live"] : ["All", "Live", "Yours", "Members"]).map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </div>
      <div className="hw-legend">
        <span>
          <i className="green" />
          Live
        </span>
        <span>
          <i className="amber" />
          Needs a step
        </span>
        <span>
          <i />
          Private / closed
        </span>
        <span className="hw-allowance">{staff ? "Every listing across AssetMeet" : ctx.plan === "Free" ? "Your listings · member listings appear on paid plans" : "Your listings and owner-approved member listings"}</span>
      </div>
      <div className={`hw-market ${mode === "List" ? "list-view" : ""}`}>
        {(["asset", "demand"] as const).map((kind, i) => (
          <section className="hw-lane" key={kind}>
            <div className="hw-lane-title">
              <span className="hw-lane-number">0{i + 1}</span>
              <div>
                <h2>{kind === "asset" ? "Asset Highway" : "Demand Highway"}</h2>
                <p>
                  {kind === "asset" ? "LAB · Live Asset Boards" : "LDB · Live Demand Boards"} <span> / {visible.filter((b) => b.kind === kind).length} boards</span>
                </p>
              </div>
              <span className="hw-direction">{kind === "asset" ? "ASSETS →" : "← REQUIREMENTS"}</span>
            </div>
            <div className="hw-boards">
              {visible
                .filter((b) => b.kind === kind)
                .map((b) => (
                  <BoardCard key={b.id} b={b} ctx={ctx} />
                ))}
              {!visible.some((b) => b.kind === kind) && <p className="hw-empty">No boards match this view. Change your search or filter.</p>}
            </div>
            {mode === "Road" && (
              <div className="hw-road" aria-hidden="true">
                <span />
                <b>{kind === "asset" ? "ASSET HIGHWAY →" : "← DEMAND HIGHWAY"}</b>
                <span />
              </div>
            )}
            {i === 0 && (
              <div className="hw-connector">
                <Network size={18} />
                <span>{pairs} compatible connections between the lanes</span>
                <small>Location · Type · Area · Budget — plan never changes fit</small>
              </div>
            )}
          </section>
        ))}
      </div>
      <section className="hw-signals">
        <div>
          <span className="hw-eyebrow">YOUR NEXT MOVE</span>
          <h2>Live signals.</h2>
          <p>Every introduction belongs to a board. Follow it there.</p>
        </div>
        <div>
          {signals.map(({ b, d }) => (
            <button key={d.id} onClick={() => ctx.open(b, "Introductions")}>
              <span className="hw-signal-icon">
                <Bell size={18} />
              </span>
              <span>
                <b>{b.title}</b>
                <small>
                  {d.stage === "Flagged" ? "With the Deal Desk" : d.stage}
                  {staff && d.followup ? ` · follow up ${d.followup}` : ""}
                </small>
              </span>
              <ArrowUpRight size={18} />
            </button>
          ))}
          {!signals.length && <p>All caught up. New introductions will appear here.</p>}
        </div>
      </section>
    </>
  );
}

// ------------------------------------------------------------------ Plan

function PlanScreen(ctx: Ctx & { planUntil: string }) {
  const { plan, quota, usage, planUntil } = ctx;
  const paid = ["Connect", "Professional", "Corporate"] as const;
  return (
    <section className="md-settings">
      <h2>Your subscription</h2>
      <p>
        You are on the <b>{plan}</b> plan{plan !== "Free" && planUntil ? `, paid until ${planUntil}` : ""}. Plans change your tools and limits. They never change match scores, and no plan unlocks owner contacts.
      </p>
      <div className="md-plan-table">
        <table>
          <tbody>
            <tr>
              <td>Active properties</td>
              <td>
                {usage.assets}
                {quota.assets === null ? " · no limit" : ` of ${quota.assets}`}
              </td>
            </tr>
            <tr>
              <td>Active requirements</td>
              <td>
                {usage.demands} of {quota.demands}
              </td>
            </tr>
            <tr>
              <td>Saved matches this month</td>
              <td>
                {usage.matches} of {quota.matches}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3>Plans</h3>
      <div className="md-plan-table">
        <table>
          <thead>
            <tr>
              <th>Plan</th>
              <th>Properties</th>
              <th>Requirements</th>
              <th>Saved matches / month</th>
              <th>Logins</th>
            </tr>
          </thead>
          <tbody>
            {paid.map((p) => (
              <tr key={p} className={p === plan ? "am-current" : ""}>
                <td>
                  {p} · ₹{plans[p].price.toLocaleString("en-IN")}
                </td>
                <td>{plans[p].assets}</td>
                <td>{plans[p].demands}</td>
                <td>{plans[p].matches}</td>
                <td>{plans[p].logins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>How access differs</h3>
      <div className="md-plan-table">
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              {paid.map((p) => (
                <th key={p}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planFeatures.map(([f, ...cells]) => (
              <tr key={f}>
                <td>{f}</td>
                {cells.map((c, i) => (
                  <td key={i}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hw-fine">
        Pilot pricing, billed monthly, excluding GST. To subscribe or change plan, contact the AssetMeet team; online payment is not available yet. Brokerage, sourcing and advisory fees are separate and agreed in writing for each mandate.
      </p>
    </section>
  );
}

// ------------------------------------------------------------------ Staff: Match Engine

function MatchEngine(ctx: Ctx) {
  const { own, opportunities, form, navigate } = ctx;
  const demands = own.filter((b) => b.kind === "demand");
  const [sel, setSel] = useState(demands[0]?.id ?? "");
  const d = demands.find((x) => x.id === sel) ?? demands[0];
  if (!d) return <p className="md-empty">Matches appear once a business posts a requirement.</p>;
  const fits = ctx.fitsFor(d);
  const r = d.record as Requirement;
  const opp = opportunities.find((o) => o.requirementId === d.id);
  return (
    <div className="md-content">
      <div className="md-filters">
        <select aria-label="Requirement" value={d.id} onChange={(e) => setSel(e.target.value)} className="am-wide-select">
          {demands.map((x) => (
            <option key={x.id} value={x.id}>
              {x.title} · {x.city}
            </option>
          ))}
        </select>
        <span>
          {r.status} · {sqft(r.minArea)}–{sqft(r.maxArea)} · up to {priceLabel(r.budget, r.transaction)}
        </span>
      </div>
      <section className="md-section am-pad">
        {fits.map((m) => {
          const existing = ctx.deals.find((x) => x.propertyId === m.board.id && x.requirementId === d.id);
          const p = m.board.record as Property;
          return (
            <div key={m.board.id} className="am-match-wrap">
              <button className="hw-match" onClick={() => ctx.open(m.board, "Matches")}>
                <span className="hw-match-score">
                  {m.score}
                  <small>FIT</small>
                </span>
                <span>
                  <b>{m.board.title}</b>
                  <small>
                    {m.board.city} · {sqft(p.area)} · {priceLabel(p.price, p.transaction)} · {m.reasons.join(" · ")}
                  </small>
                </span>
                <ArrowUpRight size={18} />
              </button>
              <span className="am-tags">
                {m.hold ? <em className="danger">Hold until verification</em> : !p.consent || !["Mandated", "Available"].includes(p.status) ? <em>Private outreach first</em> : <em className="ok">Ready to introduce</em>}
                {deskSignals(p).map((s) => (
                  <em key={s.label}>{s.label}</em>
                ))}
                <small>
                  Owner: {p.ownerContact || "not recorded"} · Recorded by {p.source}
                </small>
              </span>
              {existing ? (
                <button className="am-match-action" onClick={() => navigate("Deal Desk")}>
                  Deal at {existing.stage} <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  className="am-match-action"
                  onClick={() => form("deal", undefined, { name: `${m.board.title} · ${d.title}`, propertyId: m.board.id, requirementId: d.id, stage: m.hold || !p.consent ? "Flagged" : "Qualified", leadSource: "Staff match", value: p.price })}
                >
                  Send to Deal Desk <ArrowRight size={14} />
                </button>
              )}
            </div>
          );
        })}
        {!fits.length && (
          <div className="first-post">
            <h3>No suitable asset found.</h3>
            <p>That is not the end of the search. After the demand is validated, it can become a development opportunity: site search, feasibility and a project proposal.</p>
            {opp ? (
              <button className="landing-primary" onClick={() => navigate("Opportunity Bank")}>
                Opportunity at {opp.stage} <ArrowRight size={16} />
              </button>
            ) : (
              <button className="landing-primary" onClick={() => form("opportunity", undefined, { name: `${d.title} · ${d.city}`, requirementId: d.id, stage: "Demand gap detected" })}>
                Create development opportunity <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </section>
      <p className="hw-fine">Score weights: location 25, area 20, budget 20, parking 15, possession timeline 10, owner confirmation 10.</p>
    </div>
  );
}

// ------------------------------------------------------------------ Staff: Deal Desk

function DealDesk(ctx: Ctx) {
  const { deals, properties, requirements, fees, form } = ctx;
  return (
    <div className="md-content">
      <div className="pipeline am-pipeline">
        {dealStages.map((stage) => {
          const list = deals.filter((d) => d.stage === stage);
          return (
            <section key={stage}>
              <h4>
                {stage} <span>{list.length}</span>
              </h4>
              {list.map((d) => {
                const done = stage === "Closed" || stage === "Dropped";
                const overdue = d.followup && d.followup < today() && !done;
                const p = properties.find((x) => x.id === d.propertyId);
                const contracted = sum(fees.filter((f) => f.linkKind === "deal" && f.linkId === d.id && ["Contracted", "Invoiced", "Collected"].includes(f.status)).map((f) => f.amount));
                return (
                  <div className="deal" key={d.id}>
                    <b>{d.name}</b>
                    <p>
                      {nameOf(properties, d.propertyId)} → {nameOf(requirements, d.requirementId)}
                    </p>
                    <span className="am-tags">
                      <em className={d.mandateSigned ? "ok" : ""}>{d.mandateSigned ? `Mandate · ${d.mandateParty.toLowerCase()}` : "No mandate"}</em>
                      {d.optIn && <em>Client opted in</em>}
                      {p && deskSignals(p).map((s) => <em key={s.label}>{s.label}</em>)}
                    </span>
                    <p>
                      {d.assignee && <b>{d.assignee}: </b>}
                      {d.nextAction || (done ? "" : "Set a next action")}
                    </p>
                    {d.followup && (
                      <p className={overdue ? "am-overdue" : ""}>
                        {overdue ? "Overdue · " : "Follow up "}
                        {d.followup}
                      </p>
                    )}
                    {(d.value > 0 || contracted > 0) && (
                      <p>
                        {d.value > 0 && <>Value {p ? priceLabel(d.value, p.transaction) : inr(d.value)}</>}
                        {contracted > 0 && <> · Fee {inr(contracted)}</>}
                      </p>
                    )}
                    <button className="outline" onClick={() => form("deal", d)}>
                      Update deal
                    </button>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
      <p className="hw-fine">From Mandate signed on, the owner’s permission and a signed written mandate are required. Each stage needs an owner and a dated next action.</p>
    </div>
  );
}

// ------------------------------------------------------------------ Staff: Opportunity Bank

function Opportunities(ctx: Ctx) {
  const { opportunities, requirements, properties, fees, form, remove } = ctx;
  const gaps = requirements.filter(
    (r) => !opportunities.some((o) => o.requirementId === r.id) && (r.status === "Unmet" || (qualifiedRequirementStatuses.includes(r.status) && !properties.some((p) => match(p, r)))),
  );
  return (
    <div className="md-content">
      {gaps.length > 0 && (
        <section className="md-attention">
          <div>
            <h2>Demand gaps detected</h2>
            <p>Qualified or unmet requirements with no suitable asset in the Asset Bank.</p>
          </div>
          <div>
            {gaps.map((r) => (
              <button key={r.id} onClick={() => form("opportunity", undefined, { name: `${r.name} · ${r.district}`, requirementId: r.id, stage: "Demand gap detected" })}>
                <span className="md-alert-icon">
                  <Lightbulb size={18} />
                </span>
                <span>
                  <b>{r.name}</b>
                  <small>Create an opportunity · {r.district}</small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </section>
      )}
      <div className="md-people">
        {opportunities.map((o) => {
          const stack = fees.filter((f) => f.linkKind === "opportunity" && f.linkId === o.id && f.status !== "Cancelled");
          const step = opportunityStages.indexOf(o.stage);
          const site = properties.find((p) => p.id === o.propertyId);
          return (
            <section key={o.id}>
              <div className="md-section-head">
                <div>
                  <small className="md-kind">OPPORTUNITY · {o.stage.toUpperCase()}</small>
                  <h3>{o.name}</h3>
                  <p>
                    {nameOf(requirements, o.requirementId)} · Site: {site ? site.name : "not chosen yet"}
                  </p>
                </div>
              </div>
              <ol className="am-track" aria-label={`Stage ${step + 1} of ${opportunityStages.length - 1}`}>
                {opportunityStages.slice(0, -1).map((s, i) => (
                  <li key={s} className={i <= step && o.stage !== "Dropped" ? "done" : ""} title={s} />
                ))}
              </ol>
              {stack.map((f) => (
                <div className="md-person am-static" key={f.id}>
                  <span className="md-avatar">₹</span>
                  <span>
                    <b>{f.name}</b>
                    <small>{f.status}</small>
                  </span>
                  <span className="md-person-action">{inr(f.amount)}</span>
                </div>
              ))}
              <div className="md-people-footer">
                <span>{stack.length ? `Combined potential ${inr(sum(stack.map((f) => f.amount)))} · not guaranteed` : o.nextAction || "No fees recorded"}</span>
                <span className="am-inline-actions">
                  <button onClick={() => form("fee", undefined, { linkKind: "opportunity", linkId: o.id, stream: "Feasibility & advisory", status: "Pipeline", payer: "Client" })}>Add fee</button>
                  <button onClick={() => form("opportunity", o)}>Edit</button>
                  <button onClick={() => remove("opportunity", o)}>Delete</button>
                </span>
              </div>
            </section>
          );
        })}
      </div>
      {!opportunities.length && <p className="md-empty">No opportunities yet. A validated requirement with no suitable asset can start one here.</p>}
      <p className="hw-fine">A development lead is not a constructed project or a tenant commitment. Each service needs its own agreement, disclosed to every party.</p>
    </div>
  );
}

// ------------------------------------------------------------------ Staff: Revenue

function Revenue(ctx: Ctx) {
  const { fees, deals, properties, opportunities, members, form, remove, navigate } = ctx;
  const mrr = sum(paidMembers(members).map((m) => plans[m.effective].price));
  const live = fees.filter((f) => f.status !== "Cancelled");
  const amount = (xs: Fee[], s: string) => sum(xs.filter((f) => f.status === s).map((f) => f.amount));
  const stages = feeStatuses.filter((s) => s !== "Cancelled");
  const linkName = (f: Fee) => (f.linkKind === "deal" ? nameOf(deals, f.linkId) : f.linkKind === "opportunity" ? nameOf(opportunities, f.linkId) : "Stand-alone");
  const payouts = deals.filter((d) => d.rewardRate > 0).map((d) => ({ d, collected: collectedFor(fees, d.id) }));
  return (
    <div className="md-content">
      <Summary
        items={[
          [Users, "Recurring (MRR)", inr(mrr), "Subscriptions, excl. GST", () => navigate("Members")],
          [IndianRupee, "Pipeline", inr(amount(live, "Pipeline")), "Not agreed · not revenue", null],
          [Handshake, "Contracted and invoiced", inr(amount(live, "Contracted") + amount(live, "Invoiced")), `${inr(amount(live, "Invoiced"))} awaiting payment`, null],
          [Check, "Collected", inr(amount(live, "Collected")), "Money received", null],
        ]}
      />
      <section className="md-section">
        <div className="md-section-head">
          <div>
            <h2>By revenue stream</h2>
            <p>Unsigned deal value is never shown as revenue.</p>
          </div>
          <button onClick={() => form("fee", undefined, { status: "Pipeline" })}>
            Add fee <Plus size={15} />
          </button>
        </div>
        <div className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                <th>Stream</th>
                {stages.map((s) => (
                  <th key={s}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {revenueStreams.map((stream) => {
                const xs = live.filter((f) => f.stream === stream);
                return (
                  <tr key={stream}>
                    <td>
                      <strong>{stream}</strong>
                    </td>
                    {stages.map((s) => (
                      <td key={s}>{amount(xs, s) ? inr(amount(xs, s)) : "—"}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="md-section">
        <div className="md-section-head">
          <div>
            <h2>Fees</h2>
            <p>{fees.length} recorded</p>
          </div>
        </div>
        <div className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                <th>Scope</th>
                <th>Payer</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Next step</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => (
                <tr key={f.id}>
                  <td>
                    <strong>{f.name}</strong>
                    <small className="md-status-help">
                      {f.stream} · {linkName(f)}
                    </small>
                  </td>
                  <td>
                    {f.payer}
                    <small className="md-status-help">{f.trigger}</small>
                  </td>
                  <td>
                    <span className={`md-status ${f.status === "Collected" ? "active" : ""}`}>{f.status}</span>
                    <small className="md-status-help">{f.agreement ? "Agreement signed" : "No agreement"}</small>
                  </td>
                  <td>{inr(f.amount)}</td>
                  <td>
                    <span className="am-inline-actions">
                      <button className="md-row-action" onClick={() => form("fee", f)}>
                        Edit <ArrowRight size={13} />
                      </button>
                      <button className="md-row-action" onClick={() => remove("fee", f)}>
                        Delete
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!fees.length && <p className="md-empty">No fees recorded yet.</p>}
        </div>
      </section>
      <section className="md-section">
        <div className="md-section-head">
          <div>
            <h2>Partner earnings</h2>
            <p>Rewards on brokerage actually collected. These figures do not trigger payments.</p>
          </div>
        </div>
        <div className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Contributor</th>
                <th>Brokerage collected</th>
                <th>Reward</th>
                <th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(({ d, collected }) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.name}</strong>
                    <small className="md-status-help">{d.stage}</small>
                  </td>
                  <td>
                    {properties.find((p) => p.id === d.propertyId)?.source ?? "—"}
                    <small className="md-status-help">
                      {d.sourceTier} · {d.rewardRate}%
                    </small>
                  </td>
                  <td>{inr(collected)}</td>
                  <td>{inr(rewardFor(d.rewardRate, collected))}</td>
                  <td>
                    <span className={`md-status ${d.payoutStatus === "Paid" ? "active" : ""}`}>{d.payoutStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!payouts.length && <p className="md-empty">No deals carry a contributor reward yet.</p>}
        </div>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ Staff: Members

function Members(ctx: Ctx) {
  const { members, setMembers, demo, setNotice } = ctx;
  const [busy, setBusy] = useState("");
  const list = members.filter((m) => m.role !== "Staff");
  async function save(m: Member, f: HTMLFormElement) {
    if (demo) return setNotice("Sample data is read-only.");
    const data = new FormData(f);
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
  return (
    <div className="md-content">
      <section className="md-section">
        <div className="md-section-head">
          <div>
            <h2>Members</h2>
            <p>Take payment outside the app, then record the plan. It lapses to Free after the paid-until date.</p>
          </div>
        </div>
        <div className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Change plan</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => {
                const effective = effectivePlan(m.plan, m.planUntil, today());
                return (
                  <tr key={m.owner}>
                    <td>
                      <strong>{m.name}</strong>
                      <small className="md-status-help">
                        {m.role}
                        {m.organisation && ` · ${m.organisation}`}
                        {m.email && ` · ${m.email}`}
                      </small>
                    </td>
                    <td>
                      <span className={`md-status ${effective === "Free" ? "" : "active"}`}>{effective}</span>
                      {m.plan !== "Free" && <small className="md-status-help">{effective === "Free" ? `${m.plan} lapsed` : `Paid until ${m.planUntil}`}</small>}
                    </td>
                    <td>
                      <form
                        className="am-plan-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          save(m, e.currentTarget);
                        }}
                      >
                        <select name="plan" defaultValue={m.plan} aria-label={`Plan for ${m.name}`}>
                          {planNames.map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                        <input type="date" name="planUntil" defaultValue={m.planUntil} aria-label="Paid until" />
                        <button className="hw-secondary" disabled={busy === m.owner}>
                          {busy === m.owner ? "Saving…" : "Save"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!list.length && <p className="md-empty">No members yet.</p>}
        </div>
      </section>
    </div>
  );
}
