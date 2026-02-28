import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return json({ error: "id required" }, 400);
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return json(user || null);
}

export function POST(req: NextRequest) {
  return req.json().then(({ id, username }) => {
    const db = getDb();
    db.prepare("INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)").run(id, username);
    return json({ id, username });
  });
}

export function DELETE() {
  // signOut is client-side only (clear cookie/localStorage), no server action needed
  return json({ ok: true });
}
