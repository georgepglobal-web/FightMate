import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return json({ error: "userId required" }, 400);
  const db = getDb();
  const rows = db.prepare("SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC").all(userId);
  return json(rows);
}

export function POST(req: NextRequest) {
  return req.json().then((body) => {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO sessions (id, user_id, date, type, level, points, diversity_bonus, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, body.user_id, body.date, body.type, body.level, body.points ?? 0, body.diversity_bonus ?? 0, now, now);
    return json({ id, ...body, created_at: now, updated_at: now });
  });
}

export function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return json({ error: "id required" }, 400);
  getDb().prepare("DELETE FROM sessions WHERE id = ?").run(id);
  return json({ ok: true });
}
