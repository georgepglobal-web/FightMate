import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM group_members").all() as Record<string, unknown>[];
  return json(rows.map((r) => ({ ...r, badges: JSON.parse((r.badges as string) || "[]") })));
}

export function POST(req: NextRequest) {
  return req.json().then((body) => {
    const db = getDb();
    const badges = JSON.stringify(body.badges ?? []);
    db.prepare(
      `INSERT INTO group_members (user_id, username, score, badges, updated_at) VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET username=excluded.username, score=excluded.score, badges=excluded.badges, updated_at=datetime('now')`
    ).run(body.user_id, body.username, body.score ?? 0, badges);
    return json({ ok: true });
  });
}
