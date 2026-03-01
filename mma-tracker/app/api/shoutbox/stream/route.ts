import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const afterId = req.nextUrl.searchParams.get("after") || "";
  let lastRowid = 0;

  if (afterId) {
    try {
      const row = getDb().prepare("SELECT rowid FROM shoutbox_messages WHERE id = ?").get(afterId) as { rowid: number } | undefined;
      if (row) lastRowid = row.rowid;
    } catch { /* not found, start from 0 */ }
  }
  if (!lastRowid) {
    try {
      const latest = getDb().prepare("SELECT rowid FROM shoutbox_messages ORDER BY rowid DESC LIMIT 1").get() as { rowid: number } | undefined;
      if (latest) lastRowid = latest.rowid;
    } catch { /* empty db */ }
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  writer.write(encoder.encode(": connected\n\n")).catch(() => { closed = true; });

  const interval = setInterval(async () => {
    if (closed) { clearInterval(interval); return; }
    try {
      const rows = getDb().prepare(
        "SELECT *, rowid FROM shoutbox_messages WHERE rowid > ? ORDER BY rowid ASC"
      ).all(lastRowid) as (Record<string, unknown> & { rowid: number })[];

      for (const row of rows) {
        const { rowid, ...msg } = row;
        await writer.write(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)).catch(() => { closed = true; });
        lastRowid = rowid;
      }
    } catch { /* db locked, skip */ }
  }, 1000);

  const keepalive = setInterval(() => {
    if (closed) { clearInterval(keepalive); return; }
    writer.write(encoder.encode(": keepalive\n\n")).catch(() => { closed = true; });
  }, 30000);

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
