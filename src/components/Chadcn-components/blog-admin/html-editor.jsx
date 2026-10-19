"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WandSparkles } from "lucide-react";

// ── HTML Formatter ──────────────────────────────────────────────────────

const SELF_CLOSING = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const INLINE_TAGS = new Set([
  "a",
  "abbr",
  "b",
  "bdo",
  "big",
  "br",
  "button",
  "cite",
  "code",
  "em",
  "i",
  "img",
  "input",
  "kbd",
  "label",
  "map",
  "object",
  "q",
  "samp",
  "select",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "textarea",
  "time",
  "tt",
  "u",
  "var",
]);

function formatHTML(raw) {
  // Tokenize: split into tags and text nodes
  const tokens = [];
  const tagRegex = /(<\/?[^>]+>)/g;
  let lastIdx = 0;
  let m;

  while ((m = tagRegex.exec(raw)) !== null) {
    if (m.index > lastIdx) {
      const text = raw.slice(lastIdx, m.index).trim();
      if (text) tokens.push(text);
    }
    tokens.push(m[1]);
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < raw.length) {
    const text = raw.slice(lastIdx).trim();
    if (text) tokens.push(text);
  }

  const lines = [];
  let indent = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const isTag = token.startsWith("<");

    if (!isTag) {
      // Text node: attach to current indent
      lines.push("  ".repeat(indent) + token);
      continue;
    }

    const isClosing = token.startsWith("</");
    const tagNameMatch = token.match(/^<\/?(\w+)/);
    const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : "";
    const isInline = INLINE_TAGS.has(tagName);
    const isSelfClosing = SELF_CLOSING.has(tagName) || token.endsWith("/>");

    if (isInline) {
      // Try to merge inline tags with adjacent text into one line
      let merged = token;
      while (i + 1 < tokens.length) {
        const next = tokens[i + 1];
        const nextIsTag = next.startsWith("<");
        if (!nextIsTag) {
          merged += next;
          i++;
          continue;
        }
        const nextTagMatch = next.match(/^<\/?(\w+)/);
        const nextTagName = nextTagMatch ? nextTagMatch[1].toLowerCase() : "";
        if (INLINE_TAGS.has(nextTagName)) {
          merged += next;
          i++;
          // If it's the closing tag of what we started, stop
          if (next === `</${tagName}>`) break;
          continue;
        }
        break;
      }
      lines.push("  ".repeat(indent) + merged);
      continue;
    }

    if (isClosing) {
      indent = Math.max(0, indent - 1);
      lines.push("  ".repeat(indent) + token);
    } else if (isSelfClosing) {
      lines.push("  ".repeat(indent) + token);
    } else {
      lines.push("  ".repeat(indent) + token);
      indent++;
    }
  }

  return lines.join("\n");
}

// ── Syntax Highlight ────────────────────────────────────────────────────

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightHTML(code) {
  // Process character by character to avoid regex conflicts
  const result = [];
  let i = 0;

  while (i < code.length) {
    // Check for HTML tag start
    if (code[i] === "<") {
      const tagEnd = code.indexOf(">", i);
      if (tagEnd === -1) {
        result.push(escapeHTML(code.slice(i)));
        break;
      }

      const tag = code.slice(i, tagEnd + 1);
      result.push(highlightTag(tag));
      i = tagEnd + 1;
    } else {
      // Regular text - find next tag
      const nextTag = code.indexOf("<", i);
      if (nextTag === -1) {
        result.push(escapeHTML(code.slice(i)));
        break;
      }
      result.push(escapeHTML(code.slice(i, nextTag)));
      i = nextTag;
    }
  }

  return result.join("");
}

function highlightTag(tag) {
  const isClosing = tag.startsWith("</");
  const isSelfClosing = tag.endsWith("/>");

  // Extract tag name
  const nameMatch = tag.match(/^<\/?(\w[\w-]*)/);
  if (!nameMatch) return `<span class="html-bracket">${escapeHTML(tag)}</span>`;

  const tagName = nameMatch[1];
  const afterName = tag.slice(nameMatch[0].length, isSelfClosing ? -2 : -1);

  let parts = `<span class="html-bracket">${escapeHTML(isClosing ? "</" : "<")}</span>`;
  parts += `<span class="html-tag">${escapeHTML(tagName)}</span>`;

  // Parse attributes
  if (afterName.trim()) {
    const attrStr = afterName;
    const attrRegex = /([\w-]+)\s*=\s*("[^"]*"|'[^']*')/g;
    let lastAttrIdx = 0;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
      // Any whitespace/text before this attribute
      if (attrMatch.index > lastAttrIdx) {
        parts += escapeHTML(attrStr.slice(lastAttrIdx, attrMatch.index));
      }
      parts += `<span class="html-attr">${escapeHTML(attrMatch[1])}</span>`;
      parts += `<span class="html-bracket">=</span>`;
      parts += `<span class="html-string">${escapeHTML(attrMatch[2])}</span>`;
      lastAttrIdx = attrMatch.index + attrMatch[0].length;
    }

    if (lastAttrIdx < attrStr.length) {
      parts += escapeHTML(attrStr.slice(lastAttrIdx));
    }
  }

  parts += `<span class="html-bracket">${escapeHTML(isSelfClosing ? "/>" : ">")}</span>`;

  return parts;
}

