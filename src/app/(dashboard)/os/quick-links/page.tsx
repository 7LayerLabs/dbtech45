import { brand, styles } from "@/lib/brand";

const groups = [
  { title: "DBTech Infrastructure", links: [
    { label: "Vercel Dashboard (DBTech45)", url: "https://vercel.com/milos-projects-b55f88cf/dbtech45" },
    { label: "GitHub Repo (dbtech45)", url: "https://github.com/Milobuilds45/dbtech45" },
    { label: "Supabase Console (dbtech45-os)", url: "https://supabase.com/dashboard/project/hnkjhhabebzmcwwhhfeu" },
    { label: "Live Site", url: "https://dbtech45.vercel.app" },
  ]},
  { title: "Development", links: [
    { label: "GitHub Org (Milobuilds45)", url: "https://github.com/Milobuilds45" },
    { label: "Claude Console", url: "https://console.anthropic.com" },
    { label: "Vercel Dashboard (All Projects)", url: "https://vercel.com/milos-projects-b55f88cf" },
    { label: "Supabase Dashboard", url: "https://supabase.com/dashboard" },
  ]},
  { title: "Trading", links: [
    { label: "ThinkOrSwim", url: "https://www.schwab.com/" },
    { label: "TradingView", url: "https://tradingview.com" },
    { label: "FinViz Screener", url: "https://finviz.com" },
    { label: "FRED Economic Data", url: "https://fred.stlouisfed.org" },
  ]},
  { title: "AI Tools", links: [
    { label: "Model Counsel", url: "/model-counsel" },
    { label: "Claude.ai", url: "https://claude.ai" },
    { label: "ChatGPT", url: "https://chat.openai.com" },
    { label: "Gemini", url: "https://gemini.google.com" },
    { label: "Grok (xAI)", url: "https://grok.x.ai" },
    { label: "Artificial Analysis", url: "https://artificialanalysis.ai/" },
    { label: "ClawHub", url: "https://clawhub.ai/" },
  ]},
  { title: "Brand & Design", links: [
    { label: "Brand Kit", url: "/brand-kit" },
    { label: "Design System Spec", url: "/brand-spec" },
    { label: "Agent Icons Repo", url: "https://github.com/7LayerLabs/dbtech45-agent-icons-v3" },
  ]},
];

export default function QuickLinks() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.h1}>Quick Links</h1>
        <p style={styles.subtitle}>Essential tools and resources. All links verified against DBTech45 infrastructure.</p>

        <div style={styles.grid}>
          {groups.map((g, i) => (
            <div key={i} style={styles.card}>
              <h3 style={{ color: brand.amber, marginBottom: '1rem', fontSize: '14px', fontWeight: 600, fontFamily: "'Space Grotesk', system-ui, sans-serif", letterSpacing: '-0.01em' }}>{g.title}</h3>
              {g.links.map((link, j) => (
                <div key={j} style={{ marginBottom: '0.75rem' }}>
                  <a href={link.url} target={link.url.startsWith('/') ? undefined : '_blank'} rel="noopener noreferrer"
                    style={{ color: brand.silver, textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {link.label}
                    {!link.url.startsWith('/') && <span style={{ fontSize: '10px', color: brand.smoke }}>&#8599;</span>}
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <a href="/os" style={styles.backLink}>Back to Mission Control</a>
        </div>
      </div>
    </div>
  );
}
