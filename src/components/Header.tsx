"use client";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: "Story", href: "#about" },
    { label: "Roster", href: "#projects" },
    { label: "Swarm", href: "#swarm" },
    { label: "The Pit", href: "#pit" },
    { label: "Subscribe", href: "#newsletter" },
    { label: "Wire", href: "#connect" },
  ];

  return (
    <header className="nav-wrap">
      <div className="nav-inner">
        <a href="#" className="nav-logo" aria-label="DBTech45 home">
          <span>DBTech45</span>
          <span className="sharpie" style={{ fontSize: 16, marginLeft: 4 }}>/ almanac</span>
        </a>

        <ul className={`nav-links ${open ? "open" : ""}`}>
          {navItems.map((item) => (
            <li key={item.label}>
              <a href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          className="hamburger"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
