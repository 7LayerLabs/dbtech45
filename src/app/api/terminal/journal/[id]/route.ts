// DELETE /api/terminal/journal/:id -> { ok: true }

import { NextRequest, NextResponse } from 'next/server'
import { deleteTrade } from '@/lib/terminal/store'

export const dynamic = 'force-dynamic'

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    await deleteTrade(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
