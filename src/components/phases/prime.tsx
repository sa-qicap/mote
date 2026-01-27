"use client";

import React, { useState, useEffect, useRef } from "react";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import { HighlightPopup } from "@/components/highlight-popup";

interface Highlight {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  color: string;
  note: string | null;
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: "rgba(250, 204, 21, 0.4)",
  green: "rgba(74, 222, 128, 0.4)",
  red: "rgba(248, 113, 113, 0.4)",
};

// Apply highlights to a text segment using exact offsets
function applyHighlightsToText(
  text: string,
  highlights: Highlight[],
  keyPrefix: string,
  segmentStartOffset: number = 0
): React.ReactNode[] {
  if (highlights.length === 0) return [text];

  const segmentEndOffset = segmentStartOffset + text.length;

  // Filter highlights that overlap with this segment (using stored offsets)
  const relevantHighlights = highlights.filter(h =>
    h.startOffset < segmentEndOffset && h.endOffset > segmentStartOffset
  );

  if (relevantHighlights.length === 0) return [text];

  // Sort by start position
  relevantHighlights.sort((a, b) => a.startOffset - b.startOffset);

  // Convert absolute offsets to relative offsets within this segment
  const matches = relevantHighlights.map(h => ({
    start: Math.max(0, h.startOffset - segmentStartOffset),
    end: Math.min(text.length, h.endOffset - segmentStartOffset),
    highlight: h,
  }));

  const result: React.ReactNode[] = [];
  let keyIndex = 0;
  let pos = 0;

  for (const match of matches) {
    if (match.start > pos) {
      result.push(text.slice(pos, match.start));
    }
    const color = HIGHLIGHT_COLORS[match.highlight.color] || HIGHLIGHT_COLORS.yellow;
    result.push(
      <mark
        key={`${keyPrefix}-hl-${keyIndex++}`}
        style={{ backgroundColor: color, padding: "0 2px", borderRadius: "2px", cursor: "pointer" }}
        data-highlight-id={match.highlight.id}
        title={match.highlight.note || undefined}
      >
        {text.slice(match.start, match.end)}
      </mark>
    );
    pos = match.end;
  }

  if (pos < text.length) {
    result.push(text.slice(pos));
  }

  return result.length > 0 ? result : [text];
}

// Renders text with LaTeX $...$ and inline HTML (<strong>, <em>, <br>) using KaTeX, with optional highlighting
function renderWithLatex(text: string, highlights: Highlight[] = []): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match $...$ for inline math, <strong>...</strong>, <em>...</em>, <br/>, <br>
  const regex = /\$([^$]+)\$|<strong>(.*?)<\/strong>|<em>(.*?)<\/em>|<br\s*\/?>/g;
  let lastIndex = 0;
  let match;
  let partIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match (with highlights, passing segment offset)
    if (match.index > lastIndex) {
      const textSegment = text.slice(lastIndex, match.index);
      const highlightedParts = applyHighlightsToText(textSegment, highlights, `part-${partIndex++}`, lastIndex);
      parts.push(...highlightedParts);
    }

    if (match[1] !== undefined) {
      // LaTeX math: $...$
      try {
        parts.push(<InlineMath key={`math-${match.index}`} math={match[1]} />);
      } catch {
        parts.push(`$${match[1]}$`);
      }
    } else if (match[2] !== undefined) {
      // <strong>...</strong>
      const innerOffset = match.index + "<strong>".length;
      const innerParts = applyHighlightsToText(match[2], highlights, `strong-${match.index}`, innerOffset);
      parts.push(<strong key={`strong-${match.index}`}>{innerParts}</strong>);
    } else if (match[3] !== undefined) {
      // <em>...</em>
      const innerOffset = match.index + "<em>".length;
      const innerParts = applyHighlightsToText(match[3], highlights, `em-${match.index}`, innerOffset);
      parts.push(<em key={`em-${match.index}`}>{innerParts}</em>);
    } else {
      // <br> or <br/>
      parts.push(<br key={`br-${match.index}`} />);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text (with highlights, passing segment offset)
  if (lastIndex < text.length) {
    const textSegment = text.slice(lastIndex);
    const highlightedParts = applyHighlightsToText(textSegment, highlights, `part-${partIndex++}`, lastIndex);
    parts.push(...highlightedParts);
  }

  return parts;
}

interface Concept {
  id: string;
  title: string;
  summary: string;
  branchTitle: string;
  estimatedMinutes: number;
  startPage?: number | null;
  endPage?: number | null;
}

interface PrimePhaseProps {
  concept: Concept;
  status: string;
  onResetProgress?: () => void;
  highlights: Highlight[];
  onHighlightsChange: (highlights: Highlight[]) => void;
}

function getProgressPercent(status: string): number {
  switch (status) {
    case "completed":
      return 100;
    case "testing":
      return 75;
    case "learning":
      return 50;
    case "primed":
      return 25;
    default:
      return 0;
  }
}

function getProgressLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "testing":
      return "Testing";
    case "learning":
      return "Learning";
    case "primed":
      return "Primed";
    default:
      return "Not started";
  }
}

export function PrimePhase({ concept, status, onResetProgress, highlights, onHighlightsChange }: PrimePhaseProps) {
  const [selection, setSelection] = useState<{
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [highlightPopupPosition, setHighlightPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle text selection
  useEffect(() => {
    if (!mounted) return;

    function handleMouseUp(e: MouseEvent) {
      const target = e.target as HTMLElement;

      // Don't show popup if clicking on a button or popup
      if (target.closest('button') || target.closest('[data-highlight-popup]') || target.closest('[data-delete-popup]')) {
        return;
      }

      // Check if clicking on an existing highlight (always allow viewing/deleting highlights)
      const mark = target.closest("mark[data-highlight-id]") as HTMLElement;
      if (mark) {
        const highlightId = mark.getAttribute("data-highlight-id");
        if (highlightId) {
          const highlight = highlights.find(h => h.id === highlightId);
          if (highlight) {
            const rect = mark.getBoundingClientRect();
            setSelectedHighlight(highlight);
            setHighlightPopupPosition({
              x: Math.max(16, Math.min(rect.left + rect.width / 2 - 80, window.innerWidth - 180)),
              y: rect.bottom + 8,
            });
            setSelection(null);
            setPopupPosition(null);
            return;
          }
        }
      }

      // Clear highlight selection popup if clicking elsewhere
      setSelectedHighlight(null);
      setHighlightPopupPosition(null);

      // Only handle new selections when in highlight mode
      if (!highlightMode) {
        setSelection(null);
        setPopupPosition(null);
        return;
      }

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !contentRef.current) {
        setTimeout(() => {
          const activePopup = document.querySelector('[data-highlight-popup]');
          if (!activePopup) {
            setSelection(null);
            setPopupPosition(null);
          }
        }, 50);
        return;
      }

      const selectedText = sel.toString().trim();
      if (!selectedText || selectedText.length < 3) {
        setSelection(null);
        setPopupPosition(null);
        return;
      }

      // Check if selection is within our content
      const range = sel.getRangeAt(0);
      if (!contentRef.current.contains(range.commonAncestorContainer)) {
        return;
      }

      // Find the selected text in the raw summary (not DOM offsets, which differ due to KaTeX rendering)
      const rawText = concept.summary;
      const matches: number[] = [];
      let searchStart = 0;
      while (true) {
        const idx = rawText.indexOf(selectedText, searchStart);
        if (idx === -1) break;
        matches.push(idx);
        searchStart = idx + 1;
      }

      if (matches.length === 0) {
        // Text not found in raw summary (might be inside math notation)
        setSelection(null);
        setPopupPosition(null);
        return;
      }

      // If multiple matches, use DOM position as hint to pick closest one
      let startOffset = matches[0];
      if (matches.length > 1) {
        const preSelectionRange = document.createRange();
        preSelectionRange.selectNodeContents(contentRef.current);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const roughDomOffset = preSelectionRange.toString().length;
        startOffset = matches.reduce((closest, idx) =>
          Math.abs(idx - roughDomOffset) < Math.abs(closest - roughDomOffset) ? idx : closest
        , matches[0]);
      }
      const endOffset = startOffset + selectedText.length;

      const rect = range.getBoundingClientRect();

      setSelection({
        text: selectedText,
        startOffset,
        endOffset,
      });

      setPopupPosition({
        x: Math.max(16, Math.min(rect.left + rect.width / 2 - 128, window.innerWidth - 280)),
        y: rect.bottom + 8,
      });

      sel.removeAllRanges();
    }

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [mounted, highlights, highlightMode, concept.summary]);

  async function handleSaveHighlight(color: string, note: string) {
    if (!selection) return;

    try {
      const res = await fetch(`/api/concepts/${concept.id}/highlights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selection.text,
          startOffset: selection.startOffset,
          endOffset: selection.endOffset,
          color,
          note: note || null,
        }),
      });

      if (res.ok) {
        const newHighlight = await res.json();
        onHighlightsChange([...highlights, newHighlight]);
      }
    } catch (error) {
      console.error("Failed to save highlight:", error);
    }

    setSelection(null);
    setPopupPosition(null);
    // Stay in highlight mode so user can continue highlighting
  }

  function handleCancelHighlight() {
    setSelection(null);
    setPopupPosition(null);
  }

  async function deleteHighlight(highlightId: string) {
    try {
      await fetch(`/api/concepts/${concept.id}/highlights?id=${highlightId}`, {
        method: "DELETE",
      });
      onHighlightsChange(highlights.filter((h) => h.id !== highlightId));
    } catch (error) {
      console.error("Failed to delete highlight:", error);
    }
    setSelectedHighlight(null);
    setHighlightPopupPosition(null);
  }

  const pageRef = concept.startPage
    ? concept.endPage && concept.endPage !== concept.startPage
      ? `pp. ${concept.startPage}–${concept.endPage}`
      : `p. ${concept.startPage}`
    : null;

  const progressPercent = getProgressPercent(status);
  const progressLabel = getProgressLabel(status);

  // Combine saved highlights with pending selection for visual preview
  const displayHighlights = [...highlights];
  if (selection) {
    displayHighlights.push({
      id: "pending",
      text: selection.text,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
      color: "yellow",
      note: null,
    });
  }

  return (
    <>
      <div
        className={`min-h-screen transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background: 'linear-gradient(180deg, rgb(var(--surface) / 0.3) 0%, transparent 40%)'
        }}
      >
        <div className="max-w-2xl mx-auto px-6 py-16">
          {/* Top metadata - minimal */}
          <div
            className={`flex items-center justify-between mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
            style={{ transitionDelay: '100ms' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-[0.15em] text-muted/70 font-medium">
                Prime
              </span>
              <span className="w-1 h-1 rounded-full bg-muted/30" />
              <span className="text-[11px] text-muted/60">
                {concept.estimatedMinutes} min read
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Highlight mode toggle */}
              <button
                onClick={() => {
                  setHighlightMode(!highlightMode);
                  if (highlightMode) {
                    setSelection(null);
                    setPopupPosition(null);
                  }
                }}
                className={`
                  flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-all duration-200
                  ${highlightMode
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-muted/60 hover:text-muted border border-transparent hover:border-border/50'
                  }
                `}
                title={highlightMode ? 'Exit highlight mode' : 'Enter highlight mode'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                <span className="hidden sm:inline">{highlightMode ? 'Done' : 'Highlight'}</span>
              </button>

              {/* Progress indicator - subtle pills */}
              <div className="flex items-center gap-1.5">
                {['prime', 'learn', 'test', 'reflect'].map((phase, i) => {
                  const phaseProgress = ['not_started', 'primed', 'learning', 'testing', 'completed'];
                  const currentIndex = phaseProgress.indexOf(status);
                  const isComplete = currentIndex > i;
                  const isCurrent = (i === 0 && currentIndex >= 1) ||
                                    (i === 1 && currentIndex >= 2) ||
                                    (i === 2 && currentIndex >= 3) ||
                                    (i === 3 && currentIndex >= 4);

                  return (
                    <div
                      key={phase}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        isComplete || isCurrent
                          ? 'w-4 bg-accent/60'
                          : 'w-1 bg-muted/20'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chapter context */}
          <div
            className={`mb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <span className="text-sm text-muted/80">{concept.branchTitle}</span>
            {pageRef && (
              <span className="text-sm text-muted/50 ml-3 font-mono text-xs">{pageRef}</span>
            )}
          </div>

          {/* Title */}
          <h1
            className={`font-display text-3xl md:text-4xl leading-tight mb-12 text-foreground/95 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
            style={{ transitionDelay: '300ms' }}
          >
            {concept.title}
          </h1>

          {/* Decorative line */}
          <div
            className={`flex items-center gap-4 mb-12 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '400ms' }}
          >
            <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-muted/30">
              <circle cx="6" cy="6" r="2" fill="currentColor" />
            </svg>
            <div className="h-px flex-1 bg-gradient-to-l from-border/60 to-transparent" />
          </div>

          {/* Summary content */}
          <div
            ref={contentRef}
            className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '500ms' }}
          >
            <p className="text-lg md:text-xl leading-[1.9] text-foreground/85 font-light selection:bg-accent/20">
              {renderWithLatex(concept.summary, displayHighlights)}
            </p>
          </div>

          {/* Bottom section - reset progress */}
          {onResetProgress && status !== "not_started" && (
            <div
              className={`mt-16 pt-8 border-t border-border/30 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: '600ms' }}
            >
              <button
                onClick={onResetProgress}
                className="text-xs text-muted/50 hover:text-muted transition-colors flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Reset progress
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Highlight Popup */}
      {selection && popupPosition && (
        <HighlightPopup
          position={popupPosition}
          onSave={handleSaveHighlight}
          onCancel={handleCancelHighlight}
        />
      )}

      {/* Existing Highlight Options Popup */}
      {selectedHighlight && highlightPopupPosition && (
        <div
          data-delete-popup
          className="fixed z-50 bg-background border border-border rounded-lg shadow-lg p-2"
          style={{
            left: highlightPopupPosition.x,
            top: highlightPopupPosition.y,
          }}
        >
          {selectedHighlight.note && (
            <p className="text-xs text-muted px-2 py-1 mb-1 max-w-[160px]">{selectedHighlight.note}</p>
          )}
          <button
            onClick={() => deleteHighlight(selectedHighlight.id)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-error hover:bg-error/10 rounded w-full transition-colors"
          >
            Delete highlight
          </button>
        </div>
      )}
    </>
  );
}
