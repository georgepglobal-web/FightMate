import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export function GET() {
  const rows = getDb().prepare("SELECT * FROM sparring_sessions ORDER BY created_at DESC").all();
  return json(rows);
}

export function POST(req: NextRequest) {
  return req.json().then((body) => {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO sparring_sessions (id, creator_id, opponent_id, date, time, location, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, body.creator_id, body.opponent_id ?? null, body.date, body.time ?? "", body.location ?? "", body.notes ?? null, body.status ?? "open", now, now);
    return json({ id, ...body, created_at: now, updated_at: now });
  });
}

export function PATCH(req: NextRequest) {
  return req.json().then(({ id, ...updates }) => {
    const db = getDb();
    const fields = Object.keys(updates).map((k) => `${k}=?`).join(", ");
    db.prepare(`UPDATE sparring_sessions SET ${fields}, updated_at=datetime('now') WHERE id = ?`).run(...Object.values(updates), id);
    return json({ ok: true });
  });
}
