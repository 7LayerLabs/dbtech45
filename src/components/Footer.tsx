export default function Footer() {
  return (
    <footer className="brand-footer">
      <div className="wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 18, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          &copy; {new Date().getFullYear()} DBTech45 Almanac. Printed daily, Nashua NH.
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", gap: 18, flexWrap: "wrap", fontFamily: "'Special Elite', monospace", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          <li><a href="#about">Story</a></li>
          <li><a href="#projects">Roster</a></li>
          <li><a href="#newsletter">Subscribe</a></li>
          <li><a href="/os">Newsroom</a></li>
          <li><a href="/terms">Terms</a></li>
          <li><a href="/privacy">Privacy</a></li>
        </ul>
      </div>
    </footer>
  );
}
