"use client";
import { useState } from "react";

interface Agent {
  num: string;
  name: string;
  role: string;
  description: string;
  handles: string[];
  motto: string;
}

const AGENTS: Agent[] = [
  { num: "01", name: "Milo",   role: "Head of Staff",   description: "Routes every task, manages priorities, orchestrates the swarm.", handles: ["Task routing", "Priorities", "Orchestration"], motto: "Keep the trains moving." },
  { num: "02", name: "Anders", role: "Full Stack Dev",  description: "Turns designs into deployed production grade code. Ships fast, breaks nothing.", handles: ["Architecture", "Reviews", "Deployments", "Performance"], motto: "Ship it." },
  { num: "03", name: "Paula",  role: "Design Director", description: "Brand identity, UI and UX, visual systems. Makes chaos look intentional.", handles: ["Brand", "UI", "Design systems", "Visual QA"], motto: "Less, but better." },
  { num: "04", name: "Bobby",  role: "Trading Systems", description: "Market analysis, signal generation, risk. Always watching the tape.", handles: ["Trade signals", "Risk", "Research", "Portfolio"], motto: "The market is always right." },
  { num: "05", name: "Remy",   role: "Restaurant Ops",  description: "Restaurant operations and marketing. Handles kitchen ops, costs, inventory.", handles: ["Ops", "Food costs", "Inventory", "Marketing"], motto: "Operational excellence." },
  { num: "06", name: "Dax",    role: "Content",         description: "Newsletters, storytelling, data narratives. Turns ideas into words that land.", handles: ["Newsletter", "Strategy", "Storytelling", "Copy"], motto: "Words that work." },
  { num: "07", name: "Webb",   role: "Research",        description: "Deep dives, competitive analysis, data synthesis.", handles: ["Research", "Competitive intel", "Trend analysis", "Reports"], motto: "Data before decisions." },
  { num: "08", name: "Dwight", role: "Intel",           description: "Real time news monitoring, event detection, macro awareness.", handles: ["News", "Alerts", "Macro", "Briefs"], motto: "First to know." },
  { num: "09", name: "Wendy",  role: "Psychology",      description: "Habits, focus, energy management. The coach who never quits on you.", handles: ["Habits", "Focus", "Energy", "Motivation"], motto: "Small wins compound." },
];

function RosterCell({ agent }: { agent: Agent }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="roster-cell"
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); } }}
    >
      <div className="roster-head">
        <span className="roster-num">{agent.num}</span>
        <div>
          <div className="roster-name">{agent.name}</div>
          <div className="roster-role">{agent.role}</div>
        </div>
      </div>

      <p className="typewriter" style={{ fontSize: 14, marginTop: 10 }}>{agent.description}</p>

      {open && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.3)" }}>
          <div className="label" style={{ marginBottom: 8 }}>Beat</div>
          <ul className="typewriter" style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
            {agent.handles.map((h) => (
              <li key={h} style={{ padding: "2px 0" }}>&#8250; {h}</li>
            ))}
          </ul>
          <p className="sharpie" style={{ fontSize: 20, marginTop: 10 }}>&ldquo;{agent.motto}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

const STATS = [
  { value: "24/7", label: "Uptime" },
  { value: "9",    label: "Agents" },
  { value: "0",    label: "Sick Days" },
  { value: "1",    label: "Head Coach" },
];

export default function TheTeam() {
  return (
    <section className="ink-section" id="swarm" aria-label="The Swarm">
      <div className="wrap">
        <div style={{ marginBottom: 24 }}>
          <div className="label">Section III. Roster / The Swarm</div>
          <h2 className="display-md">Nine on the beat.</h2>
          <p className="typewriter" style={{ fontSize: 15, marginTop: 10, maxWidth: 640 }}>
            I do not have a team of 50. I have nine AI agents who never sleep,
            routed by a head of staff named Milo. Below is the full beat sheet.
            Click a cell to see their handles.
          </p>
        </div>

        <div className="roster">
          {AGENTS.map((a) => <RosterCell key={a.name} agent={a} />)}
        </div>

        <div className="grid-4" style={{ marginTop: 32 }}>
          {STATS.map((s) => (
            <div key={s.label} className="stat">
              <div className="stat-num">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
