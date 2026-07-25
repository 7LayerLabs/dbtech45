"use client";
import { useEffect, useRef } from "react";

type Status = "live" | "building" | "shaping" | "spark";

interface Project {
  name: string;
  desc: string;
  status: Status;
  art: string;
  note?: string;
}

const PROJECTS: Project[] = [
  { name: "tickR",              desc: "AI trading dashboard with real-time signals, journaling, and performance analytics.", status: "building", art: "/brand/project-tickr.jpg",        note: "beta cohort: 42" },
  { name: "Signal & Noise",     desc: "Daily market newsletter. Filtering noise into actionable intelligence.",              status: "live",     art: "/brand/project-signalnoise.jpg", note: "subs: 1,213" },
  { name: "Soul Solace",        desc: "AI wellness companion. Daily reflections, guided prayers, mood tracking.",            status: "building", art: "/brand/project-soulsolace.jpg",  note: "TestFlight soon" },
  { name: "Sunday Squares",     desc: "Digital football pools with auto scoring and real time payouts.",                     status: "live",     art: "/brand/project-sundaysquares.jpg", note: "week 8" },
  { name: "MenuSparks",         desc: "AI menu optimization for restaurants. Real food cost on every recipe.",               status: "building", art: "/brand/project-menusparks.jpg",  note: "v2 in flight" },
  { name: "TipSplit Pro",       desc: "Tip calculation and splitting tool built for restaurant workers.",                    status: "live",     art: "/brand/project-signalnoise.jpg", note: "App Store live" },
  { name: "Boundless",          desc: "AI journaling app. Deeper thinking through guided prompts.",                          status: "building", art: "/brand/project-soulsolace.jpg",  note: "private beta" },
  { name: "Kitchen Cost Tracker", desc: "Food cost and inventory management for multi unit operators.",                      status: "building", art: "/brand/project-menusparks.jpg",  note: "Bobola use case" },
  { name: "Receipt Scanner",    desc: "Snap a receipt, extract line items, categorize expenses. OCR meets organization.",     status: "shaping",  art: "/brand/project-tickr.jpg",       note: "scoping" },
];

export default function Projects() {
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

  return (
    <section className="ink-section" id="projects" aria-label="Projects" ref={sectionRef}>
      <div className="wrap">
        <div className="reveal" style={{ marginBottom: 24 }}>
          <div className="label">Section II. Roster</div>
          <h2 className="display-md">The Project Roster</h2>
          <p className="typewriter" style={{ fontSize: 15, marginTop: 10, maxWidth: 640 }}>
            Nine live entries this print. Status is read as LIVE shipping, BUILDING
            in the shop, SHAPING still on paper, SPARK caught but not lit.
          </p>
          <p className="sharpie" style={{ fontSize: 24, marginTop: 6, transform: "rotate(-2deg)", display: "inline-block" }}>
            read top to bottom.
          </p>
        </div>

        <div className="reveal" style={{ overflowX: "auto" }}>
          <table className="almanac">
            <thead>
              <tr>
                <th style={{ width: 70 }}>No.</th>
                <th style={{ width: 80 }}>Plate</th>
                <th>Entry</th>
                <th>Line</th>
                <th style={{ width: 180 }}>Note</th>
                <th style={{ width: 110, textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {PROJECTS.map((p, i) => (
                <tr key={p.name}>
                  <td className="typewriter">{String(i + 1).padStart(2, "0")}</td>
                  <td>
                    <div className="thumb" style={{ backgroundImage: `url(${p.art})` }} />
                  </td>
                  <td>
                    <div className="proj-name">{p.name}</div>
                  </td>
                  <td style={{ fontSize: 14 }}>{p.desc}</td>
                  <td className="sharpie" style={{ fontSize: 18 }}>{p.note}</td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`odds ${p.status}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="typewriter reveal" style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 14, opacity: 0.7 }}>
          Roster updated weekly. Ship log on page 12.
        </p>
      </div>
    </section>
  );
}
