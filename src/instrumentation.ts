// Next.js instrumentation: 24/7 news collection loop for DB Terminal.
// Runs only in the Node.js server runtime. Collects headlines every 5 minutes
// by calling the sweep directly (no self-fetch -- the deploy origin is
// unknown at boot). Guarded against double registration across hot reloads.

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const g = globalThis as unknown as { __dbTerminalNewsLoop?: boolean }
  if (g.__dbTerminalNewsLoop) return
  g.__dbTerminalNewsLoop = true

  // Dynamic import keeps the collector (and the Supabase client) out of
  // non-Node runtimes entirely.
  const { collectNews } = await import('./lib/terminal/newsCollector')

  const run = () => {
    collectNews().catch(() => {})
  }

  const timer = setInterval(run, 5 * 60000) as unknown as { unref?: () => void }
  timer.unref?.() // do not keep the process alive just for the loop
  run()
}
