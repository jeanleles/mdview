"use client";

/**
 * MarkdownRenderer — renders Markdown content as formatted HTML.
 *
 * Uses react-markdown + remark-gfm (tables, task lists, strikethrough, etc.)
 * + rehype-sanitize with defaultSchema to strip <script>, <iframe>, and
 * on* event attributes before the HTML is mounted in the DOM.
 *
 * Internal link handling:
 * - A link whose href matches one of the IDs in `fileList` is treated as an
 *   internal navigation link. Clicking it calls `router.push('/files/<id>')`.
 * - A link whose href looks like an internal reference but whose ID is NOT in
 *   `fileList` renders an inline error message instead of a clickable anchor.
 * - All other links (absolute URLs, mailto:, etc.) render as normal anchors
 *   that open in a new tab with rel="noopener noreferrer".
 *
 * Requirements: 3.1, 3.3, 3.4, 3.6
 */

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { useRouter } from "next/navigation";
import type { Components } from "react-markdown";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarkdownRendererProps {
  /** Raw Markdown string to render. */
  content: string;
  /**
   * IDs of files available in the repository.
   * Used to validate internal links. If omitted, no link is treated as
   * internal (all links render as external).
   */
  fileList?: Array<string | { id: string; name: string }>;
  /**
   * Optional callback when an internal link is successfully navigated.
   * Receives the target fileId. Useful for parent components that need to
   * react to in-app navigation events.
   */
  onNavigate?: (fileId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determines whether `href` is an "internal" link candidate — i.e. it does
 * not start with a scheme (http/https/mailto/…) and could therefore be a
 * relative reference to another repository file.
 */
function isInternalCandidate(href: string): boolean {
  // Absolute URLs and protocol-relative URLs are external.
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href)) return false;
  if (href.startsWith("//")) return false;
  if (href.startsWith("#")) return false; // anchor-only links are local
  return true;
}

/**
 * Strips a leading "/" and common Markdown path prefixes so that
 * `/files/abc123` or `abc123.md` both normalise to `abc123`.
 * Local file IDs and .md names are normalized for a best-effort match.
 */
