import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { newsEditions } from "@/lib/news";

export const metadata: Metadata = {
  title: "7 PM News Archive | DBTech45",
  description: "Every edition of Derek Bobola's nightly 7 PM news briefing.",
};

export default function NewsArchivePage() {
  return (
    <div className="brand">
      <Header />
      <main>
        <section className="ink-section news-archive" aria-labelledby="news-archive-title">
          <div className="wrap">
            <div className="label">The 7 PM File</div>
            <div className="news-archive-heading">
              <div>
                <h1 className="display-md" id="news-archive-title">Daily Archive</h1>
                <p>Every filed edition, newest first. Nothing disappears when tomorrow&apos;s briefing arrives.</p>
              </div>
              <Link className="btn ghost" href="/#about">Tonight&apos;s edition</Link>
            </div>

            <div className="news-archive-list">
              {newsEditions.map((edition) => (
                <article className="news-archive-card" key={edition.dateTime}>
                  <time dateTime={edition.dateTime}>{edition.date}</time>
                  <h2>
                    <Link href={`/news/${edition.dateTime}`}>{edition.summary}</Link>
                  </h2>
                  <div className="news-archive-counts">
                    {edition.categories.map((category) => (
                      <span key={category.name}>
                        {category.name} · {category.stories.length}
                      </span>
                    ))}
                  </div>
                  <Link className="news-archive-open" href={`/news/${edition.dateTime}`}>
                    Open edition →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
