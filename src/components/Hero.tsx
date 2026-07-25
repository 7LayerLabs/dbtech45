export default function Hero() {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).toUpperCase();

  return (
    <section className="ink-section hero-wrap" aria-label="Hero">
      <div className="wrap">
        <div className="masthead">
          <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 6 }}>
            Volume XLV, Desk 7 <span className="sharpie" style={{ fontSize: 18, marginLeft: 8 }}>est. right now</span>
          </div>
          <div className="masthead-title">The DBTech45 Almanac</div>
          <div className="masthead-meta">
            <span>Nashua, NH</span>
            <span>Fueled by Caffeine and Chaos</span>
            <span>{date}</span>
          </div>
        </div>

        <div className="cols-2" style={{ marginTop: 12 }}>
          <div>
            <div className="label">Lead Story</div>
            <h1 className="display">
              Dad of <span className="red-circle">7</span>.
              <br />
              Trader. Operator.
              <br />
              <span className="red-mark">Serial Builder.</span>
            </h1>
            <p className="drop-cap" style={{ marginTop: 28, fontSize: 17, lineHeight: 1.7 }}>
              Derek Bobola runs Bobola&apos;s Restaurant by day, trades futures before
              sunrise, and ships software with a swarm of AI agents in between.
              This almanac is his working notebook: projects in flight, market
              reads, restaurant ops, and the handwritten margin notes that tie
              it all together.
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
              <a href="#projects" className="btn">See the roster</a>
              <a href="#newsletter" className="btn ghost">Subscribe</a>
            </div>
            <p className="sharpie" style={{ fontSize: 22, marginTop: 20, transform: "rotate(-2deg)", display: "inline-block" }}>
              nine projects. zero sick days.
            </p>
          </div>

          <aside>
            <div className="label">Filed This Week</div>
            <ul className="typewriter" style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14 }}>
              <li style={{ borderTop: "2px solid var(--ink)", padding: "10px 0" }}>
                <strong>tickR</strong> trade journal v2 shipped to beta cohort.
              </li>
              <li style={{ borderTop: "1px solid rgba(0,0,0,0.2)", padding: "10px 0" }}>
                <strong>Signal &amp; Noise</strong> daily wire crossed 1,200 subs.
              </li>
              <li style={{ borderTop: "1px solid rgba(0,0,0,0.2)", padding: "10px 0" }}>
                <strong>MenuSparks</strong> vendor pricing upload live.
              </li>
              <li style={{ borderTop: "1px solid rgba(0,0,0,0.2)", padding: "10px 0" }}>
                <strong>Milo</strong> routed 4,118 agent tasks last month.
              </li>
              <li style={{ borderTop: "1px solid rgba(0,0,0,0.2)", borderBottom: "2px solid var(--ink)", padding: "10px 0" }}>
                <strong>Bobby</strong> flagged ES 5,480 breakout Monday 9:34 ET.
              </li>
            </ul>
            <p className="sharpie" style={{ fontSize: 20, marginTop: 10 }}>see page 3</p>
          </aside>
        </div>

        <div className="trifecta-strip" aria-hidden="true" />
        <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 6, textAlign: "center", opacity: 0.7 }}>
          FIG. 1 / THE DAILY THREE: CODE, BALLGAME, MARKET.
        </div>
      </div>
    </section>
  );
}
