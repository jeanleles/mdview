/**
 * GET /api/files
 *
 * Responses:
 *   200 — { files: LocalFile[] }
 *   500 — { error: string }                              (unexpected error)
 *
 * Requirements: 2.1, 2.3, 2.4
 */

import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await db
      .select({
        id: files.id,
        name: files.name,
        size: files.size,
        modifiedTime: files.updatedAt,
      })
      .from(files)
      .orderBy(asc(files.name));

    return NextResponse.json({
      files: rows.map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: "text/markdown",
        modifiedTime: file.modifiedTime.toISOString(),
        size: file.size,
      })),
    });
  } catch (error) {
    console.error("[GET /api/files] DB error:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os arquivos locais." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const upload = formData.get("file");

    if (!(upload instanceof File)) {
      return NextResponse.json(
        { error: "Selecione um arquivo Markdown." },
        { status: 400 }
      );
    }

    if (!upload.name.toLowerCase().endsWith(".md")) {
      return NextResponse.json(
        { error: "Apenas arquivos .md são permitidos." },
        { status: 400 }
      );
    }

    if (upload.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "O arquivo excede o limite máximo de 2 MB." },
        { status: 413 }
      );
    }

    const content = await upload.text();
    const name = upload.name.trim();
    const now = new Date();
    const existing = await db
      .select({ id: files.id })
      .from(files)
      .where(eq(files.name, name))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(files)
        .set({ content, size: upload.size, updatedAt: now })
        .where(eq(files.id, existing[0].id));

      return NextResponse.json({
        file: { id: existing[0].id, name, size: upload.size },
        replaced: true,
      });
    }

    const id = randomUUID();
    await db.insert(files).values({
      id,
      name,
      content,
      size: upload.size,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      { file: { id, name, size: upload.size }, replaced: false },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/files] Upload error:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar o arquivo." },
      { status: 500 }
    );
  }
}
