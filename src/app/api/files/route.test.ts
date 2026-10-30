/**
 * @vitest-environment node
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const selectWhereLimit = vi.fn();
const selectOrderBy = vi.fn();
const updateWhere = vi.fn();
const insertValues = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: selectOrderBy,
        where: vi.fn(() => ({ limit: selectWhereLimit })),
      })),
    })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
    insert: vi.fn(() => ({ values: insertValues })),
  },
}));

import { GET, POST } from "./route";

describe("GET /api/files", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectOrderBy.mockResolvedValue([]);
  });

  it("returns an empty local file list", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ files: [] });
  });
});

describe("POST /api/files", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectWhereLimit.mockResolvedValue([]);
    insertValues.mockResolvedValue(undefined);
  });

  it("rejects files that are not Markdown", async () => {
    const request = new Request("http://localhost/api/files", {
      method: "POST",
      body: (() => {
        const form = new FormData();
        form.append("file", new File(["hello"], "notes.txt", { type: "text/plain" }));
        return form;
      })(),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it("rejects files larger than 2 MB", async () => {
    const file = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "large.md");
    const form = new FormData();
    form.append("file", file);
    const request = new Request("http://localhost/api/files", {
      method: "POST",
      body: form,
    });

    const response = await POST(request as never);
    expect(response.status).toBe(413);
  });

  it("accepts a valid Markdown file", async () => {
    const form = new FormData();
    form.append(
      "file",
      new File(["# Apostila\n\nConteudo"], "apostila.md", { type: "text/markdown" })
    );
    const request = new Request("http://localhost/api/files", {
      method: "POST",
      body: form,
    });

    const response = await POST(request as never);
    expect(response.status).toBe(201);
    expect(insertValues).toHaveBeenCalledOnce();
  });
});