function extractFileId(href: string): string {
  // Remove query string / fragment
  const [path] = href.split(/[?#]/);

  // Strip leading slash(es) and "files/" prefix
  let id = path.replace(/^\/+/, "").replace(/^files\//, "");

  // Strip .md extension if present
  id = id.replace(/\.md$/i, "");

  return id;
}

// ---------------------------------------------------------------------------
// Custom link component
// ---------------------------------------------------------------------------

interface CustomLinkProps {
  href?: string;
  children?: React.ReactNode;
  fileList: Array<string | { id: string; name: string }>;
  onNavigate?: (fileId: string) => void;
  router: ReturnType<typeof useRouter>;
}

function CustomLink({ href, children, fileList, onNavigate, router }: CustomLinkProps) {
  if (!href) {
    return <span>{children}</span>;
  }

  // --- Internal link handling ---
  if (isInternalCandidate(href)) {
    const fileId = extractFileId(href);
    const target = fileList.find((file) => {
      if (typeof file === "string") return file === fileId;
      return file.id === fileId || file.name === fileId || file.name.replace(/\.md$/i, "") === fileId;
    });
    const resolvedFileId = typeof target === "string" ? target : target?.id;
    const exists = Boolean(resolvedFileId);

    if (exists) {
      // Internal link to a known file: use client-side navigation.
      const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onNavigate?.(resolvedFileId!);
        router.push(`/files/${resolvedFileId}`);
      };

      return (
        <a
          href={`/files/${resolvedFileId}`}
          onClick={handleClick}
          className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
        >
          {children}
        </a>
      );
    } else {
      // Internal link to a non-existent file: show inline error.
      return (
        <span
          role="alert"
          className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"
          title={`Arquivo não encontrado: ${href}`}
        >
          <span aria-hidden="true">⚠</span>
          <span className="line-through opacity-60">{children}</span>
          <span className="text-sm font-medium">(Arquivo não encontrado)</span>
        </span>
      );
    }
  }

  // --- External link: open in new tab ---
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
    >
      {children}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MarkdownRenderer({
  content,
  fileList = [],
  onNavigate,
}: MarkdownRendererProps) {
  const router = useRouter();

  /**
   * Build the components map once per render. The link component is a closure
   * over `fileList`, `onNavigate`, and `router` so it always has fresh values
   * without needing to be recreated on every keystroke/scroll.
   */
  const components: Components = useMemo(
    () => ({
      // Headings
      h1: ({ children, ...props }) => (
        <h1
          className="text-3xl font-bold mt-8 mb-4 leading-tight text-gray-900 dark:text-gray-100"
          {...props}
        >
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2
          className="text-2xl font-semibold mt-7 mb-3 leading-snug text-gray-900 dark:text-gray-100"
          {...props}
        >
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3
          className="text-xl font-semibold mt-6 mb-2 text-gray-900 dark:text-gray-100"
          {...props}
        >
          {children}
        </h3>
      ),
      h4: ({ children, ...props }) => (
        <h4
          className="text-lg font-semibold mt-5 mb-2 text-gray-900 dark:text-gray-100"
          {...props}
        >
          {children}
        </h4>
      ),
      h5: ({ children, ...props }) => (
        <h5
          className="text-base font-semibold mt-4 mb-1 text-gray-900 dark:text-gray-100"
          {...props}
        >
          {children}
        </h5>
      ),
      h6: ({ children, ...props }) => (
        <h6
          className="text-sm font-semibold mt-4 mb-1 text-gray-700 dark:text-gray-300"
          {...props}
        >
          {children}
        </h6>
      ),

      // Paragraph
      p: ({ children, ...props }) => (
        <p
          className="text-base leading-relaxed mb-4 text-gray-800 dark:text-gray-200"
          {...props}
        >
          {children}
        </p>
      ),

      // Inline text formatting
      strong: ({ children, ...props }) => (
        <strong className="font-bold" {...props}>
          {children}
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em className="italic" {...props}>
          {children}
        </em>
      ),

      // Lists
      ul: ({ children, ...props }) => (
        <ul
          className="list-disc list-outside pl-6 mb-4 space-y-1 text-gray-800 dark:text-gray-200"
          {...props}
        >
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol
          className="list-decimal list-outside pl-6 mb-4 space-y-1 text-gray-800 dark:text-gray-200"
          {...props}
        >
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li className="text-base leading-relaxed" {...props}>
          {children}
        </li>
      ),

      // Tables (GFM)
      table: ({ children, ...props }) => (
        <div className="overflow-x-auto mb-4">
          <table
            className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm"
            {...props}
          >
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...props }) => (
        <thead className="bg-gray-100 dark:bg-gray-700" {...props}>
          {children}
        </thead>
      ),
      tbody: ({ children, ...props }) => (
        <tbody className="divide-y divide-gray-200 dark:divide-gray-600" {...props}>
          {children}
        </tbody>
      ),
      tr: ({ children, ...props }) => (
        <tr
          className="even:bg-gray-50 dark:even:bg-gray-800"
          {...props}
        >
          {children}
        </tr>
      ),
      th: ({ children, ...props }) => (
        <th
          className="px-4 py-2 text-left font-semibold border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          {...props}
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
          {...props}
        >
          {children}
        </td>
      ),

      // Code blocks and inline code
      code: ({ children, className, ...props }) => {
        // Fenced code block: className like "language-typescript"
        const isBlock = !!className;
        if (isBlock) {
          return (
            <code
              className={`block text-sm font-mono leading-relaxed ${className ?? ""}`}
              {...props}
            >
              {children}
            </code>
          );
        }
        // Inline code
        return (
          <code
            className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono text-red-700 dark:text-red-300"
            {...props}
          >
            {children}
          </code>
        );
      },
      pre: ({ children, ...props }) => (
        <pre
          className="bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-lg overflow-x-auto p-4 mb-4 text-sm leading-relaxed"
          {...props}
        >
          {children}
        </pre>
      ),

      // Blockquote
      blockquote: ({ children, ...props }) => (
        <blockquote
          className="border-l-4 border-gray-400 dark:border-gray-500 pl-4 italic text-gray-600 dark:text-gray-400 mb-4"
          {...props}
        >
          {children}
        </blockquote>
      ),

      // Horizontal rule
      hr: (props) => (
        <hr
          className="my-6 border-t border-gray-300 dark:border-gray-600"
          {...props}
        />
      ),

      // Links — custom component handles internal vs external
      a: ({ href, children }) => (
        <CustomLink
          href={href}
          fileList={fileList}
          onNavigate={onNavigate}
          router={router}
        >
          {children}
        </CustomLink>
      ),
    }),
    [fileList, onNavigate, router]
  );

  return (
    <article
      className="max-w-none min-w-0 w-full"
      style={{ fontSize: "1rem", lineHeight: "1.6" }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, defaultSchema]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
