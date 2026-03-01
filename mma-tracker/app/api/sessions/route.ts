import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return json({ error: "userId required" }, 400);
  try {
    const rows = getDb().prepare("SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    return json(rows);
  } catch (e) { return json({ error: String(e) }, 500); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();
    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO sessions (id, user_id, date, type, level, points, diversity_bonus, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, body.user_id, body.date, body.type, body.level, body.points ?? 0, body.diversity_bonus ?? 0, now, now);
    return json({ id, ...body, created_at: now, updated_at: now });
  } catch (e) { return json({ error: String(e) }, 500); }
}

export function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return json({ error: "id required" }, 400);
  try {
    getDb().prepare("DELETE FROM sessions WHERE id = ?").run(id);
    return json({ ok: true });
  } catch (e) { return json({ error: String(e) }, 500); }
}
