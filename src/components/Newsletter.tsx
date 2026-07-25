"use client";
import { useEffect, useRef } from "react";

export default function Newsletter() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      sectionRef.current.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    }
    return () => observer.disconnect();
  }, []);

  const letters = [
    {
      title: "Signal & Noise",
      freq: "Daily Wire",
      desc: "Market intelligence filtered through 15 years of trading. Technical analysis, macro themes, conviction plays, sent before the open.",
      href: "/newsletter/signal-noise",
    },
    {
      title: "The Operator",
      freq: "Weekly Dispatch",
      desc: "Real talk for independent restaurant owners. Operations, margins, staffing, survival tactics, filed every Monday.",
      href: "/newsletter/operator",
    },
  ];

  return (
    <section className="ink-section" id="newsletter" aria-label="Newsletters" ref={sectionRef}>
      <div className="wrap">
        <div className="reveal" style={{ marginBottom: 24 }}>
          <div className="label">Section V. Subscription</div>
          <h2 className="display-md">Signed, sealed, subscribed.</h2>
          <p className="sharpie" style={{ fontSize: 22, marginTop: 4, transform: "rotate(-2deg)", display: "inline-block" }}>
            clip and return.
          </p>
        </div>

        <div className="cols-equal reveal">
          {letters.map((n) => (
            <a key={n.title} href={n.href} className="slip" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
              <div className="label">{n.freq}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                <h3 style={{ fontSize: 32 }}>{n.title}</h3>
                <span className="odds building">Free</span>
              </div>
              <p className="typewriter" style={{ fontSize: 14, marginBottom: 14 }}>{n.desc}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed rgba(0,0,0,0.4)", paddingTop: 12 }}>
                <span className="sharpie" style={{ fontSize: 22 }}>get on the list</span>
                <span className="typewriter" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" }}>Subscribe &rsaquo;</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
