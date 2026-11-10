"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Check, ChevronRight, FileSignature, Handshake, Lock, Menu, Network, Plus, ShieldCheck, X } from "lucide-react";
import { AssetWordmark } from "./brand";

// Landing page in the reference's Apple-like style, simplified: no splash screen,
// one clear hero, three visible steps, one block per audience, short questions.

const start = (engine: "property" | "requirement") => `/?view=app&engine=${engine}`;
const photo = (id: string, w: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const steps = [
  {
    icon: Building2,
    title: "List or post",
    text: "Owners and engineers record a building, plot or space. Businesses describe the space they need: location, size, budget and timing.",
  },
  {
    icon: Network,
    title: "Get matched",
    text: "Every property is scored out of 100 against each requirement, with the reasons shown. A person reviews each match.",
  },
  {
    icon: Handshake,
    title: "Meet with permission",
    text: "Our Deal Desk introduces both sides once the owner agrees, then helps with site visits, negotiation and closing.",
  },
];

const audiences = [
  {
    eyebrow: "Owners, engineers and builders",
    title: "I have a property",
    image: "photo-1486406146926-c627a92ad1ab",
    alt: "Illustrative commercial building",
    points: [
      "List buildings, plots and spaces free, even before they are finished",
      "Stays private until the owner gives permission",
      "Engineers keep credit for the properties they introduce",
    ],
    cta: "List a property",
    href: start("property"),
  },
  {
    eyebrow: "Businesses, buyers and tenants",
    title: "I need a property",
    image: "photo-1497366754035-f200968a6e72",
    alt: "Illustrative bright workspace",
    points: [
      "Post the town, size, budget and timing you need",
      "See scored matches, including buildings not yet on the market",
      "Visit only once the owner has agreed",
    ],
    cta: "Post a requirement",
    href: start("requirement"),
  },
];

const commitments = [
  { icon: Lock, title: "Private by default", text: "A property is shown only if its owner chooses, and never with their contact details." },
  { icon: ShieldCheck, title: "Owner permission first", text: "Owner details reach a business only after the owner signs a mandate." },
  { icon: FileSignature, title: "Fees only in writing", text: "Brokerage is agreed in a written mandate before any work starts." },
];

const faqs: [string, string][] = [
  [
    "Is it free?",
    "Yes, to start. Listing properties and posting a first requirement is free. Paid plans from ₹299 a month add self-service matching and more active listings. Brokerage is separate and agreed in writing for each deal.",
  ],
  [
    "Who can list a property?",
    "Owners, engineers and builders. Add a building, plot or space, even one still under construction. It stays private until the owner gives permission.",
  ],
  [
    "How does matching work?",
    "Each property is scored out of 100 against a requirement: location, area, budget, parking, readiness and owner confirmation, with the reasons shown. A person reviews every match before anyone is contacted.",
  ],
  [
    "Can engineers earn from introductions?",
    "Yes, when an introduction leads to a completed deal and the brokerage is collected, under reward terms agreed in writing. No income is guaranteed.",
  ],
  [
    "How do I sign in?",
    "Create an account with your email and a password, or continue with Google. To look around first, open the sample workspace.",
  ],
];

export default function Landing() {
  const [menu, setMenu] = useState(false);
  const close = () => setMenu(false);
  return (
    <main className="ap-site lp" id="top">
      <a className="ap-skip" href="#main-content">
        Skip to content
      </a>
      <header className="ap-nav">
        <Link href="/" aria-label="AssetMeet home">
          <AssetWordmark />
        </Link>
        <nav className={menu ? "open" : ""} aria-label="Website navigation">
          <a href="#how-it-works" onClick={close}>
            How it works
          </a>
          <a href="#for-you" onClick={close}>
            Who it’s for
          </a>
          <a href="#professionals" onClick={close}>
            For engineers
          </a>
          <a href="#questions" onClick={close}>
            Questions
          </a>
          <Link className="ap-menu-signin" href="/?view=app&mode=signin">
            Sign in
          </Link>
        </nav>
        <div>
          <Link className="ap-signin" href="/?view=app&mode=signin">
            Sign in
          </Link>
          <Link className="ap-button compact" href={start("property")}>
            Get started
          </Link>
          <button className="ap-menu" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu(!menu)}>
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <section className="lp-hero" id="main-content" tabIndex={-1}>
        <p className="lp-kicker">Property matching and brokerage for Kerala</p>
        <h1>
          <span>
            Every building is an <em>asset.</em>
          </span>{" "}
          <span>
            Every requirement is an <em>opportunity.</em>
          </span>
        </h1>
        <p className="lp-lead">
          AssetMeet connects properties with the businesses and people who need them. List what you have or post what you
          need, and we find the fit, with the owner’s permission at every step.
        </p>
        <div className="ap-actions">
          <Link className="ap-button" href={start("property")}>
            I have a property
          </Link>
          <Link className="ap-button secondary" href={start("requirement")}>
            I need a property
          </Link>
        </div>
        <ul className="lp-assurance">
          {["Free to start", "Private by default", "No owner details without permission"].map((t) => (
            <li key={t}>
              <Check size={15} aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
        <Link className="lp-sample" href="/?view=app&demo=1">
          Or explore a sample workspace <ChevronRight size={16} aria-hidden="true" />
        </Link>
        <figure className="lp-hero-photo">
          <img src={photo("photo-1486406146926-c627a92ad1ab", 1600)} width={1600} height={600} alt="Illustrative commercial building" fetchPriority="high" />
          <figcaption>Illustrative photograph</figcaption>
        </figure>
      </section>

      <section className="lp-section" id="how-it-works">
        <div className="lp-head">
          <h2>How it works</h2>
          <p>Three steps from a listing to a signed deal.</p>
        </div>
        <ol className="lp-steps">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title}>
                <span className="lp-step-top">
                  <span className="lp-step-icon">
                    <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <span className="lp-step-number">Step {i + 1}</span>
                </span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="lp-section lp-tint" id="for-you">
        <div className="lp-head">
          <h2>Start where you are</h2>
          <p>One account lists properties and posts requirements.</p>
        </div>
        <div className="lp-audiences">
          {audiences.map((a) => (
            <article key={a.title}>
              <img src={photo(a.image, 900)} width={900} height={360} alt={a.alt} loading="lazy" decoding="async" />
              <div className="lp-audience-copy">
                <span>{a.eyebrow}</span>
                <h3>{a.title}</h3>
                <ul>
                  {a.points.map((p) => (
                    <li key={p}>
                      <Check size={16} aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link className="ap-button" href={a.href}>
                  {a.cta} <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ap-professional lp-pro" id="professionals">
        <div className="lp-section">
          <h2>
            You know what is being built.
            <br />
            <span>Turn that knowledge into income.</span>
          </h2>
          <p className="ap-lead">
            Engineers, architects and builders can record the properties they know about. Your credit stays attached as the
            opportunity develops.
          </p>
          <div className="ap-contribution">
            <div>
              <b>1</b>
              <h3>Introduce</h3>
              <p>Record a property through your professional profile.</p>
            </div>
            <div>
              <b>2</b>
              <h3>Stay credited</h3>
              <p>Your name stays with the property and every deal it leads to.</p>
            </div>
            <div>
              <b>3</b>
              <h3>Earn when eligible</h3>
              <p>A completed deal can lead to a reward agreed in writing.</p>
            </div>
          </div>
          <Link className="ap-button" href={start("property")}>
            Join as a professional <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <small className="ap-reward-note">Rewards are paid only on brokerage actually collected, under signed terms. Posting does not guarantee a deal or a reward.</small>
        </div>
      </section>

      <section className="lp-section" aria-labelledby="commitments-title">
        <h2 className="lp-hidden" id="commitments-title">
          Our commitments
        </h2>
        <ul className="lp-commitments">
          {commitments.map((c) => {
            const Icon = c.icon;
            return (
              <li key={c.title}>
                <Icon size={24} strokeWidth={1.6} aria-hidden="true" />
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="lp-section lp-questions" id="questions">
        <h2>Questions</h2>
        {faqs.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <Plus size={20} aria-hidden="true" />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </section>

      <section className="ap-final">
        <h2>What brings you here?</h2>
        <div className="ap-actions">
          <Link className="ap-button" href={start("property")}>
            I have a property
          </Link>
          <Link className="ap-button secondary" href={start("requirement")}>
            I need a property
          </Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div>
          <AssetWordmark />
          <p>Property matching and brokerage for Kerala.</p>
        </div>
        <nav aria-label="Footer">
          <Link href={start("property")}>List a property</Link>
          <Link href={start("requirement")}>Post a requirement</Link>
          <Link href="/?view=app&mode=signin">Sign in</Link>
          <Link href="/?view=app&demo=1">Sample workspace</Link>
        </nav>
        <small>Photographs are illustrative. Every building is an asset. Every requirement is an opportunity.</small>
      </footer>
    </main>
  );
}

