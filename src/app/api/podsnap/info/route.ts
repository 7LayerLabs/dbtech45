import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

export const maxDuration = 60;
const execAsync = promisify(exec);

function getYtdlpPath(): string {
  const isWindows = process.platform === 'win32';
  const binName = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
  return path.join(process.cwd(), 'bin', binName);
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const ytdlp = getYtdlpPath();

    // Get metadata only — no download
    const cmd = `"${ytdlp}" --dump-json --no-playlist --socket-timeout 30 "${url}"`;
    const { stdout } = await execAsync(cmd, { timeout: 50000 });

    const info = JSON.parse(stdout.trim());

    return NextResponse.json({
      title: info.title || 'Unknown Episode',
      podcast: info.uploader || info.channel || info.series || 'Unknown Podcast',
      description: (info.description || '').substring(0, 500),
      duration: info.duration || 0,
      thumbnail: info.thumbnail || null,
      webpage_url: info.webpage_url || url,
      upload_date: info.upload_date || null,
      extractor: info.extractor || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[podsnap/info]', msg);

    // Check for common errors
    if (msg.includes('not supported') || msg.includes('Unsupported URL')) {
      return NextResponse.json({ error: 'This URL is not supported. Try a direct RSS feed or MP3 link.' }, { status: 422 });
    }
    if (msg.includes('Sign in') || msg.includes('login') || msg.includes('authentication')) {
      return NextResponse.json({ error: 'This content requires authentication. Try finding the podcast RSS feed instead.' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Could not fetch episode info. Check the URL and try again.' }, { status: 500 });
  }
}
