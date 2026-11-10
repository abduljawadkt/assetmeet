"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, Building2, Compass, Hammer, HardHat, LogIn, Search, Volume2 } from "lucide-react";

// Landing page inspired by micro.company, in AssetMeet's brand green: five
// quiet full-screen chapters that alternate green, mint and white, a serif for
// chapter titles, a dot rail showing where you are, and each chapter easing in.
// The dots and the Sign in link switch tone to stay readable on each chapter.

const start = (engine: "property" | "requirement") => `/?view=app&engine=${engine}`;
const chapters = ["Welcome", "AssetMeet", "Our promise", "Start here", "Get in touch"];
const greenChapters = [0, 4];

const promises: [string, React.ReactNode][] = [
  ["I.", <><b>List what you have</b>, even before it is built.</>],
  ["II.", <><b>Post what you need</b>, and we look for the fit.</>],
  ["III.", <>Every match <b>shows its reasons</b>.</>],
  ["IV.", <><b>Nothing is shared</b> until the owner says yes.</>],
  ["V.", <><b>Fees only in writing</b>, agreed before any work.</>],
];

const doors = [
  { icon: Building2, title: "I have a property", text: "List a building, plot or space, free", href: start("property") },
  { icon: Search, title: "I need a property", text: "Post the space you are looking for", href: start("requirement") },
  { icon: HardHat, title: "I’m an engineer", text: "Introduce properties, earn when eligible", href: start("property") },
  { icon: Hammer, title: "I’m a builder", text: "Record projects while they are built", href: start("property") },
  { icon: Compass, title: "Look around", text: "Open a sample workspace", href: "/?view=app&demo=1" },
  { icon: LogIn, title: "Sign in", text: "Continue with email or Google", href: "/?view=app&mode=signin" },
];

export default function Landing() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const slides = [...(root.current?.querySelectorAll<HTMLElement>(".mc-slide") ?? [])];
    const seen = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")),
      { threshold: 0.2 },
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
    // Content is visible without JavaScript; the easing starts only once this runs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    return () => {
      seen.disconnect();
      current.disconnect();
    };
  }, []);

  function go(i: number) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.current?.querySelectorAll<HTMLElement>(".mc-slide")[i]?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  function say() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("Asset Meet");
    u.lang = "en-IN";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }

  return (
    <main
      className={`mc ${ready ? "mc-ready" : ""}`}
      data-tone={greenChapters.includes(active) ? "dark" : "light"}
      ref={root}
    >
      <a className="mc-skip" href="#start-here">
        Skip to start here
      </a>
      <nav className="mc-account" aria-label="Account">
        <Link href="/?view=app&mode=signin">Sign in</Link>
      </nav>

      <nav className="mc-dots" aria-label="Sections">
        {chapters.map((c, i) => (
          <button key={c} aria-label={c} aria-current={active === i ? "true" : undefined} onClick={() => go(i)} />
        ))}
      </nav>

      <section className="mc-slide mc-green" aria-label="Welcome">
        <div className="mc-in">
          <span className="mc-mark" aria-hidden="true">
            am
          </span>
          <h1 className="mc-hello">
            <b>Namaskaram.</b> Welcome to AssetMeet
          </h1>
        </div>
        <button className="mc-next" onClick={() => go(1)} aria-label="Next section">
          <ArrowDown size={16} />
        </button>
      </section>

      <section className="mc-slide mc-mint" aria-labelledby="mc-define">
        <div className="mc-in">
          <h2 id="mc-define" className="mc-serif">
            AssetMeet
          </h2>
          <p className="mc-say">
            / ˈa-sət mēt /
            <button onClick={say} aria-label="Hear it pronounced">
              <Volume2 size={16} />
            </button>
          </p>
          <p className="mc-quote">
            “A property network for Kerala, where every building is an asset, every requirement is an opportunity, and every
            verified match is a potential transaction.”
          </p>
        </div>
      </section>

      <section className="mc-slide" aria-labelledby="mc-promise">
        <div className="mc-in">
          <h2 id="mc-promise" className="mc-serif">
            Our Promise
          </h2>
          <ol className="mc-promises">
            {promises.map(([n, line]) => (
              <li key={n}>
                <span className="mc-roman">{n}</span> {line}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mc-slide mc-mint" id="start-here" aria-labelledby="mc-start">
        <div className="mc-in mc-wide">
          <h2 id="mc-start" className="mc-serif">
            Start Here
          </h2>
          <ul className="mc-doors">
            {doors.map((d) => {
              const Icon = d.icon;
              return (
                <li key={d.title}>
                  <Link href={d.href}>
                    <span className="mc-door-icon">
                      <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <b>{d.title}</b>
                    <span>{d.text}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mc-slide mc-green mc-close" aria-label="Get in touch">
        <div className="mc-in">
          <p>
            Own a building, plot or space in Kerala?
            <br />
            <Link href={start("property")}>List it on AssetMeet →</Link>
          </p>
          <p>
            Looking for space for your business?
            <br />
            <Link href={start("requirement")}>Post a requirement →</Link>
          </p>
          <p>
            Engineer, architect or builder?
            <br />
            <Link href={start("property")}>Join as a professional →</Link>
          </p>
          <p>
            Already with us? <Link href="/?view=app&mode=signin">Sign in</Link>
          </p>
          <small>© {new Date().getFullYear()} AssetMeet · Kerala</small>
        </div>
      </section>
    </main>
  );
}
