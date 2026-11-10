"use client";

import React from "react";

/**
 * Lightweight, robust formatter for study text.
 * Formats:
 * - Code blocks (```lang ... ```)
 * - Inline code & math expressions (`code`, $N, R, W$, $O(N)$)
 * - Bold (**text**)
 * - Bullet lists (- item, * item)
 */
export default function FormattedContent({ text = "", className = "" }) {
  if (!text) return null;

  // Split into code blocks vs regular paragraphs
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "codeBlock", content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return (
    <div className={`space-y-2 leading-relaxed ${className}`}>
      {parts.map((part, pIdx) => {
        if (part.type === "codeBlock") {
          return (
            <pre
              key={pIdx}
              className="my-2 p-3 rounded-lg bg-black/80 border border-border-subtle/80 font-mono text-xs text-emerald-300 overflow-x-auto text-left shadow-inner"
            >
              <code>{part.content}</code>
            </pre>
          );
        }

        // Process lines and inline formatting
        const lines = part.content.split("\n");
        return (
          <div key={pIdx} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              // Bullet line
              const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
              const lineContent = isBullet ? trimmed.slice(2) : trimmed;

              return (
                <p
                  key={lIdx}
                  className={isBullet ? "flex items-start gap-2 text-left" : "text-left"}
                >
                  {isBullet && (
                    <span className="text-accent-sky text-sm leading-none mt-1">&bull;</span>
                  )}
                  <span className="flex-1">{renderInline(lineContent)}</span>
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(str) {
  // Regex to match backticks `code`, math $formula$, or **bold**
  const inlineRegex = /(`[^`]+`|\$[^$]+\$|\*\*[^*]+\*\*)/g;
  const tokens = str.split(inlineRegex);

  return tokens.map((token, idx) => {
    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      return (
        <code
          key={idx}
          className="font-mono text-[0.88em] px-1.5 py-0.5 mx-0.5 rounded bg-surface border border-border-subtle text-accent-sky font-medium"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("$") && token.endsWith("$") && token.length > 2) {
      return (
        <span
          key={idx}
          className="font-mono text-[0.9em] px-1.5 py-0.5 mx-0.5 rounded bg-accent-amber/10 border border-accent-amber/30 text-amber-300 font-medium italic"
        >
          {token.slice(1, -1)}
        </span>
      );
    }
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-text-primary">
          {token.slice(2, -2)}
        </strong>
      );
    }
    return token;
  });
}
