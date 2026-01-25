"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { HighlightPopup } from "@/components/highlight-popup";

interface Highlight {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  color: string;
  note: string | null;
}

interface Concept {
  id: string;
  title: string;
  branchTitle: string;
  content: string;
}

interface LearnPhaseProps {
  concept: Concept;
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: "rgba(250, 204, 21, 0.4)",
  green: "rgba(74, 222, 128, 0.4)",
  red: "rgba(248, 113, 113, 0.4)",
};

export function LearnPhase({ concept }: LearnPhaseProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selection, setSelection] = useState<{
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [highlightPopupPosition, setHighlightPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Track if component is mounted (for SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch existing highlights
  useEffect(() => {
    fetchHighlights();
  }, [concept.id]);

  async function fetchHighlights() {
    try {
      const res = await fetch(`/api/concepts/${concept.id}/highlights`);
      if (res.ok) {
        const data = await res.json();
        setHighlights(data);
      }
    } catch (error) {
      console.error("Failed to fetch highlights:", error);
    }
  }

  // Apply highlights to content (including pending selection)
  const highlightedContent = useMemo(() => {
    let html = concept.content;

    // Combine saved highlights with pending selection
    const allHighlights = [...highlights];
    if (selection) {
      allHighlights.push({
        id: "pending",
        text: selection.text,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        color: "yellow",
        note: null,
      });
    }

    if (allHighlights.length === 0) return html;

    // Sort highlights by text length descending to handle overlapping matches better
    const sortedHighlights = [...allHighlights].sort((a, b) => b.text.length - a.text.length);

    // For each highlight, find the text in the content and wrap it
    for (const highlight of sortedHighlights) {
      const highlightText = highlight.text;
      const color = HIGHLIGHT_COLORS[highlight.color] || HIGHLIGHT_COLORS.yellow;

      // Escape special regex characters in the highlight text
      const searchText = highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match the text but not if it's already inside a <mark> tag
      const regex = new RegExp(`(?<!<mark[^>]*>)${searchText}(?![^<]*</mark>)`, 'i');

      const isPending = highlight.id === "pending";
      const noteAttr = highlight.note ? ` title="${highlight.note.replace(/"/g, '&quot;')}"` : '';
      const pendingStyle = isPending ? ' outline: 2px solid rgba(250, 204, 21, 0.8);' : '';

      html = html.replace(
        regex,
        `<mark style="background-color: ${color}; padding: 0 2px; border-radius: 2px; cursor: pointer;${pendingStyle}" data-highlight-id="${highlight.id}"${noteAttr}>$&</mark>`
      );
    }

    return html;
  }, [concept.content, highlights, selection]);

  // Handle text selection
  useEffect(() => {
    if (!mounted) return;

    function handleMouseUp(e: MouseEvent) {
      const target = e.target as HTMLElement;

      // Don't show popup if clicking on a button or popup
      if (target.closest('button') || target.closest('[data-highlight-popup]') || target.closest('[data-delete-popup]')) {
        return;
      }

      // Check if clicking on an existing highlight
      const mark = target.closest("mark[data-highlight-id]") as HTMLElement;
      if (mark) {
        const highlightId = mark.getAttribute("data-highlight-id");
        if (highlightId && highlightId !== "pending") {
          const highlight = highlights.find(h => h.id === highlightId);
          if (highlight) {
            const rect = mark.getBoundingClientRect();
            setSelectedHighlight(highlight);
            setHighlightPopupPosition({
              x: Math.max(16, Math.min(rect.left + rect.width / 2 - 80, window.innerWidth - 180)),
              y: rect.bottom + 8,
            });
            // Clear any new selection state
            setSelection(null);
            setPopupPosition(null);
            return;
          }
        }
      }

      // Clear highlight selection popup if clicking elsewhere
      setSelectedHighlight(null);
      setHighlightPopupPosition(null);

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

      // Calculate offsets relative to text content
      const preSelectionRange = document.createRange();
      preSelectionRange.selectNodeContents(contentRef.current);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preSelectionRange.toString().length;
      const endOffset = startOffset + selectedText.length;

      // Position popup near selection (fixed positioning = viewport coordinates)
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

      // Clear browser selection since we'll show our own highlight
      sel.removeAllRanges();
    }

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [mounted, highlights]);

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
        setHighlights((prev) => [...prev, newHighlight]);
      }
    } catch (error) {
      console.error("Failed to save highlight:", error);
    }

    setSelection(null);
    setPopupPosition(null);
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
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    } catch (error) {
      console.error("Failed to delete highlight:", error);
    }
    setSelectedHighlight(null);
    setHighlightPopupPosition(null);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="mb-2">
          <p className="text-sm text-muted">{concept.branchTitle}</p>
        </div>
        <h1 className="font-display text-xl">{concept.title}</h1>
      </div>

      {/* Content */}
      <div ref={previewRef} id="preview" className="flex-1 overflow-y-auto bg-white">
        <div
          ref={contentRef}
          id="preview-content"
          className="max-w-3xl mx-auto px-8 py-10"
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        />
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
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded w-full"
          >
            Delete highlight
          </button>
        </div>
      )}
    </div>
  );
}
