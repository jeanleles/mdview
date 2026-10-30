/**
 * Unit/integration coverage for the bookmark Route Handler.
 *
 * @vitest-environment node
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifySessionTokenMock, selectLimitMock, insertConflictMock, updateWhereMock } =
  vi.hoisted(() => ({
    verifySessionTokenMock: vi.fn(),
    selectLimitMock: vi.fn(),
    insertConflictMock: vi.fn(),
    updateWhereMock: vi.fn(),
  }));

vi.mock("@/lib/auth", () => ({
  verifySessionToken: verifySessionTokenMock,
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({})),
  and: vi.fn(() => ({})),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: selectLimitMock,
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: insertConflictMock,
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: updateWhereMock,
      })),
    })),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  bookmarks: {
    userId: "userId",
    fileId: "fileId",
    fileName: "fileName",
    scrollPercent: "scrollPercent",
    updatedAt: "updatedAt",
  },
  users: {
    id: "id",
    lastFileId: "lastFileId",
  },
}));

import { GET, POST } from "./route";

function authenticatedRequest(
  url: string,
  init?: { method?: string; headers?: HeadersInit; body?: BodyInit | null }
) {
  const headers = new Headers(init?.headers);
  headers.set("cookie", "session_token=test-token");
  return new NextRequest(url, { ...init, headers });
}

describe("bookmarks Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionTokenMock.mockResolvedValue({ sub: "42" });
    selectLimitMock.mockResolvedValue([]);
    insertConflictMock.mockResolvedValue(undefined);
    updateWhereMock.mockResolvedValue(undefined);
  });

  it("returns 401 without an authenticated cookie", async () => {
    verifySessionTokenMock.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/bookmarks?fileId=file-a");

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 when GET lacks fileId", async () => {
    const response = await GET(authenticatedRequest("http://localhost/api/bookmarks"));
    expect(response.status).toBe(400);
  });

  it("returns null when the authenticated user has no bookmark", async () => {
    const response = await GET(
      authenticatedRequest("http://localhost/api/bookmarks?fileId=file-a")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toBeNull();
  });

  it("returns a bookmark scoped to the authenticated user", async () => {
    selectLimitMock.mockResolvedValue([{ scrollPercent: 73 }]);

    const response = await GET(
      authenticatedRequest("http://localhost/api/bookmarks?fileId=file-a")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ scrollPercent: 73 });
  });

  it("rejects invalid POST payloads", async () => {
    const request = authenticatedRequest("http://localhost/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: "file-a", fileName: "A.md", scrollPercent: 101 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(insertConflictMock).not.toHaveBeenCalled();
  });

  it("upserts the bookmark and updates the user's last file", async () => {
    const request = authenticatedRequest("http://localhost/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: "file-a", fileName: "A.md", scrollPercent: 48 }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insertConflictMock).toHaveBeenCalledOnce();
    expect(updateWhereMock).toHaveBeenCalledOnce();
  });

  it("returns 401 for POST without authentication", async () => {
    verifySessionTokenMock.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/bookmarks", {
      method: "POST",
      body: JSON.stringify({ fileId: "file-a", fileName: "A.md", scrollPercent: 20 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
