"use client";

import { useEffect, useRef } from "react";
import { dailyNewsBrief } from "@/data/dailyNews";

function categoryId(name: string) {
  return `news-${name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.08 }
    );

    if (sectionRef.current) {
      sectionRef.current
        .querySelectorAll(".reveal")
        .forEach((element) => observer.observe(element));
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="ink-section news-brief"
      id="about"
      aria-labelledby="daily-news-title"
      ref={sectionRef}
    >
      <div className="wrap">
        <header className="news-brief-header reveal">
          <div>
            <div className="label">The 7 PM File · Daily Briefing</div>
            <h2 className="display-md" id="daily-news-title">
              Tonight&apos;s News
            </h2>
          </div>
          <time className="news-date" dateTime={dailyNewsBrief.dateTime}>
            {dailyNewsBrief.date}
            <span>Filed at 7:00 PM ET</span>
          </time>
        </header>

        <div className="news-one-line reveal">
          <span>Tonight in one line</span>
          <p>{dailyNewsBrief.summary}</p>
        </div>

        <nav className="news-index reveal" aria-label="News categories">
          {dailyNewsBrief.categories.map((category) => (
            <a key={category.name} href={`#${categoryId(category.name)}`}>
              {category.name}
              <span>{category.stories.length}</span>
            </a>
          ))}
        </nav>

        <div className="news-categories">
          {dailyNewsBrief.categories.map((category, categoryIndex) => (
            <section
              className="news-category reveal"
              id={categoryId(category.name)}
              key={category.name}
              aria-labelledby={`${categoryId(category.name)}-title`}
            >
              <div className="news-category-heading">
                <h3 id={`${categoryId(category.name)}-title`}>{category.name}</h3>
                <span>
                  {category.stories.length} {category.stories.length === 1 ? "story" : "stories"}
                </span>
              </div>

              <div className="news-story-list">
                {category.stories.map((story, storyIndex) => {
                  const previousStoryCount = dailyNewsBrief.categories
                    .slice(0, categoryIndex)
                    .reduce((total, previousCategory) => total + previousCategory.stories.length, 0);
                  const displayNumber = String(previousStoryCount + storyIndex + 1).padStart(2, "0");

                  return (
                    <article className="news-story" key={story.headline}>
                      <div className="news-story-number" aria-hidden="true">
                        {displayNumber}
                      </div>
                      <div className="news-story-body">
                        <h4>
                          <a href={story.url} target="_blank" rel="noopener noreferrer">
                            {story.headline}
                            <span className="news-external" aria-hidden="true">
                              ↗
                            </span>
                          </a>
                        </h4>
                        <p>{story.brief}</p>
                        <div className="news-sources">
                          <span>Sources</span>
                          {story.sources.map((source) => (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              key={source.url}
                            >
                              {source.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
