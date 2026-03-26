'use client';
import { useState } from 'react';
import {
  Mic, Link2, Loader2, Sparkles, Copy, Check, Download,
  ChevronDown, ChevronUp, Clock, Radio, FileText, Zap,
  Twitter, BookOpen, MessageSquare
} from 'lucide-react';

const M = "'JetBrains Mono','Fira Code',monospace";

const FORMATS = [
  { id: 'full', label: 'Full Summary', icon: BookOpen, desc: 'TL;DR + insights + quotes + takeaways' },
  { id: 'tldr', label: 'TL;DR', icon: Zap, desc: '5-7 bullet quick read' },
  { id: 'quotes', label: 'Best Quotes', icon: MessageSquare, desc: '8-10 memorable lines' },
  { id: 'takeaways', label: 'Takeaways', icon: Sparkles, desc: 'Actionable items only' },
  { id: 'thread', label: 'X Thread', icon: Twitter, desc: 'Ready-to-post thread' },
];

type Stage = 'idle' | 'fetching-info' | 'ready' | 'downloading' | 'transcribing' | 'summarizing' | 'done' | 'error';

interface EpisodeInfo {
  title: string;
  podcast: string;
  description: string;
  duration: number;
  thumbnail: string | null;
  upload_date: string | null;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function SummaryDisplay({ summary }: { summary: string }) {
  const [copied, setCopied] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'podsnap-summary.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = summary.split('\n').filter(l => l.trim());

  return (
    <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '24px' }}>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'flex-end' }}>
        <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '6px 12px', color: '#f59e0b', cursor: 'pointer', fontSize: 13, fontFamily: M }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '6px 12px', color: '#f59e0b', cursor: 'pointer', fontSize: 13, fontFamily: M }}>
          <Download size={14} /> Save
        </button>
      </div>

      {/* Summary content */}
      <div style={{ fontFamily: "'Inter',sans-serif", lineHeight: 1.7, color: '#e5e5e5' }}>
        {lines.map((line, i) => {
          const isHeader = /^[A-Z][A-Z\s]+$/.test(line.trim()) && line.trim().length < 40;
          const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().match(/^\d+\./);

          if (isHeader) {
            return (
              <div key={i} style={{ color: '#f59e0b', fontFamily: M, fontSize: 11, letterSpacing: '0.15em', marginTop: i === 0 ? 0 : 24, marginBottom: 10, opacity: 0.9 }}>
                {line.trim()}
              </div>
            );
          }

          if (isBullet) {
            return (
              <div key={i} style={{ paddingLeft: 16, marginBottom: 8, fontSize: 15, color: '#d4d4d4', borderLeft: '2px solid rgba(245,158,11,0.3)', marginLeft: 4 }}>
                {line.trim().replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '')}
              </div>
            );
          }

          // Quote detection
          if (line.trim().startsWith('"') || line.trim().startsWith('\u201c')) {
            return (
              <div key={i} style={{ padding: '10px 16px', margin: '10px 0', background: 'rgba(245,158,11,0.06)', borderLeft: '3px solid #f59e0b', borderRadius: '0 8px 8px 0', fontSize: 14, fontStyle: 'italic', color: '#fbbf24' }}>
                {line.trim()}
              </div>
            );
          }

          return (
            <p key={i} style={{ marginBottom: 10, fontSize: 15, color: '#d4d4d4' }}>
              {line.trim()}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default function PodSnapPage() {
  const [url, setUrl] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [episodeInfo, setEpisodeInfo] = useState<EpisodeInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('full');
  const [summary, setSummary] = useState('');
  const [transcript, setTranscript] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);

  const fetchInfo = async () => {
    if (!url.trim()) return;
    setStage('fetching-info');
    setError('');
    setEpisodeInfo(null);
    setSummary('');

    try {
      const res = await fetch('/api/podsnap/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch episode info');
      setEpisodeInfo(data);
      setStage('ready');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch episode info');
      setStage('error');
    }
  };

  const processEpisode = async () => {
    if (!episodeInfo) return;
    setStage('downloading');
    setError('');
    setSummary('');

    // Simulate stage progression for UX
    const stageTimer = setTimeout(() => setStage('transcribing'), 15000);
    const stageTimer2 = setTimeout(() => setStage('summarizing'), 120000);

    try {
      const res = await fetch('/api/podsnap/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          title: episodeInfo.title,
          podcast: episodeInfo.podcast,
          format: selectedFormat,
        }),
      });
      clearTimeout(stageTimer);
      clearTimeout(stageTimer2);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Processing failed');

      setSummary(data.summary);
      setTranscript(data.transcript);
      setWordCount(data.wordCount);
      setStage('done');
    } catch (err: unknown) {
      clearTimeout(stageTimer);
      clearTimeout(stageTimer2);
      setError(err instanceof Error ? err.message : 'Processing failed');
      setStage('error');
    }
  };

  const stageMessages: Record<string, string> = {
    'fetching-info': 'Fetching episode info...',
    'downloading': 'Downloading audio... (this can take 1-2 min)',
    'transcribing': 'Transcribing with Whisper AI...',
    'summarizing': 'Claude is reading and summarizing...',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#06070b', color: '#f5f5f5', padding: '32px 24px', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(245,158,11,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Radio size={20} color="#f59e0b" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: M, color: '#f59e0b', margin: 0, letterSpacing: '0.05em' }}>PODSNAP</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, fontFamily: M }}>podcast → instant intelligence</p>
          </div>
        </div>
      </div>

      {/* URL Input */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 11, fontFamily: M, color: 'rgba(245,158,11,0.7)', letterSpacing: '0.1em', marginBottom: 8 }}>
          PODCAST URL
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '0 14px', gap: 10 }}>
            <Link2 size={16} color="rgba(245,158,11,0.5)" />
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchInfo()}
              placeholder="Paste any podcast URL — Amazon Music, Spotify, Apple, RSS, MP3..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f5f5f5', fontSize: 14, fontFamily: M, padding: '14px 0' }}
            />
          </div>
          <button
            onClick={fetchInfo}
            disabled={!url.trim() || ['fetching-info', 'downloading', 'transcribing', 'summarizing'].includes(stage)}
            style={{ background: url.trim() ? '#f59e0b' : 'rgba(245,158,11,0.2)', color: url.trim() ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 10, padding: '0 20px', cursor: url.trim() ? 'pointer' : 'not-allowed', fontFamily: M, fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
          >
            FETCH INFO
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8, fontFamily: M }}>
          Supports: Amazon Music, Spotify, Apple Podcasts, direct MP3, RSS feeds
        </p>
      </div>

      {/* Loading state */}
      {['fetching-info', 'downloading', 'transcribing', 'summarizing'].includes(stage) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, marginBottom: 24 }}>
          <Loader2 size={18} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontFamily: M, fontSize: 13, color: '#f59e0b' }}>{stageMessages[stage]}</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {stage === 'error' && error && (
        <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, marginBottom: 24, color: '#fca5a5', fontFamily: M, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Episode Info Card */}
      {episodeInfo && (stage === 'ready' || stage === 'done') && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: 20, marginBottom: 24, display: 'flex', gap: 16 }}>
          {episodeInfo.thumbnail && (
            <img src={episodeInfo.thumbnail} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontFamily: M, color: '#f59e0b', letterSpacing: '0.1em', marginBottom: 4 }}>{episodeInfo.podcast.toUpperCase()}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f5', marginBottom: 6, lineHeight: 1.4 }}>{episodeInfo.title}</div>
            {episodeInfo.description && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 8 }}>
                {episodeInfo.description.substring(0, 200)}{episodeInfo.description.length > 200 ? '...' : ''}
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, fontSize: 12, fontFamily: M, color: 'rgba(255,255,255,0.35)' }}>
              {episodeInfo.duration > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> {formatDuration(episodeInfo.duration)}
                </span>
              )}
              {wordCount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileText size={12} /> ~{wordCount.toLocaleString()} words transcribed
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Format Selector + Process Button */}
      {stage === 'ready' && episodeInfo && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontFamily: M, color: 'rgba(245,158,11,0.7)', letterSpacing: '0.1em', marginBottom: 12 }}>SUMMARY FORMAT</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {FORMATS.map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFormat(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px',
                  background: selectedFormat === f.id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedFormat === f.id ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8, cursor: 'pointer',
                  color: selectedFormat === f.id ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                  fontFamily: M, fontSize: 12, transition: 'all 0.15s',
                }}
              >
                <f.icon size={13} />
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16, fontFamily: M }}>
            {FORMATS.find(f => f.id === selectedFormat)?.desc}
          </div>
          <button
            onClick={processEpisode}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f59e0b', color: '#000', border: 'none', borderRadius: 10, padding: '14px 28px', cursor: 'pointer', fontFamily: M, fontSize: 14, fontWeight: 700, letterSpacing: '0.05em' }}
          >
            <Mic size={16} />
            PODSNAP THIS EPISODE
          </button>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 10, fontFamily: M }}>
            ⚠️ Takes 2-5 min depending on episode length — don&apos;t close this tab
          </p>
        </div>
      )}

      {/* Results */}
      {stage === 'done' && summary && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Sparkles size={16} color="#f59e0b" />
            <span style={{ fontFamily: M, fontSize: 12, color: '#f59e0b', letterSpacing: '0.1em' }}>PODSNAP COMPLETE</span>
          </div>
          <SummaryDisplay summary={summary} />

          {/* Transcript toggle */}
          {transcript && (
            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontFamily: M, fontSize: 12 }}
              >
                <FileText size={13} />
                {showTranscript ? 'Hide' : 'Show'} Full Transcript
                {showTranscript ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {showTranscript && (
                <div style={{ marginTop: 12, padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, maxHeight: 400, overflowY: 'auto', fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', fontFamily: M, whiteSpace: 'pre-wrap' }}>
                  {transcript}
                </div>
              )}
            </div>
          )}

          {/* Try another */}
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => { setStage('idle'); setUrl(''); setEpisodeInfo(null); setSummary(''); setTranscript(''); }}
              style={{ background: 'none', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: 'rgba(245,158,11,0.6)', fontFamily: M, fontSize: 12 }}
            >
              ← Snap Another Episode
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
