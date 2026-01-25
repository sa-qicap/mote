"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  PdfLoader,
  PdfHighlighter,
  Tip,
  Highlight,
  Popup,
  AreaHighlight,
} from "react-pdf-highlighter";
import type { IHighlight, NewHighlight, Content, ScaledPosition } from "react-pdf-highlighter";
import { PDFDocument } from "pdf-lib";

import "react-pdf-highlighter/dist/style.css";

interface PdfHighlighterViewerProps {
  pdfUrl: string;
  startPage: number;
  endPage: number;
  pageOffset: number;
  conceptId: string;
}

// Generate unique ID for highlights
const getNextId = () => String(Math.random()).slice(2);

// Highlight popup component
function HighlightPopup({
  comment,
}: {
  comment: { text: string };
}) {
  if (!comment?.text) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
      <p className="text-sm text-gray-700">{comment.text}</p>
    </div>
  );
}

export function PdfHighlighterViewer({
  pdfUrl,
  startPage,
  endPage,
  pageOffset,
  conceptId,
}: PdfHighlighterViewerProps) {
  const [highlights, setHighlights] = useState<IHighlight[]>([]);
  const [extractedPdfUrl, setExtractedPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollViewerTo = useRef<(highlight: IHighlight) => void>(() => {});

  // Convert book page numbers to PDF page numbers using the book's offset
  const pdfStartPage = startPage + pageOffset;
  const pdfEndPage = endPage + pageOffset;

  // Fetch existing highlights
  useEffect(() => {
    async function fetchHighlights() {
      try {
        const res = await fetch(`/api/concepts/${conceptId}/highlights`);
        if (res.ok) {
          const data = await res.json();
          setHighlights(data);
        }
      } catch (err) {
        console.error("Failed to fetch highlights:", err);
      }
    }
    fetchHighlights();
  }, [conceptId]);

  // Extract PDF pages
  useEffect(() => {
    let cancelled = false;

    async function extractPages() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(pdfUrl);
        const pdfBytes = await response.arrayBuffer();
        const originalPdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const newPdf = await PDFDocument.create();

        const pageIndices = [];
        for (let i = pdfStartPage - 1; i < pdfEndPage; i++) {
          pageIndices.push(i);
        }

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
          console.error("PDF extraction error:", err);
          setError("Failed to load PDF pages");
          setLoading(false);
        }
      }
    }

    extractPages();

    return () => {
      cancelled = true;
      if (extractedPdfUrl) {
        URL.revokeObjectURL(extractedPdfUrl);
      }
    };
  }, [pdfUrl, pdfStartPage, pdfEndPage]);

  // Save highlight to database
  const saveHighlight = useCallback(
    async (highlight: IHighlight) => {
      try {
        await fetch(`/api/concepts/${conceptId}/highlights`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(highlight),
        });
      } catch (err) {
        console.error("Failed to save highlight:", err);
      }
    },
    [conceptId]
  );

  // Delete highlight from database
  const deleteHighlight = useCallback(
    async (highlightId: string) => {
      try {
        await fetch(`/api/concepts/${conceptId}/highlights?id=${highlightId}`, {
          method: "DELETE",
        });
        setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
      } catch (err) {
        console.error("Failed to delete highlight:", err);
      }
    },
    [conceptId]
  );

  // Add new highlight
  const addHighlight = useCallback(
    (highlight: NewHighlight) => {
      const newHighlight: IHighlight = {
        ...highlight,
        id: getNextId(),
      };
      setHighlights((prev) => [...prev, newHighlight]);
      saveHighlight(newHighlight);
    },
    [saveHighlight]
  );

  // Update highlight (for area highlights)
  const updateHighlight = useCallback(
    (highlightId: string, position: Partial<ScaledPosition>, content: Partial<Content>) => {
      setHighlights((prev) =>
        prev.map((h) => {
          if (h.id === highlightId) {
            return {
              ...h,
              position: { ...h.position, ...position },
              content: { ...h.content, ...content },
            };
          }
          return h;
        })
      );
    },
    []
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-muted">
        Loading PDF...
      </div>
    );
  }

  if (error || !extractedPdfUrl) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        {error || "Failed to load PDF"}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <span className="text-sm text-muted">
          Book pages {startPage}–{endPage}
        </span>
        <span className="text-xs text-muted">
          Select text to highlight
        </span>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        <PdfLoader url={extractedPdfUrl} beforeLoad={<div className="p-4 text-muted">Loading...</div>}>
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onScrollChange={() => {}}
              scrollRef={(scrollTo) => {
                scrollViewerTo.current = scrollTo;
              }}
              onSelectionFinished={(
                position,
                content,
                hideTipAndSelection,
                transformSelection
              ) => (
                <Tip
                  onOpen={transformSelection}
                  onConfirm={(comment) => {
                    addHighlight({ content, position, comment });
                    hideTipAndSelection();
                  }}
                />
              )}
              highlightTransform={(
                highlight,
                index,
                setTip,
                hideTip,
                viewportToScaled,
                screenshot,
                isScrolledTo
              ) => {
                const isTextHighlight = !highlight.content?.image;

                const component = isTextHighlight ? (
                  <Highlight
                    isScrolledTo={isScrolledTo}
                    position={highlight.position}
                    comment={highlight.comment}
                    onClick={() => {
                      setTip(highlight, (h) => (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                          {h.comment?.text && (
                            <p className="text-sm text-gray-700 mb-2">{h.comment.text}</p>
                          )}
                          <button
                            onClick={() => {
                              deleteHighlight(h.id);
                              hideTip();
                            }}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Delete highlight
                          </button>
                        </div>
                      ));
                    }}
                  />
                ) : (
                  <AreaHighlight
                    isScrolledTo={isScrolledTo}
                    highlight={highlight}
                    onChange={(boundingRect) => {
                      updateHighlight(
                        highlight.id,
                        { boundingRect: viewportToScaled(boundingRect) },
                        { image: screenshot(boundingRect) }
                      );
                    }}
                  />
                );

                return (
                  <Popup
                    popupContent={<HighlightPopup comment={highlight.comment} />}
                    onMouseOver={(popupContent) => setTip(highlight, () => popupContent)}
                    onMouseOut={hideTip}
                    key={index}
                  >
                    {component}
                  </Popup>
                );
              }}
              highlights={highlights}
            />
          )}
        </PdfLoader>
      </div>
    </div>
  );
}
