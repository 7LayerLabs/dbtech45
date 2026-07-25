"use client";
import { useEffect, useRef } from "react";

export default function Contact() {
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
    <section className="ink-section" id="connect" aria-label="Contact" ref={sectionRef}>
      <div className="wrap">
        <div className="reveal" style={{ marginBottom: 20 }}>
          <div className="label">Section VI. The Wire</div>
          <h2 className="display-md">Reach the desk.</h2>
          <p className="typewriter" style={{ fontSize: 15, marginTop: 8, maxWidth: 640 }}>
            Got a project? Want to collaborate? Trading idea worth arguing over?
            Two ways in. Both answered personally.
          </p>
        </div>

        <div className="cols-equal reveal">
          <a href="mailto:hello@dbtech45.com" className="slip" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
            <div className="label">By Post</div>
            <h3 style={{ fontSize: 32, marginBottom: 6 }}>Email</h3>
            <p className="typewriter" style={{ fontSize: 16 }}>hello@dbtech45.com</p>
            <p className="sharpie" style={{ fontSize: 20, marginTop: 10, transform: "rotate(-2deg)", display: "inline-block" }}>
              I read everything.
            </p>
          </a>

          <a href="https://x.com/dbtech45" target="_blank" rel="noopener noreferrer" className="slip" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
            <div className="label">By Wire</div>
            <h3 style={{ fontSize: 32, marginBottom: 6 }}>X / @dbtech45</h3>
            <p className="typewriter" style={{ fontSize: 16 }}>Fastest way to get a reply.</p>
            <p className="sharpie" style={{ fontSize: 20, marginTop: 10, transform: "rotate(-1deg)", display: "inline-block" }}>
              DMs open.
            </p>
          </a>
        </div>
      </div>
    </section>
  );
}
