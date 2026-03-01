import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/schema";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return json({ error: "id required" }, 400);
    const db = getDb();
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return json(user || null);
  } catch (e) { return json({ error: String(e) }, 500); }
}

export async function POST(req: NextRequest) {
  try {
    const { id, username } = await req.json();
    getDb().prepare("INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)").run(id, username);
    return json({ id, username });
  } catch (e) { return json({ error: String(e) }, 500); }
}

export function DELETE() {
  return json({ ok: true });
}
