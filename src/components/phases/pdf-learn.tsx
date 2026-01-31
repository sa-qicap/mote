"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import dynamic from "next/dynamic";
import type { IHighlight, NewHighlight } from "react-pdf-highlighter";

// Dynamically import react-pdf-highlighter components with ssr: false
const PdfLoader = dynamic(
  () => import("react-pdf-highlighter").then((mod) => mod.PdfLoader),
  { ssr: false }
);

const PdfHighlighter = dynamic(
  () => import("react-pdf-highlighter").then((mod) => mod.PdfHighlighter),
  { ssr: false }
);

const Highlight = dynamic(
  () => import("react-pdf-highlighter").then((mod) => mod.Highlight),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-pdf-highlighter").then((mod) => mod.Popup),
  { ssr: false }
);

interface PdfLearnPhaseProps {
  pdfUrl: string;
  startPage: number;
  endPage: number;
  pageOffset: number;
  conceptId: string;
  conceptTitle: string;
  branchTitle: string;
}

export function PdfLearnPhase({
  pdfUrl,
  startPage,
  endPage,
  pageOffset,
  conceptId,
}: PdfLearnPhaseProps) {
  const [extractedPdfUrl, setExtractedPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<IHighlight[]>([]);
  const [highlightMode, setHighlightMode] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const scrollViewerTo = useRef<(highlight: IHighlight) => void>(() => {});

  const pdfStartPage = startPage + pageOffset;
  const pdfEndPage = endPage + pageOffset;
  const pageCount = endPage - startPage + 1;

  // Set ready after mount
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Extract PDF pages
  useEffect(() => {
    let cancelled = false;

    async function extractPages() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error("Failed to fetch PDF");

        const pdfBytes = await response.arrayBuffer();
        const originalPdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

        const pageIndices = [];
        for (let i = pdfStartPage - 1; i < pdfEndPage; i++) {
          if (i >= 0 && i < originalPdf.getPageCount()) {
            pageIndices.push(i);
          }
        }

        if (pageIndices.length === 0) {
          throw new Error("No valid pages to extract");
        }

        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(originalPdf, pageIndices);
        pages.forEach((page) => newPdf.addPage(page));

        const newPdfBytes = await newPdf.save();
        const blob = new Blob([newPdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        if (!cancelled) {
          setExtractedPdfUrl(url);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load PDF");
          setLoading(false);
        }
      }
    }

    extractPages();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, pdfStartPage, pdfEndPage]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (extractedPdfUrl) {
        URL.revokeObjectURL(extractedPdfUrl);
      }
    };
  }, [extractedPdfUrl]);

  // Fetch existing highlights
  useEffect(() => {
    async function fetchHighlights() {
      try {
        const res = await fetch(`/api/concepts/${conceptId}/pdf-highlights`);
        if (res.ok) {
          const data = await res.json();
          const converted = data.map((h: any) => ({
            id: h.id,
            content: { text: h.text },
            position: h.rects ? JSON.parse(h.rects) : {},
            comment: { text: h.note || "", emoji: "" },
          }));
          setHighlights(converted);
        }
      } catch (err) {
        console.error("Failed to fetch highlights:", err);
      }
    }
    if (conceptId) fetchHighlights();
  }, [conceptId]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "h" && !e.metaKey && !e.ctrlKey) {
        setHighlightMode((prev) => !prev);
      }
      if (e.key === "Escape" && highlightMode) {
        setHighlightMode(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [highlightMode]);

  // Add highlight
  const addHighlight = useCallback(
    async (highlight: NewHighlight) => {
      const newHighlight: IHighlight = {
        ...highlight,
        id: `highlight-${Date.now()}`,
        comment: { text: "", emoji: "" },
      };

      setHighlights((prev) => [...prev, newHighlight]);

      try {
        const res = await fetch(`/api/concepts/${conceptId}/pdf-highlights`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageNumber: highlight.position.pageNumber,
            text: highlight.content.text || "",
            color: "#fef08a",
            rects: JSON.stringify(highlight.position),
            note: "",
          }),
        });
        if (res.ok) {
          const saved = await res.json();
          setHighlights((prev) =>
            prev.map((h) => (h.id === newHighlight.id ? { ...h, id: saved.id } : h))
          );
        }
      } catch (err) {
        console.error("Failed to save highlight:", err);
      }
    },
    [conceptId]
  );

  // Delete highlight
  const deleteHighlight = useCallback(
    async (highlightId: string) => {
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));

      try {
        await fetch(`/api/concepts/${conceptId}/pdf-highlights?id=${highlightId}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to delete highlight:", err);
      }
    },
    [conceptId]
  );

  // Highlight popup
  const HighlightPopup = ({ highlight }: { highlight: IHighlight }) => (
    <div className="bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 p-3 min-w-[150px]">
      <p className="text-xs text-stone-600 dark:text-stone-300 mb-2 max-w-[200px] line-clamp-3">
        "{highlight.content.text}"
      </p>
      <button
        onClick={() => deleteHighlight(highlight.id)}
        className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
      >
        Delete
      </button>
    </div>
  );

  if (!isReady || loading) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col items-center justify-center bg-amber-50/30 dark:bg-stone-900/50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-20 rounded-sm bg-amber-100/60 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30 shadow-sm" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-0.5 bg-amber-300/60 dark:bg-amber-700/40 rounded animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400 font-light tracking-wide">
              Preparing your reading
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              Pages {startPage}–{endPage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !extractedPdfUrl) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col items-center justify-center bg-amber-50/30 dark:bg-stone-900/50">
        <p className="text-stone-600 dark:text-stone-300 text-sm">{error || "Failed to load PDF"}</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-gradient-to-b from-amber-50/50 via-orange-50/30 to-amber-50/50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900">
      {/* Header */}
      <header className="shrink-0 relative z-30 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border-b border-amber-100 dark:border-stone-800">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${highlightMode ? "bg-yellow-500 animate-pulse" : "bg-amber-400"}`} />
                <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                  {highlightMode ? "Highlighting" : "Reading"}
                </span>
              </div>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs text-stone-500">{pageCount} pages</span>
            </div>

            <div className="px-3 py-1 rounded-full bg-white dark:bg-stone-800 border border-amber-100 dark:border-stone-700 shadow-sm">
              <span className="text-xs font-mono text-stone-600 dark:text-stone-300">
                pp. {startPage}–{endPage}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setHighlightMode(!highlightMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                  highlightMode
                    ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300"
                    : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="text-xs font-medium">Highlight</span>
              </button>

              {highlights.length > 0 && (
                <span className="text-xs text-stone-400">{highlights.length} saved</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {highlightMode && (
        <div className="shrink-0 bg-yellow-50 border-b border-yellow-200/50 px-4 py-2">
          <p className="text-center text-xs text-yellow-700">
            Select text to highlight • Press <kbd className="px-1.5 py-0.5 rounded bg-yellow-100 font-mono text-[10px]">ESC</kbd> to exit
          </p>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <PdfLoader
          url={extractedPdfUrl}
          beforeLoad={
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-stone-400 animate-pulse">Loading PDF...</p>
            </div>
          }
        >
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => highlightMode && event.altKey}
              onScrollChange={() => {}}
              scrollRef={(scrollTo) => {
                scrollViewerTo.current = scrollTo;
              }}
              onSelectionFinished={(position, content, hideTipAndSelection) => {
                if (highlightMode) {
                  addHighlight({ content, position, comment: { text: "", emoji: "" } });
                }
                hideTipAndSelection();
                return null;
              }}
              highlightTransform={(highlight, index, setTip, hideTip) => (
                <Popup
                  popupContent={<HighlightPopup highlight={highlight} />}
                  onMouseOver={(popupContent) => setTip(highlight, () => popupContent)}
                  onMouseOut={hideTip}
                  key={index}
                >
                  <Highlight
                    isScrolledTo={false}
                    position={highlight.position}
                    comment={highlight.comment}
                  />
                </Popup>
              )}
              highlights={highlights}
            />
          )}
        </PdfLoader>
      </div>
    </div>
  );
}
