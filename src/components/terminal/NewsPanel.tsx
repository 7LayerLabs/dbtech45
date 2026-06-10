'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { NewsItem, NewsArchiveResult } from './types';
import { Panel, Icons, Offline, Loading, T } from './shared';

function NewsList({ items }: { items: NewsItem[] }) {
  return (
    <>
      {items.map((i, n) => (
        <div className="dbt-news-item" key={n}>
          <a href={i.link} target="_blank" rel="noopener noreferrer">
            {i.title}
          </a>
          <div className="dbt-news-meta">
            <span className="src">{i.source}</span>{' '}
            {i.date
              ? '· ' +
                new Date(i.date).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : ''}
          </div>
        </div>
      ))}
    </>
  );
}

// News wire — live feed (5 min poll) + full archive search
export default function NewsPanel() {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [query, setQuery] = useState('');
  const [archiveMode, setArchiveMode] = useState(false);
  const [archive, setArchive] = useState<NewsArchiveResult | null>(null);
  const [archiveFailed, setArchiveFailed] = useState(false);
  const [sub, setSub] = useState('market + watchlist');
  const archiveModeRef = useRef(archiveMode);
  archiveModeRef.current = archiveMode;

  const loadLive = useCallback(async () => {
    if (archiveModeRef.current) return; // don't stomp search results with the live wire
    try {
      const r = await fetch('/api/terminal/news-live');
      if (!r.ok) throw new Error('news');
      const data = (await r.json()) as NewsItem[];
      if (!Array.isArray(data)) return;
      setItems(data);
      setOffline(false);
    } catch {
      setItems((prev) => {
        if (!prev) setOffline(true);
        return prev;
      });
    }
  }, []);

  useEffect(() => {
    loadLive();
    const t = setInterval(loadLive, 5 * 60000);
    return () => clearInterval(t);
  }, [loadLive]);

  const search = async () => {
    const q = query.trim();
    if (!q) {
      clearSearch();
      return;
    }
    setArchiveMode(true);
    setArchiveFailed(false);
    try {
      const r = await fetch(`/api/terminal/news-archive?q=${encodeURIComponent(q)}&limit=200`);
      if (!r.ok) throw new Error('archive');
      const data = (await r.json()) as NewsArchiveResult;
      setArchive(data);
      setSub(`archive: ${data.matched} of ${data.total} saved`);
    } catch {
      setArchive(null);
      setArchiveFailed(true);
    }
  };

  const clearSearch = () => {
    setArchiveMode(false);
    setArchive(null);
    setArchiveFailed(false);
    setQuery('');
    setSub('market + watchlist');
    loadLive();
  };

  return (
    <Panel
      icon={Icons.news}
      title="NEWS WIRE"
      sub={sub}
      headExtra={
        <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>
          <input
            placeholder="Search archive (every headline ever seen)..."
            style={{ flex: 1 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') search();
            }}
          />
          <button onClick={search}>SEARCH</button>
          <button onClick={clearSearch} title="Back to live wire">
            LIVE
          </button>
        </div>
      }
    >
      {archiveMode ? (
        archiveFailed ? (
          <Loading label="Archive search failed" />
        ) : archive ? (
          archive.items.length ? (
            <NewsList items={archive.items} />
          ) : (
            <Loading label={`No archived headlines match "${query.trim()}"`} />
          )
        ) : (
          <Loading label="Searching archive..." />
        )
      ) : items ? (
        <NewsList items={items} />
      ) : offline ? (
        <Offline label="NEWS WIRE OFFLINE — RETRYING" />
      ) : (
        <Loading label="Pulling headlines..." />
      )}
    </Panel>
  );
}
