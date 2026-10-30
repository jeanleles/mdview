/**
 * Route handlers for reading position (bookmark) persistence.
 *
 * GET  /api/bookmarks?fileId=<id>
 *   Returns { scrollPercent: number } for the authenticated user + file,
 *   or null if no bookmark exists.
 *   Responses: 200, 401, 400, 500
 *
 * POST /api/bookmarks
 *   Body: { fileId: string, scrollPercent: number, fileName: string }
 *   Upserts the bookmark for the authenticated user and also updates
 *   users.lastFileId to fileId.
 *   Responses: 200 { ok: true }, 401, 400, 500
 *
 * On DB error: returns 500 — the client is expected to ignore this
 * silently and not block navigation (Requirement 4.6, 6.6).
 *
 * Requirements: 4.1, 4.6, 6.6
 */

import { type NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks, users } from "@/lib/db/schema";
import { verifySessionToken } from "@/lib/auth";

/** Cookie name shared across the application. */
const COOKIE_NAME = "session_token";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the numeric userId from the JWT in the session cookie.
 * Returns null if the cookie is absent or the token is invalid/expired.
 */
async function getUserIdFromRequest(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.sub) return null;

  const userId = Number(payload.sub);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

// ---------------------------------------------------------------------------
// GET /api/bookmarks?fileId=<id>
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  // 1. Authenticate
  const userId = await getUserIdFromRequest(request);
  if (userId === null) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // 2. Extract and validate query param
  const fileId = request.nextUrl.searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json(
      { error: "Parâmetro fileId é obrigatório." },
      { status: 400 }
    );
  }

  // 3. Query bookmark
  try {
    const rows = await db
      .select({ scrollPercent: bookmarks.scrollPercent })
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.fileId, fileId)))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json({ scrollPercent: rows[0].scrollPercent }, { status: 200 });
  } catch (err) {
    // DB error — do not block navigation (Requirement 4.6)
    console.error("[GET /api/bookmarks] DB error:", (err as Error).message);
    return NextResponse.json(
      { error: "Erro ao recuperar marca-página." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/bookmarks
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Authenticate
  const userId = await getUserIdFromRequest(request);
  if (userId === null) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // 2. Parse and validate body
  let fileId: string;
  let scrollPercent: number;
  let fileName: string;

  try {
    const body = await request.json();
    fileId = String(body?.fileId ?? "").trim();
    scrollPercent = Number(body?.scrollPercent);
    fileName = String(body?.fileName ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!fileId) {
    return NextResponse.json({ error: "fileId é obrigatório." }, { status: 400 });
  }

  if (!fileName) {
    return NextResponse.json({ error: "fileName é obrigatório." }, { status: 400 });
  }

  if (!Number.isInteger(scrollPercent) || scrollPercent < 0 || scrollPercent > 100) {
    return NextResponse.json(
      { error: "scrollPercent deve ser um inteiro entre 0 e 100." },
      { status: 400 }
    );
  }

  // 3. Upsert bookmark and update lastFileId
  try {
    const now = new Date();

    // Upsert bookmark using the unique constraint (userId, fileId).
    await db
      .insert(bookmarks)
      .values({
        userId,
        fileId,
        fileName,
        scrollPercent,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [bookmarks.userId, bookmarks.fileId],
        set: {
          scrollPercent,
          fileName,
          updatedAt: now,
        },
      });

    // Update users.lastFileId — tracks the last open file for the home screen
    // (Requirement 6.6).
    await db
      .update(users)
      .set({ lastFileId: fileId })
      .where(eq(users.id, userId));

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    // DB error — return 500 but client should not block navigation
    // (Requirement 4.6).
    console.error("[POST /api/bookmarks] DB error:", (err as Error).message);
    return NextResponse.json(
      { error: "Erro ao salvar marca-página." },
      { status: 500 }
    );
  }
}
