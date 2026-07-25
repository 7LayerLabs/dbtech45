"use client";

import { useEffect, useRef } from "react";
import marketDesk from "@/data/marketDesk.json";

const updatedDate = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/New_York",
}).format(new Date(marketDesk.asOf));

export default function ThePit() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.08 },
    );

    const section = sectionRef.current;
    section?.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="splatter" aria-hidden="true" />
      <section className="ink-section pit" id="pit" aria-label="The Pit market guide" ref={sectionRef}>
        <div className="wrap">
          <header className="pit-heading reveal">
            <div>
              <span className="eyebrow">markets in plain English</span>
              <h2 className="display-md">The Pit</h2>
              <p>What moved, what is coming, and why a beginner should care.</p>
            </div>
            <time dateTime={marketDesk.asOf}>
              Data through {updatedDate}
              <span>Refreshed with the 7 PM edition</span>
            </time>
          </header>

          <div className="pit-sentiment-grid reveal">
            <article className="pit-sentiment-card pit-sentiment-main">
              <span className="pit-card-label">Market sentiment</span>
              <strong>{marketDesk.sentiment.label}</strong>
              <p>{marketDesk.sentiment.explanation}</p>
            </article>

            <article className="pit-sentiment-card">
              <span className="pit-card-label">VIX · fear meter</span>
              <strong>{marketDesk.vix.value}</strong>
              <p>{marketDesk.vix.explanation}</p>
              <a href={marketDesk.vix.source.url} target="_blank" rel="noopener noreferrer">
                Source: {marketDesk.vix.source.label} ↗
              </a>
            </article>

            <article className="pit-sentiment-card">
              <span className="pit-card-label">10-year Treasury yield</span>
              <strong>{marketDesk.tenYear.value}</strong>
              <p>{marketDesk.tenYear.explanation}</p>
              <a href={marketDesk.tenYear.source.url} target="_blank" rel="noopener noreferrer">
                Source: {marketDesk.tenYear.source.label} ↗
              </a>
            </article>
          </div>

          <section className="pit-block reveal" aria-labelledby="pit-stock-news">
            <div className="pit-block-heading">
              <div>
                <span className="eyebrow">the important moves</span>
                <h3 id="pit-stock-news">Stock news, translated</h3>
              </div>
              <p>Not every headline matters. These are the stories changing what investors expect next.</p>
            </div>

            <div className="pit-news-list">
              {marketDesk.stockNews.map((story, index) => (
                <article className="pit-news-story" key={story.headline}>
                  <span className="pit-story-number">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h4>
                      <a href={story.url} target="_blank" rel="noopener noreferrer">
                        {story.headline} ↗
                      </a>
                    </h4>
                    <p>{story.brief}</p>
                    <aside className="pit-translation">
                      <span>What this means</span>
                      <p>{story.beginnerTakeaway}</p>
                    </aside>
                    <small>Source: {story.sourceLabel}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="pit-block reveal" aria-labelledby="pit-earnings">
            <div className="pit-block-heading">
              <div>
                <span className="eyebrow">company report cards</span>
                <h3 id="pit-earnings">Earnings coming up</h3>
              </div>
              <p>Earnings cover the last quarter. Guidance is management&apos;s forecast—and often moves the stock more.</p>
            </div>

            <dl className="pit-glossary" aria-label="Earnings terms">
              <div><dt>Revenue</dt><dd>Total sales</dd></div>
              <div><dt>EPS</dt><dd>Profit per share</dd></div>
              <div><dt>Guidance</dt><dd>Management&apos;s forecast</dd></div>
            </dl>

            <div className="pit-card-grid">
              {marketDesk.earnings.map((item) => (
                <article className="pit-learning-card" key={item.ticker}>
                  <header>
                    <span className="pit-ticker">{item.ticker}</span>
                    <time>{item.date}</time>
                  </header>
                  <h4>{item.company}</h4>
                  <p>{item.whatItDoes}</p>
                  <div className="pit-watch">
                    <span>Watch this</span>
                    <p>{item.whatToWatch}</p>
                  </div>
                  <aside className="pit-translation">
                    <span>What this means</span>
                    <p>{item.beginnerTakeaway}</p>
                  </aside>
                  <a href={item.source.url} target="_blank" rel="noopener noreferrer">
                    {item.source.label} ↗
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="pit-block reveal" aria-labelledby="pit-ipos">
            <div className="pit-block-heading">
              <div>
                <span className="eyebrow">new to the market</span>
                <h3 id="pit-ipos">IPO watch</h3>
              </div>
              <p>An IPO is the first public sale of a private company&apos;s stock. The opening price can move far beyond the advertised range.</p>
            </div>

            <div className="pit-card-grid pit-ipo-grid">
              {marketDesk.ipos.map((item) => (
                <article className="pit-learning-card" key={item.ticker}>
                  <header>
                    <span className="pit-ticker">{item.ticker}</span>
                    <time>{item.expectedDate}</time>
                  </header>
                  <h4>{item.company}</h4>
                  <strong className="pit-price-range">{item.priceRange}</strong>
                  <p>{item.whatItDoes}</p>
                  <aside className="pit-translation">
                    <span>What this means</span>
                    <p>{item.beginnerTakeaway}</p>
                  </aside>
                  <a href={item.source.url} target="_blank" rel="noopener noreferrer">
                    {item.source.label} ↗
                  </a>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
