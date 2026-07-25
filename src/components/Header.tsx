"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const storyDesks = [
  { label: "World & Markets", href: "/#news-world-and-markets" },
  { label: "AI & Builders", href: "/#news-ai-and-builders" },
  { label: "Restaurant Business", href: "/#news-restaurant-business" },
  { label: "Sports & Betting", href: "/#news-sports-and-betting" },
  { label: "Nashua & New Hampshire", href: "/#news-nashua-and-new-hampshire" },
];

const navItems = [
  { label: "Roster", href: "/#projects" },
  { label: "Swarm", href: "/#swarm" },
  { label: "The Pit", href: "/#pit" },
  { label: "Subscribe", href: "/#newsletter" },
  { label: "Wire", href: "/#connect" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const storyRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    function closeStory(event: MouseEvent) {
      if (storyRef.current && !storyRef.current.contains(event.target as Node)) {
        setStoryOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setStoryOpen(false);
    }

    document.addEventListener("mousedown", closeStory);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeStory);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function closeMenus() {
    setOpen(false);
    setStoryOpen(false);
  }

  return (
    <header className="nav-wrap">
      <div className="nav-inner">
        <Link href="/" className="nav-logo" aria-label="DBTech45 home">
          <span>DBTech45</span>
          <span className="sharpie" style={{ fontSize: 16, marginLeft: 4 }}>/ almanac</span>
        </Link>

        <ul className={`nav-links ${open ? "open" : ""}`}>
          <li className="nav-dropdown" ref={storyRef}>
            <button
              className="nav-story-toggle"
              type="button"
              aria-haspopup="menu"
              aria-expanded={storyOpen}
              onClick={() => setStoryOpen((value) => !value)}
            >
              Story <span aria-hidden="true">▾</span>
            </button>
            <div className={`nav-story-menu ${storyOpen ? "open" : ""}`} role="menu">
              {storyDesks.map((desk) => (
                <a href={desk.href} role="menuitem" key={desk.label} onClick={closeMenus}>
                  {desk.label}
                </a>
              ))}
              <Link href="/news" role="menuitem" className="nav-archive-link" onClick={closeMenus}>
                Daily Archive
              </Link>
            </div>
          </li>

          {navItems.map((item) => (
            <li key={item.label}>
              <a href={item.href} onClick={closeMenus}>
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
