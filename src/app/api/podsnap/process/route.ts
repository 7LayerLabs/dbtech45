import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export const maxDuration = 300;
const execAsync = promisify(exec);
const MAX_CHUNK_BYTES = 24 * 1024 * 1024; // 24MB per Whisper chunk

function getYtdlpPath(): string {
  const isWindows = process.platform === 'win32';
  const binName = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
  return path.join(process.cwd(), 'bin', binName);
}

async function transcribeFile(audioPath: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const fileBuffer = await fs.readFile(audioPath);
  const fileSize = fileBuffer.length;
  const chunks: Buffer[] = [];

  if (fileSize <= MAX_CHUNK_BYTES) {
    chunks.push(fileBuffer);
  } else {
    for (let offset = 0; offset < fileSize; offset += MAX_CHUNK_BYTES) {
      chunks.push(fileBuffer.slice(offset, offset + MAX_CHUNK_BYTES));
    }
  }

  const transcripts: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(chunk)], { type: 'audio/mpeg' });
    formData.append('file', blob, `chunk-${i}.mp3`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Whisper API error: ${res.status} ${errText}`);
    }

    const text = await res.text();
    transcripts.push(text.trim());
  }

  return transcripts.join(' ');
}

async function summarizeWithClaude(transcript: string, title: string, podcast: string, format: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const formatInstructions: Record<string, string> = {
    full: `Create a comprehensive summary with these labeled sections:
TL;DR
(3-5 bullet points capturing the core of the episode)

KEY INSIGHTS
(6-8 main ideas, each 1-2 sentences)

MEMORABLE QUOTES
(4-6 best verbatim or near-verbatim quotes from the transcript)

ACTIONABLE TAKEAWAYS
(5-7 specific things the listener can apply)

FULL SUMMARY
(3-4 paragraph narrative summary of the entire conversation)`,

    tldr: `Write a punchy TL;DR section only:
TL;DR
(5-7 crisp bullet points that fully capture the episode — someone should understand everything important after reading this)`,

    quotes: `Extract the best quotes from this transcript:
MEMORABLE QUOTES
(8-10 of the most interesting, insightful, or surprising quotes — use the speaker's actual words as closely as possible. Format as: "Quote here.")`,

    takeaways: `Focus only on actionable takeaways:
ACTIONABLE TAKEAWAYS
(8-10 specific, concrete things the listener can do, think about, or apply based on this episode. Be specific, not generic.)`,

    thread: `Write this as a Twitter/X thread:
TWITTER THREAD
(10-15 tweets that break down the episode. Start with a hook tweet. Number each tweet. Each tweet max 280 chars. End with a CTA.)`,
  };

  const instruction = formatInstructions[format] || formatInstructions.full;

  // Truncate transcript if very long (Claude has 200k context but let's be safe)
  const maxTranscriptChars = 150000;
  const truncatedTranscript = transcript.length > maxTranscriptChars
    ? transcript.substring(0, maxTranscriptChars) + '\n\n[Transcript truncated for length]'
    : transcript;

  const prompt = `You are Podsnap, an expert at distilling podcast episodes into insightful summaries.

Podcast: ${podcast}
Episode: ${title}

TRANSCRIPT:
${truncatedTranscript}

${instruction}

Be specific, insightful, and capture the unique value of this episode. Don't be generic.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

export async function POST(req: NextRequest) {
  const tmpDir = os.tmpdir();
  const sessionId = Date.now().toString(36);
  const audioPath = path.join(tmpDir, `podsnap-${sessionId}.mp3`);

  try {
    const { url, title, podcast, format = 'full' } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const ytdlp = getYtdlpPath();

    // Step 1: Download audio
    console.log('[podsnap] Downloading audio from:', url);
    const dlCmd = `"${ytdlp}" -x --audio-format mp3 --audio-quality 5 --no-playlist --socket-timeout 60 -o "${audioPath}" "${url}"`;
    await execAsync(dlCmd, { timeout: 240000 });

    // Verify file exists
    const stat = await fs.stat(audioPath);
    console.log('[podsnap] Downloaded:', Math.round(stat.size / 1024 / 1024), 'MB');

    // Step 2: Transcribe
    console.log('[podsnap] Transcribing...');
    const transcript = await transcribeFile(audioPath);
    console.log('[podsnap] Transcript length:', transcript.length, 'chars');

    // Step 3: Summarize
    console.log('[podsnap] Summarizing...');
    const summary = await summarizeWithClaude(transcript, title || 'Unknown Episode', podcast || 'Unknown Podcast', format);

    // Cleanup
    await fs.unlink(audioPath).catch(() => {});

    return NextResponse.json({ transcript, summary, wordCount: transcript.split(' ').length });
  } catch (err: unknown) {
    await fs.unlink(audioPath).catch(() => {});

    const msg = err instanceof Error ? err.message : String(err);
    console.error('[podsnap/process]', msg);

    if (msg.includes('Sign in') || msg.includes('login') || msg.includes('authentication')) {
      return NextResponse.json({ error: 'This content requires authentication. Try the podcast RSS feed directly.' }, { status: 403 });
    }
    if (msg.includes('not supported') || msg.includes('Unsupported URL')) {
      return NextResponse.json({ error: 'This URL format is not supported. Try a direct MP3 or RSS feed URL.' }, { status: 422 });
    }

    return NextResponse.json({ error: `Processing failed: ${msg.substring(0, 200)}` }, { status: 500 });
  }
}
