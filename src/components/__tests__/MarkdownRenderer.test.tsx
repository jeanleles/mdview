/**
 * Unit tests for MarkdownRenderer component.
 *
 * Covers:
 * - Rendering of all standard Markdown elements (h1–h6, p, strong, em, lists, tables, code, links)
 * - Internal link navigation (known fileId → router.push, unknown → error message)
 * - External link rendering (target="_blank", rel="noopener noreferrer")
 * - Sanitization: <script>, <iframe>, and on* attributes must be removed
 *
 * Requirements: 3.1, 3.3, 3.4, 3.6
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as fc from "fast-check";
import MarkdownRenderer from "../MarkdownRenderer";

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderMd(content: string, props?: Partial<React.ComponentProps<typeof MarkdownRenderer>>) {
  return render(<MarkdownRenderer content={content} {...props} />);
}

// ---------------------------------------------------------------------------
// Tests: Markdown element rendering (Requirement 3.1)
// ---------------------------------------------------------------------------

describe("MarkdownRenderer — element rendering (Requirement 3.1)", () => {
  it("renders h1 through h6 headings", () => {
    renderMd(
      "# Heading 1\n## Heading 2\n### Heading 3\n#### Heading 4\n##### Heading 5\n###### Heading 6"
    );
    expect(screen.getByRole("heading", { level: 1, name: "Heading 1" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Heading 2" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Heading 3" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Heading 4" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 5, name: "Heading 5" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 6, name: "Heading 6" })).toBeInTheDocument();
  });

  it("renders a paragraph", () => {
    renderMd("This is a paragraph with some text.");
    expect(screen.getByText("This is a paragraph with some text.")).toBeInTheDocument();
  });

  it("renders bold text", () => {
    renderMd("This is **bold** text.");
    const bold = document.querySelector("strong");
    expect(bold).toBeInTheDocument();
    expect(bold).toHaveTextContent("bold");
  });

  it("renders italic text", () => {
    renderMd("This is _italic_ text.");
    const em = document.querySelector("em");
    expect(em).toBeInTheDocument();
    expect(em).toHaveTextContent("italic");
  });

  it("renders an unordered list", () => {
    renderMd("- Item A\n- Item B\n- Item C");
    const list = document.querySelector("ul");
    expect(list).toBeInTheDocument();
    expect(screen.getByText("Item A")).toBeInTheDocument();
    expect(screen.getByText("Item B")).toBeInTheDocument();
    expect(screen.getByText("Item C")).toBeInTheDocument();
  });

  it("renders an ordered list", () => {
    renderMd("1. First\n2. Second\n3. Third");
    const list = document.querySelector("ol");
    expect(list).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  it("renders a table (GFM)", () => {
    renderMd(
      "| Name | Value |\n|------|-------|\n| foo  | 1     |\n| bar  | 2     |"
    );
    expect(document.querySelector("table")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
    expect(screen.getByText("foo")).toBeInTheDocument();
    expect(screen.getByText("bar")).toBeInTheDocument();
  });

  it("renders inline code", () => {
    renderMd("Use `const x = 1` here.");
    const code = document.querySelector("code");
    expect(code).toBeInTheDocument();
    expect(code).toHaveTextContent("const x = 1");
  });

  it("renders a fenced code block", () => {
    renderMd("```typescript\nconst x: number = 42;\n```");
    const pre = document.querySelector("pre");
    expect(pre).toBeInTheDocument();
    expect(pre).toHaveTextContent("const x: number = 42;");
  });
});

// ---------------------------------------------------------------------------
// Tests: External link rendering
// ---------------------------------------------------------------------------

describe("MarkdownRenderer — external links", () => {
  it("renders an external http link with target=_blank and rel=noopener noreferrer", () => {
    renderMd("[OpenAI](https://openai.com)");
    const link = screen.getByRole("link", { name: "OpenAI" });
    expect(link).toHaveAttribute("href", "https://openai.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders an external https link", () => {
    renderMd("[Google](https://google.com)");
    const link = screen.getByRole("link", { name: "Google" });
    expect(link).toHaveAttribute("href", "https://google.com");
    expect(link).toHaveAttribute("target", "_blank");
  });
});

// ---------------------------------------------------------------------------
// Tests: Internal link navigation (Requirements 3.3, 3.4)
// ---------------------------------------------------------------------------

describe("MarkdownRenderer — internal links (Requirements 3.3, 3.4)", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders a known internal link as a clickable anchor", () => {
    renderMd("[See file](file-abc-123)", {
      fileList: ["file-abc-123"],
    });
    const link = screen.getByRole("link", { name: "See file" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/files/file-abc-123");
  });

  it("navigates via router.push when an internal link is clicked", () => {
    renderMd("[Go to doc](doc-id-999)", {
      fileList: ["doc-id-999"],
    });
    const link = screen.getByRole("link", { name: "Go to doc" });
    fireEvent.click(link);
    expect(mockPush).toHaveBeenCalledWith("/files/doc-id-999");
  });

  it("calls onNavigate with the fileId when an internal link is clicked", () => {
    const onNavigate = vi.fn();
    renderMd("[Report](file-xyz)", {
      fileList: ["file-xyz"],
      onNavigate,
    });
    fireEvent.click(screen.getByRole("link", { name: "Report" }));
    expect(onNavigate).toHaveBeenCalledWith("file-xyz");
  });

  it("strips .md extension when matching fileId", () => {
    renderMd("[Link](file-abc.md)", {
      fileList: ["file-abc"],
    });
    const link = screen.getByRole("link", { name: "Link" });
    expect(link).toHaveAttribute("href", "/files/file-abc");
    fireEvent.click(link);
    expect(mockPush).toHaveBeenCalledWith("/files/file-abc");
  });

  it("handles /files/ prefix in href when matching fileId", () => {
    renderMd("[Link](/files/abc123)", {
      fileList: ["abc123"],
    });
    const link = screen.getByRole("link", { name: "Link" });
    expect(link).toHaveAttribute("href", "/files/abc123");
  });

  it("shows inline error for an internal link with non-existent fileId (Requirement 3.4)", () => {
    renderMd("[Missing doc](nonexistent-file)", {
      fileList: ["some-other-file"],
    });
    // Should NOT render a link
    expect(screen.queryByRole("link", { name: /Missing doc/i })).not.toBeInTheDocument();
    // Should render an error indicator
    expect(screen.getByText("(Arquivo não encontrado)")).toBeInTheDocument();
  });

  it("shows inline error when fileList is empty", () => {
    renderMd("[Any internal link](some-file-id)", {
      fileList: [],
    });
    expect(screen.queryByRole("link", { name: /Any internal link/i })).not.toBeInTheDocument();
    expect(screen.getByText("(Arquivo não encontrado)")).toBeInTheDocument();
  });

  it("does not treat http links as internal even if the ID is in fileList", () => {
    renderMd("[External](https://example.com)", {
      fileList: ["https://example.com"],
    });
    const link = screen.getByRole("link", { name: "External" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    // router.push should NOT have been called
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("treats anchor-only links (#section) as external (pass-through)", () => {
    renderMd("[Section](#intro)");
    const link = screen.getByRole("link", { name: "Section" });
    expect(link).toHaveAttribute("href", "#intro");
  });
});

// ---------------------------------------------------------------------------
// Tests: HTML sanitization (Requirement 3.6)
// ---------------------------------------------------------------------------

describe("MarkdownRenderer — sanitization (Requirement 3.6)", () => {
  it("removes <script> tags from raw HTML in Markdown", () => {
    renderMd("<script>alert('xss')</script>\n\nSafe paragraph.");
    expect(document.querySelector("script")).not.toBeInTheDocument();
    expect(screen.getByText("Safe paragraph.")).toBeInTheDocument();
  });

  it("removes <iframe> tags from raw HTML in Markdown", () => {
    renderMd('<iframe src="https://evil.com"></iframe>\n\nSafe paragraph.');
    expect(document.querySelector("iframe")).not.toBeInTheDocument();
  });

  it("does not render on* attributes on elements", () => {
    // Even if the sanitizer leaves the tag, it must strip event handlers
    renderMd('<a href="https://example.com" onclick="alert(1)">Click</a>');
    const link = screen.queryByRole("link", { name: "Click" });
    if (link) {
      expect(link).not.toHaveAttribute("onclick");
    }
  });

  it(
    // Feature: mdview, Property 4: Sanitização remove conteúdo executável
    "Property 4 — generated script, iframe and event-handler injections stay unrendered",
    () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.constantFrom("script", "iframe"),
          fc.constantFrom("onclick", "onload", "onmouseover"),
          (safeText, dangerousTag, eventAttribute) => {
            renderMd(
              `${safeText}\n<${dangerousTag}>injected</${dangerousTag}>\n` +
              `<div ${eventAttribute}="alert(1)">safe content</div>`
            );

            expect(document.querySelector(dangerousTag)).not.toBeInTheDocument();
            expect(document.querySelector(`[${eventAttribute}]`)).not.toBeInTheDocument();
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