// ── Editor Component ────────────────────────────────────────────────────

export function HTMLEditor({ value, onChange, rows = 18, placeholder }) {
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);
  const lineNumRef = useRef(null);
  const [textareaHeight, setTextareaHeight] = useState(0);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    // Reset to auto to get scroll height
    ta.style.height = "auto";
    const scrollH = ta.scrollHeight;
    const minHeight = rows * 26; // ~26px per line
    const h = Math.max(scrollH, minHeight);
    ta.style.height = `${h}px`;
    setTextareaHeight(h);
  }, [value, rows]);

  const handleFormat = useCallback(() => {
    const formatted = formatHTML(value);
    onChange(formatted);
  }, [value, onChange]);

  const handleKeyDown = useCallback(
    (e) => {
      const ta = e.currentTarget;

      // Tab -> insert 2 spaces
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const next = value.substring(0, start) + "  " + value.substring(end);
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }

      // Enter -> auto-indent
      if (e.key === "Enter") {
        e.preventDefault();
        const start = ta.selectionStart;
        const before = value.substring(0, start);
        const currentLine = before.split("\n").pop() ?? "";
        const leadingMatch = currentLine.match(/^(\s*)/);
        const indent = leadingMatch ? leadingMatch[1] : "";

        // Extra indent if after opening tag
        const trimmed = before.trimEnd();
        const afterOpen =
          trimmed.endsWith(">") &&
          !trimmed.endsWith("/>") &&
          !/<\/\w+>\s*$/.test(trimmed);
        const extra = afterOpen ? "  " : "";

        const next =
          value.substring(0, start) +
          "\n" +
          indent +
          extra +
          value.substring(ta.selectionEnd);
        onChange(next);
        requestAnimationFrame(() => {
          const pos = start + 1 + indent.length + extra.length;
          ta.selectionStart = ta.selectionEnd = pos;
        });
      }

      // Shift+Alt+F -> format
      if (e.key === "F" && e.shiftKey && e.altKey) {
        e.preventDefault();
        handleFormat();
      }
    },
    [value, onChange, handleFormat],
  );

  // Sync scroll between textarea, overlay, and line numbers
  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const ov = overlayRef.current;
    const ln = lineNumRef.current;
    if (!ta) return;
    if (ov) {
      ov.scrollTop = ta.scrollTop;
      ov.scrollLeft = ta.scrollLeft;
    }
    if (ln) {
      ln.scrollTop = ta.scrollTop;
    }
  }, []);

  const highlighted = highlightHTML(value);
  const lineCount = value.split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <div className="flex relative">
          {/* Line numbers */}
          <div
            ref={lineNumRef}
            className="select-none shrink-0 overflow-hidden border-r border-border bg-muted/40 py-3 px-2 text-center font-mono text-xs leading-relaxed text-muted-foreground/60"
            style={{ height: textareaHeight }}
            aria-hidden="true"
          >
            {lineNumbers.map((n) => (
              <div key={n} className="h-[22.76px]">
                {n}
              </div>
            ))}
          </div>

          <div className="relative flex-1 min-w-0">
            {/* Highlighted overlay (sits behind textarea) */}
            <pre
              ref={overlayRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre-wrap break-words py-3 px-3 font-mono text-sm leading-relaxed text-foreground"
              style={{ height: textareaHeight }}
              dangerouslySetInnerHTML={{ __html: highlighted + "\n" }}
            />

            {/* Textarea: transparent text so highlight shows through */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={syncScroll}
              spellCheck={false}
              placeholder={placeholder}
              className="relative z-10 block w-full resize-none overflow-auto bg-transparent py-3 px-3 font-mono text-sm leading-relaxed text-transparent caret-foreground outline-none selection:bg-primary/20 selection:text-transparent placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Format button */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="bg-transparent"
          onClick={handleFormat}
        >
          <WandSparkles className="h-3.5 w-3.5 mr-1.5" />
          Formatear
        </Button>
        <span className="text-xs text-muted-foreground">Shift + Alt + F</span>
      </div>
    </div>
  );
}
