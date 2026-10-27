"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, ShieldCheck, Building2, HardHat } from "lucide-react";
import { MatchRow, Placeholder, Wordmark, MarketPill, VerificationPill } from "./brand";
import { demoProperties, demoRequirements } from "../lib/demo";
import { districts } from "../lib/records";
import { site } from "../lib/site-content";
import { sqft, inrShort, months } from "../lib/format";

const appLink = (role?: string) => `/?view=app${role ? `&role=${role}` : ""}`;

const nav = [
  ["#businesses", "For businesses"],
  ["#owners", "For owners"],
  ["#contributors", "For engineers & builders"],
  ["#fees", "Fees"],
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

const faqs: [string, React.ReactNode][] = [
  [
    "Who pays AssetMeet?",
    site.fees.business ? (
      site.fees.business
    ) : (
      <>
        Fees are agreed in writing before any search starts.{" "}
        <Placeholder label="Fee summary for businesses and owners" />
      </>
    ),
  ],
  [
    "Is my property shown on a public listing?",
    "No. Properties are kept in a private workspace and are not published. A business sees an owner's details only after the owner has given permission and a mandate is signed.",
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
    "Each property is scored out of 100 against a requirement: location 25, area 20, budget 20, parking 15, possession timeline 10 and verification 10. Properties of the wrong type or deal type are left out. Every score lists its reasons, and a person reviews each match before anyone is contacted.",
  ],
  [
    "Can I list a building that is still under construction?",
    "Yes. You can record a property from the day it is sanctioned, while it is under construction, or when it is on hold. Construction, availability and verification are tracked separately, so a building can be recorded long before it is offered on the market.",
  ],
  [
    "Do I need an account?",
    "You sign in with your ChatGPT account. To look around first, open the workspace with sample data. Nothing you do there is saved.",
  ],
];

export default function Landing() {
  const [menu, setMenu] = useState(false);
  const preview = demoRequirements[0];
  const previewProps = demoProperties.slice(0, 2);
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
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Commercial property · Kerala</p>
              <h1>Find commercial space in Kerala before it reaches the market.</h1>
              <p className="lede">
                Tell us the town, size and budget. We shortlist sites, including buildings still under
                construction, and confirm the owner&rsquo;s permission before your site visit.
              </p>
              <div className="actions">
                <a className="btn btn-primary btn-lg" href={appLink("Business")}>
                  Post a space requirement <ArrowRight size={18} />
                </a>
                <a className="btn btn-secondary btn-lg" href={appLink("Owner")}>
                  I own or know a property
                </a>
              </div>
              <p className="hero-note">
                <ShieldCheck size={16} aria-hidden="true" /> Owner details are shared only after the owner agrees.
              </p>
            </div>
            <figure className="hero-preview" aria-label="Example shortlist">
              <div className="preview-card">
                <div className="preview-brief">
                  <p className="label">Requirement</p>
                  <p className="preview-title">{preview.name}</p>
                  <p className="facts">
                    {preview.district} · {sqft(preview.minArea)}–{sqft(preview.maxArea)} · up to{" "}
                    {inrShort(preview.budget)} / month · {preview.parking} parking · within {preview.months} months
                  </p>
                </div>
                <div className="preview-results">
                  {previewProps.map((p) => (
                    <MatchRow key={p.id} property={p} requirement={preview} />
                  ))}
                </div>
              </div>
              <figcaption>Example shortlist with fictional properties.</figcaption>
            </figure>
          </div>
        </section>

        <section className="proof" aria-label="Track record">
          <div className="container">
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
                  <dt>Availability</dt>
                  <dd>Available, exploring, or not yet listed</dd>
                </div>
                <div>
                  <dt>Verification</dt>
                  <dd>From reported to owner confirmed, documents verified, or mandate signed</dd>
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
                  <dt>Availability</dt>
                  <dd>
                    <MarketPill market={demoProperties[1].market} />
                  </dd>
                </div>
                <div>
                  <dt>Verification</dt>
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
                <li>Record a building or plot from the day it is sanctioned.</li>
                <li>You approve every introduction. Nothing is published.</li>
                <li>Construction, availability and verification are tracked separately.</li>
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
              <h2>You know what is being built. Get credit for it.</h2>
              <p className="section-lede">
                Record a property you know about. Your name stays attached to it, and you earn a share of the fee
                if it leads to a closed deal.
              </p>
            </div>
            <ol className="band-steps">
              <li>
                <h3>Record the property</h3>
                <p>Location, size, construction stage, and who the owner is.</p>
              </li>
              <li>
                <h3>Your credit is recorded</h3>
                <p>Your name is saved against the property from the first entry and stays with every deal.</p>
              </li>
              <li>
                <h3>Earn when a deal closes</h3>
                <p>
                  {site.contributorReward ?? (
                    <Placeholder label="Reward terms, for example a percentage of the collected fee" />
                  )}
                </p>
              </li>
            </ol>
            <div className="band-foot">
              <a className="btn btn-on-dark" href={appLink("Contributor")}>
                Join as a contributor <ArrowRight size={18} />
              </a>
              <p>Rewards are paid only on fees actually collected, under terms agreed in writing.</p>
            </div>
          </div>
        </section>

        <section className="section" id="fees">
          <div className="container">
            <p className="eyebrow">Fees</p>
            <h2>Agreed in writing before work starts.</h2>
            <div className="fee-grid">
              <div className="fee">
                <h3>Businesses</h3>
                {site.fees.business ? <p>{site.fees.business}</p> : <Placeholder label="Fee for businesses" hint="For example: one month's rent, payable on lease signing." />}
              </div>
              <div className="fee">
                <h3>Owners</h3>
                {site.fees.owner ? <p>{site.fees.owner}</p> : <Placeholder label="Fee for owners" />}
              </div>
              <div className="fee">
                <h3>Contributors</h3>
                <p>No fee. You earn a share when a property you recorded leads to a closed deal.</p>
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
              A brief takes a few minutes. Once it is saved, the AssetMeet team scores recorded properties across{" "}
              {districts.length} districts against it.
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
            <p>Commercial property matching and brokerage for Kerala.</p>
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
