import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";

export interface LocalFile {
  id: string;
  name: string;
  mimeType: "text/markdown";
  modifiedTime: string;
  size: number;
}

export interface LocalStoredFile {
  id: string;
  name: string;
  content: string;
  size: number;
  modifiedTime: Date;
}

export async function listLocalFiles(): Promise<LocalFile[]> {
  const rows = await db
    .select({
      id: files.id,
      name: files.name,
      size: files.size,
      updatedAt: files.updatedAt,
    })
    .from(files)
    .orderBy(asc(files.name));

  return rows.map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: "text/markdown",
    modifiedTime: file.updatedAt.toISOString(),
    size: file.size,
  }));
}

export async function getLocalFile(fileId: string): Promise<LocalStoredFile | null> {
  const rows = await db
    .select({
      id: files.id,
      name: files.name,
      content: files.content,
      size: files.size,
      modifiedTime: files.updatedAt,
    })
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1);

  return rows[0] ?? null;
}
