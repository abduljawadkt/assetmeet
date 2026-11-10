"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Building2, Handshake, HardHat, Search } from "lucide-react";
import { AssetWordmark } from "./brand";

// A short story in five screens: one idea per screen, little text, a dot
// rail showing where you are, and each screen easing in as it arrives.

const start = (engine: "property" | "requirement") => `/?view=app&engine=${engine}`;

const chapters = ["Welcome", "Asset", "Opportunity", "Transaction", "Get started"];

export default function Landing() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const slides = [...(root.current?.querySelectorAll<HTMLElement>(".fl-slide") ?? [])];
    const seen = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")),
      { threshold: 0.25 },
    );
    const current = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(slides.indexOf(e.target as HTMLElement));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    slides.forEach((s) => {
      seen.observe(s);
      current.observe(s);
    });
    // Content is visible without JavaScript; the easing only starts once this runs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    return () => {
      seen.disconnect();
      current.disconnect();
    };
  }, []);

  function go(i: number) {
    const slide = root.current?.querySelectorAll<HTMLElement>(".fl-slide")[i];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    slide?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <main className={`fl ${ready ? "fl-ready" : ""}`} ref={root}>
      <a className="fl-skip" href="#get-started">
        Skip to get started
      </a>
      <header className="fl-top">
        <Link
          href="/"
          aria-label="AssetMeet home"
          onClick={(e) => {
            e.preventDefault();
            go(0);
          }}
        >
          <AssetWordmark />
        </Link>
        <nav aria-label="Account">
          <Link href="/?view=app&mode=signin">Sign in</Link>
          <Link className="fl-pill" href={start("property")}>
            Get started
          </Link>
        </nav>
      </header>

      <nav className="fl-dots" aria-label="Sections">
        {chapters.map((c, i) => (
          <button key={c} aria-label={c} aria-current={active === i ? "true" : undefined} onClick={() => go(i)} />
        ))}
      </nav>

      <section className="fl-slide fl-intro" aria-label="Welcome">
        <div className="fl-in">
          <span className="fl-mark" aria-hidden="true">
            am
          </span>
          <h1>
            <b>AssetMeet.</b> Property matching for Kerala.
          </h1>
        </div>
        <button className="fl-next" onClick={() => go(1)} aria-label="Next section">
          <ArrowDown size={18} />
        </button>
      </section>

      <section className="fl-slide" aria-labelledby="ch-asset">
        <div className="fl-in">
          <span className="fl-icon">
            <Building2 size={26} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h2 id="ch-asset">
            Every building is an <em>asset.</em>
          </h2>
          <p>List a building, plot or space, even before it is finished. It stays private until the owner says yes.</p>
        </div>
      </section>

      <section className="fl-slide" aria-labelledby="ch-opportunity">
        <div className="fl-in">
          <span className="fl-icon">
            <Search size={26} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h2 id="ch-opportunity">
            Every requirement is an <em>opportunity.</em>
          </h2>
          <p>Tell us the town, size, budget and timing you need. We look for the fit, including space not yet on the market.</p>
        </div>
      </section>

      <section className="fl-slide" aria-labelledby="ch-transaction">
        <div className="fl-in">
          <span className="fl-icon">
            <Handshake size={26} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h2 id="ch-transaction">
            Every verified match is a <em>potential transaction.</em>
          </h2>
          <p>We score each match and show why it fits, then introduce both sides once the owner agrees.</p>
        </div>
      </section>

      <section className="fl-slide fl-doors" id="get-started" aria-labelledby="ch-start">
        <div className="fl-in">
          <h2 id="ch-start">Where would you like to begin?</h2>
          <ul>
            <li>
              <Link href={start("property")}>
                <Building2 size={28} strokeWidth={1.5} aria-hidden="true" />
                <b>I have a property</b>
                <span>List it, free</span>
              </Link>
            </li>
            <li>
              <Link href={start("requirement")}>
                <Search size={28} strokeWidth={1.5} aria-hidden="true" />
                <b>I need a property</b>
                <span>Post what you need</span>
              </Link>
            </li>
            <li>
              <Link href={start("property")}>
                <HardHat size={28} strokeWidth={1.5} aria-hidden="true" />
                <b>I’m an engineer</b>
                <span>Introduce properties, earn when eligible</span>
              </Link>
            </li>
          </ul>
          <div className="fl-links">
            <p>
              Already a member?{" "}
              <Link href="/?view=app&mode=signin">
                Sign in <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </p>
            <p>
              Looking around first?{" "}
              <Link href="/?view=app&demo=1">
                Open a sample workspace <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </p>
          </div>
          <small className="fl-foot">Free to start · Private by default · Fees only in writing</small>
        </div>
      </section>
    </main>
  );
}
