"use client";
import { useEffect, useRef } from "react";

export default function ThePit() {
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

  const ticker = [
    { symbol: "ES",  price: "5,487.25",  change: "+0.82%", up: true },
    { symbol: "NQ",  price: "19,812.50", change: "+1.14%", up: true },
    { symbol: "SPY", price: "547.32",    change: "+0.76%", up: true },
    { symbol: "VIX", price: "14.28",     change: "-3.12%", up: false },
    { symbol: "GC",  price: "2,341.80",  change: "+0.34%", up: true },
    { symbol: "BTC", price: "67,842",    change: "+2.41%", up: true },
    { symbol: "10Y", price: "4.287",     change: "-0.58%", up: false },
    { symbol: "DXY", price: "104.32",    change: "-0.21%", up: false },
  ];

  const signals = [
    { time: "09:34 ET", level: "INFO", text: "ES breaking above 5,480 resistance. Watching for retest and hold." },
    { time: "08:15 ET", level: "WARN", text: "VIX compression to 14 handle. Complacency zone, hedges cheap here." },
    { time: "07:02 ET", level: "HOT",  text: "BTC reclaiming 67K with volume. Momentum flip confirmed on 4H." },
  ];

  return (
    <>
      <div className="splatter" aria-hidden="true" />
      <section className="ink-section" id="pit" aria-label="The Pit" ref={sectionRef}>
        <div className="wrap">
          <div className="reveal" style={{ textAlign: "center", marginBottom: 32 }}>
            <span className="eyebrow">market status</span>
            <h2 className="display-md">The Pit</h2>
            <p style={{ fontSize: 18, marginTop: 12 }}>
              Futures, macro, conviction trades. Where the edge lives.
            </p>
          </div>

          <div className="ticker reveal" aria-label="Market ticker">
            <div className="ticker-track">
              {[...ticker, ...ticker].map((t, i) => (
                <span key={i} style={{ display: "inline-flex", gap: 10, alignItems: "baseline" }}>
                  <span>{t.symbol}</span>
                  <span style={{ color: "#FFF8E1" }}>{t.price}</span>
                  <span className={t.up ? "up" : "down"}>{t.change}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="two-col reveal" style={{ marginTop: 40, alignItems: "stretch" }}>
            <div className="ink-card">
              <div className="hand" style={{ fontSize: 26, marginBottom: 12 }}>Live signals</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {signals.map((s, i) => (
                  <li key={i} style={{ borderTop: i ? "2px solid var(--ink)" : "none", padding: "14px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Alfa Slab One', Impact, sans-serif", fontSize: 12 }}>{s.time}</span>
                      <span className={`pill ${s.level === "HOT" ? "live" : s.level === "WARN" ? "shaping" : "building"}`}>
                        {s.level}
                      </span>
                    </div>
                    <p style={{ fontSize: 15 }}>{s.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div className="ink-card">
                <div className="hand" style={{ fontSize: 22, color: "var(--ink-soft)" }}>Market sentiment</div>
                <div style={{ fontFamily: "'Alfa Slab One', Impact, sans-serif", fontSize: 40 }}>Bullish</div>
                <div style={{ fontSize: 14 }}>Fear and Greed: 72</div>
              </div>
              <div className="ink-card">
                <div className="hand" style={{ fontSize: 22, color: "var(--ink-soft)" }}>VIX</div>
                <div style={{ fontFamily: "'Alfa Slab One', Impact, sans-serif", fontSize: 40 }}>14.28</div>
                <div style={{ fontSize: 14 }}>Low volatility regime</div>
              </div>
              <div className="ink-card">
                <div className="hand" style={{ fontSize: 22, color: "var(--ink-soft)" }}>10Y Yield</div>
                <div style={{ fontFamily: "'Alfa Slab One', Impact, sans-serif", fontSize: 40 }}>4.287%</div>
                <div style={{ fontSize: 14 }}>Watching the 4.30 level</div>
              </div>
            </div>
          </div>

          <div className="ink-card reveal" style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontFamily: "'Alfa Slab One', Impact, sans-serif", fontSize: 24 }}>Signal and Noise</div>
              <p style={{ fontSize: 15 }}>Daily market intelligence. Filtered, actionable, no fluff.</p>
            </div>
            <a href="/newsletter/signal-noise" className="ink-btn">Get early access</a>
          </div>

          <p className="hand reveal" style={{ fontSize: 22, textAlign: "center", marginTop: 24, color: "var(--ink-soft)" }}>
            Powered by Bobby, the trading desk in the swarm.
          </p>
        </div>
      </section>
    </>
  );
}
