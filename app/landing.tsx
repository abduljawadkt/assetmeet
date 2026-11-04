"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Menu,
  X,
  ShieldCheck,
  Building2,
  HardHat,
  ClipboardList,
  Network,
  Handshake,
  Lightbulb,
  EyeOff,
  ListChecks,
  FileSignature,
  Lock,
} from "lucide-react";
import { Placeholder, Wordmark, StatusPill, VerificationPill } from "./brand";
import LiveMatch from "./live-match";
import { DealJourney, PlanFinder } from "./landing-extras";
import { demoProperties } from "../lib/demo";
import { districts } from "../lib/records";
import { site } from "../lib/site-content";
import { sqft, months } from "../lib/format";

const appLink = (role?: string) => `/?view=app${role ? `&role=${role}` : ""}`;

const nav = [
  ["#businesses", "For businesses"],
  ["#owners", "For owners"],
  ["#contributors", "For contributors"],
  ["#how", "How it works"],
  ["#plans", "Plans"],
  ["#faq", "FAQ"],
];

const searches = [
  "Supermarkets and hypermarkets",
  "Pharmacy chains",
  "Bank and NBFC branches",
  "Restaurants and quick-service chains",
  "Showrooms and retail outlets",
  "Warehouses and logistics hubs",
];

const workspaces: [typeof Building2, string, string][] = [
  [Building2, "Asset Bank", "Existing buildings, land and spaces: sanctioned, ongoing and completed."],
  [ClipboardList, "Demand Bank", "Buy, lease, rent, expansion, corporate and investor requirements."],
  [Network, "Match Engine", "Location, area, budget, technical fit, possession and owner permission."],
  [Handshake, "Deal Desk", "Qualified introduction, site visit, negotiation, agreement and closure."],
  [Lightbulb, "Opportunity Bank", "Unmet demand turned into site search, feasibility and new projects."],
];

const engines: [string, string, string][] = [
  ["Digital marketplace", "Subscribers list properties, post requirements and find matches themselves.", "Affordable monthly plans"],
  ["Managed Deal Desk", "With an owner or client mandate, the AssetMeet team runs large transactions through to closing.", "Brokerage and sourcing, agreed in writing"],
  ["Demand to development", "When demand has no suitable building, land, developer and a project proposal are brought together.", "Feasibility and advisory"],
];

// Commitments the product enforces in code, not marketing claims.
const commitments: [typeof Lock, string, string][] = [
  [EyeOff, "Owner details stay private", "Released to a business only after the owner signs a mandate."],
  [ListChecks, "Every score shows its reasons", "Location, size, budget, parking, timing and permission, out of 100."],
  [FileSignature, "Fees only in writing", "No brokerage or advisory fee without a signed agreement."],
  [Lock, "Nothing public by default", "A property is seen only if its owner chooses, and then anonymised."],
];

const faqs: [string, React.ReactNode][] = [
  [
    "Who pays AssetMeet?",
    site.fees.business ? (
      site.fees.business
    ) : (
      <>
        Subscribers pay a monthly plan for tools and intelligence. Brokerage, sourcing and advisory fees are separate:
        they apply only under a mandate agreed in writing before the work starts.{" "}
        <Placeholder label="Fee summary for businesses and owners" />
      </>
    ),
  ],
  [
    "Is my property shown on a public listing?",
    "No. Properties are private unless you choose to let subscribers see them, and then only anonymised: location, size, price and readiness, never your name or contact. A business sees an owner's details only after the owner has given permission and signed a mandate.",
  ],
  [
    "Does a Corporate plan unlock owner contacts?",
    "No plan does. AssetMeet sells data intelligence, not contact databases. Owner details, client identities and confidential offers are released only with permission, and every access is checked and logged.",
  ],
  [
    "Does a subscription commit me to paying brokerage?",
    "No. Your subscription covers the tools. AssetMeet represents you in a deal only if you opt in and sign a separate written agreement.",
  ],
  [
    "What if no property fits my requirement?",
    "That is not the end of the search. Once your requirement is confirmed, the team can look for land or an expandable building and prepare a development proposal. Any feasibility, design or project work is quoted and agreed separately.",
  ],
  [
    "Which areas do you cover?",
    site.activeDistricts ? (
      site.activeDistricts
    ) : (
      <>
        Properties and requirements can be recorded in all 14 districts of Kerala.{" "}
        <Placeholder label="Districts where AssetMeet actively searches today" />
      </>
    ),
  ],
  [
    "How is a match scored?",
    "Each property is scored out of 100 against a requirement: location 25, area 20, budget 20, parking 15, possession timeline 10 and owner confirmation 10. Properties of the wrong type or deal type, and closed or withdrawn ones, are left out. Every score lists its reasons, and a person reviews each match before anyone is contacted.",
  ],
  [
    "Can I list a building that is still under construction?",
    "Yes. You can record a property from the day it is sanctioned, while it is under construction, or when it is on hold. Construction, status and document checks are tracked separately, so a building can be recorded long before it is offered on the market. Basic submission is free.",
  ],
  [
    "Do I need an account?",
    "Yes, so your records stay private. Sign in with your email address; we send you a one-time link, so there is no password to remember. To look around first, open the workspace with sample data. Nothing you do there is saved.",
  ],
];

