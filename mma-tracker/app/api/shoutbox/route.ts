import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") || 30);
  const rows = getDb().prepare("SELECT * FROM shoutbox_messages ORDER BY created_at DESC LIMIT ?").all(limit);
  return json(rows);
}

export function POST(req: NextRequest) {
  return req.json().then((body) => {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare("INSERT INTO shoutbox_messages (id, user_id, type, content, created_at) VALUES (?, ?, ?, ?, ?)").run(id, body.user_id, body.type || "user", body.content, now);
    return json({ id, ...body, created_at: now });
  });
}