export default function Landing() {
  const [menu, setMenu] = useState(false);
  return (
    <div className="site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link href="/" className="wordmark-link" aria-label="AssetMeet home">
            <Wordmark />
          </Link>
          <nav className={`site-nav ${menu ? "open" : ""}`} aria-label="Main">
            {nav.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenu(false)}>
                {label}
              </a>
            ))}
            <a className="site-nav-signin" href={appLink()}>
              Sign in
            </a>
          </nav>
          <div className="site-header-actions">
            <a className="btn btn-quiet header-signin" href={appLink()}>
              Sign in
            </a>
            <a className="btn btn-primary header-cta" href={appLink("Business")}>
              <span className="long">Post a requirement</span>
              <span className="short">Get started</span>
            </a>
            <button
              className="btn btn-quiet menu-button"
              aria-expanded={menu}
              aria-label={menu ? "Close menu" : "Open menu"}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="hero">
          <svg className="hero-lines" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
            <path d="M-40 520 C 220 470, 360 600, 620 540 S 1010 380, 1260 430" />
            <path d="M-40 430 C 240 380, 420 500, 660 450 S 1040 300, 1260 330" />
            <path d="M720 -40 C 640 120, 820 220, 760 360 S 860 600, 980 700" />
            <path className="brass" d="M880 -40 C 800 140, 980 260, 920 420 S 1020 620, 1140 700" />
          </svg>
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Real estate intelligence marketplace for Kerala</p>
              <h1>Find commercial space before it reaches the market.</h1>
              <p className="lede">
                Expanding businesses post a brief. Owners, engineers and builders record the buildings they know about,
                including ones still under construction. AssetMeet scores the fit, confirms the owner&rsquo;s permission
                and closes the deal with you.
              </p>
              <div className="actions">
                <a className="btn btn-on-dark btn-lg" href={appLink("Business")}>
                  Post a space requirement <ArrowRight size={18} />
                </a>
                <a className="btn btn-ghost-dark btn-lg" href={appLink("Owner")}>
                  I own or know a property
                </a>
              </div>
              <p className="hero-note">
                <ShieldCheck size={16} aria-hidden="true" /> Owner details are shared only after the owner agrees.
              </p>
            </div>
            <LiveMatch />
          </div>
        </section>

        <section className="commitments" aria-label="How AssetMeet protects you">
          <div className="container">
            <ul className="commitment-list">
              {commitments.map(([Icon, title, text]) => (
                <li key={title}>
                  <Icon size={22} aria-hidden="true" />
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
            {site.proof ? (
              <dl className="proof-list">
                {site.proof.map((p) => (
                  <div key={p.label}>
                    <dt>{p.label}</dt>
                    <dd>{p.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <Placeholder
                label="Proof: client names or logos, deals closed, properties recorded"
                hint="Only real figures you are allowed to publish. Edit lib/site-content.ts."
              />
            )}
          </div>
        </section>

        <section className="section" id="businesses">
          <div className="container split">
            <div>
              <p className="eyebrow">For businesses</p>
              <h2>Your next location, shortlisted.</h2>
              <p className="section-lede">
                For expansion and real-estate teams that need specific space in specific towns, without weeks of
                calls and wasted site visits.
              </p>
              <ol className="steps">
                <li>
                  <h3>Send your brief</h3>
                  <p>District, property type, area range, budget, parking and when you need possession.</p>
                </li>
                <li>
                  <h3>Review a scored shortlist</h3>
                  <p>
                    Every property is scored against your brief, with the reasons shown. That includes
                    buildings that are not yet on the market.
                  </p>
                </li>
                <li>
                  <h3>Visit with permission in place</h3>
                  <p>We confirm the owner&rsquo;s permission before any introduction or site visit.</p>
                </li>
              </ol>
              <a className="btn btn-primary" href={appLink("Business")}>
                Post a space requirement <ArrowRight size={18} />
              </a>
            </div>
            <div className="spec">
              <p className="label">What each shortlisted property tells you</p>
              <dl className="spec-list">
                <div>
                  <dt>Fit score</dt>
                  <dd>Out of 100, with the reasons behind it</dd>
                </div>
                <div>
                  <dt>Construction</dt>
                  <dd>Sanctioned, under construction, on hold or completed</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>Mapped, owner confirmed, mandated, available or in negotiation</dd>
                </div>
                <div>
                  <dt>Documents</dt>
                  <dd>Title, permits, zoning and registration, checked independently</dd>
                </div>
                <div>
                  <dt>Practical fit</dt>
                  <dd>Area, rent or price, parking, and possession timeline</dd>
                </div>
              </dl>
              <div className="searches">
                <p className="label">Space we search for</p>
                <ul>
                  {searches.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-tint" id="owners">
          <div className="container split split-reverse">
            <div className="status-sheet" aria-label="Example property record">
              <div className="status-sheet-head">
                <Building2 size={20} aria-hidden="true" />
                <div>
                  <p className="preview-title">{demoProperties[1].name}</p>
                  <p className="facts">
                    {demoProperties[1].locality}, {demoProperties[1].district} · {sqft(demoProperties[1].area)}
                  </p>
                </div>
              </div>
              <dl>
                <div>
                  <dt>Construction</dt>
                  <dd>
                    <span className="pill pill-neutral">{demoProperties[1].construction}</span>
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <StatusPill status={demoProperties[1].status} />
                  </dd>
                </div>
                <div>
                  <dt>Documents</dt>
                  <dd>
                    <VerificationPill level={demoProperties[1].verification} />
                  </dd>
                </div>
                <div>
                  <dt>Owner permission</dt>
                  <dd>
                    <span className="pill pill-warning">Pending</span>
                  </dd>
                </div>
                <div>
                  <dt>Possession</dt>
                  <dd>{months(demoProperties[1].months)}</dd>
                </div>
              </dl>
              <p className="caption">Example record with a fictional property.</p>
            </div>
            <div>
              <p className="eyebrow">For owners and developers</p>
              <h2>Find a tenant before the building is finished.</h2>
              <p className="section-lede">
                Expanding businesses plan months ahead. Record your property early and it can be matched while
                it is still being built.
              </p>
              <ul className="ticks">
                <li>Record a building or plot from the day it is sanctioned. Basic submission is free.</li>
                <li>You approve every introduction. Nothing is public unless you choose, and never your contact.</li>
                <li>Construction, status and document checks are tracked separately.</li>
                <li>For a confidential sale or lease, a private mandate releases information in stages.</li>
              </ul>
              <a className="btn btn-primary" href={appLink("Owner")}>
                List a property <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>

        <section className="section band" id="contributors">
          <div className="container">
            <div className="band-head">
              <HardHat size={28} aria-hidden="true" />
              <p className="eyebrow">For engineers, architects and builders</p>
              <h2>You know what is being built. Get paid for verified contribution.</h2>
              <p className="section-lede">
                Record properties you know about, free. Your contribution is attributed to you from the first entry,
                and rewards follow the work you can verify.
              </p>
            </div>
            <ol className="band-steps">
              <li>
                <h3>Data contributor</h3>
                <p>
                  Asset discovery: structured property records, submitted with the owner&rsquo;s permission. A basic
                  record grows the network but does not earn a deal commission by itself.
                </p>
              </li>
              <li>
                <h3>Qualified sourcer</h3>
                <p>
                  Mandate secured: you are the verified original introducer, with the owner&rsquo;s consent, and the
                  record leads to a real opportunity.{" "}
                  {site.contributorReward ?? <Placeholder label="Reward terms, for example a percentage of the collected brokerage" />}
                </p>
              </li>
              <li>
                <h3>Deal partner</h3>
                <p>Execution support: documented negotiation, site visits or closing support under an agreed arrangement.</p>
              </li>
            </ol>
            <div className="band-foot">
              <a className="btn btn-on-dark" href={appLink("Contributor")}>
                Join as a contributor <ArrowRight size={18} />
              </a>
              <p>
                Rewards are paid only on brokerage actually collected, after review, under signed terms. Duplicate records
                are merged into one master asset and the verified original source is credited, not simply the first upload.
              </p>
            </div>
          </div>
        </section>

        <section className="section" id="how">
          <div className="container">
            <p className="eyebrow">How AssetMeet works</p>
            <h2>One network. Five connected workspaces.</h2>
            <p className="section-lede">
              More contributors bring better asset data. Better data draws more demand, which makes better matches and
              more closed deals.
            </p>
            <ul className="workspace-grid">
              {workspaces.map(([Icon, title, text]) => (
                <li key={title}>
                  <Icon size={22} aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ul>
            <div className="fee-grid">
              {engines.map(([title, text, earn]) => (
                <div className="fee" key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <p className="engine-earn">{earn}</p>
                </div>
              ))}
            </div>
            <div className="journey-block">
              <h3 className="journey-heading">How the Deal Desk takes a match to a signed lease</h3>
              <p className="section-lede">Pick a stage to see who handles it and what protects you there.</p>
              <DealJourney />
            </div>
          </div>
        </section>

        <section className="section section-tint" id="plans">
          <div className="container">
            <p className="eyebrow">Plans and fees</p>
            <h2>Entry price low. Network value high.</h2>
            <p className="section-lede">
              A subscription gives you the tools and the intelligence. Brokerage needs a separate mandate, agreed in
              writing.
            </p>
            <div className="plans-block">
              <PlanFinder />
            </div>
            <div className="fee-grid">
              <div className="fee">
                <h3>Free access</h3>
                <p>
                  Engineers, architects, builders and owners can record properties free. Businesses can post one demand
                  and receive a shortlist from the team.
                </p>
              </div>
              <div className="fee">
                <h3>Deal Desk</h3>
                {site.fees.business ? (
                  <p>{site.fees.business}</p>
                ) : (
                  <Placeholder label="Brokerage for sale and lease mandates" hint="Agreed per mandate. There is no assumed standard rate." />
                )}
              </div>
              <div className="fee">
                <h3>Owners</h3>
                {site.fees.owner ? <p>{site.fees.owner}</p> : <Placeholder label="Fee for owners" />}
              </div>
            </div>
          </div>
        </section>

        <section className="section section-tint" id="faq">
          <div className="container faq-layout">
            <div>
              <p className="eyebrow">FAQ</p>
              <h2>Questions people ask first.</h2>
            </div>
            <div className="faq">
              {faqs.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <div className="faq-answer">{a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section closing">
          <div className="container closing-inner">
            <h2>Tell us what space you need.</h2>
            <p className="section-lede">
              A brief takes a few minutes. Once it is saved, the Match Engine scores recorded properties across{" "}
              {districts.length} districts against it, and the team qualifies it.
            </p>
            <div className="actions">
              <a className="btn btn-primary btn-lg" href={appLink("Business")}>
                Post a space requirement <ArrowRight size={18} />
              </a>
              <a className="btn btn-secondary btn-lg" href={appLink("Owner")}>
                List a property
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Wordmark />
            <p>
              An affordable property intelligence marketplace for Kerala that turns matches into transactions, and unmet
              demand into development opportunities.
            </p>
          </div>
          <div>
            <p className="label">Contact</p>
            {site.contact.email || site.contact.phone || site.contact.whatsapp ? (
              <ul className="footer-list">
                {site.contact.phone && <li>{site.contact.phone}</li>}
                {site.contact.whatsapp && (
                  <li>
                    <a href={site.contact.whatsapp}>WhatsApp</a>
                  </li>
                )}
                {site.contact.email && (
                  <li>
                    <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
                  </li>
                )}
              </ul>
            ) : (
              <Placeholder label="Phone, WhatsApp and email" />
            )}
          </div>
          <div>
            <p className="label">Get started</p>
            <ul className="footer-list">
              <li>
                <a href={appLink("Business")}>Post a requirement</a>
              </li>
              <li>
                <a href={appLink("Owner")}>List a property</a>
              </li>
              <li>
                <a href={appLink("Contributor")}>Join as a contributor</a>
              </li>
              <li>
                <a href={appLink()}>Sign in</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="container footer-base">
          <p>© {new Date().getFullYear()} AssetMeet. Examples on this page use fictional properties.</p>
        </div>
      </footer>
    </div>
  );
}
