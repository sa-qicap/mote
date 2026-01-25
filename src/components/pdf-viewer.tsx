"use client";

import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";

interface PDFViewerProps {
  pdfUrl: string;
  startPage: number;
  endPage: number;
}

export function PDFViewer({ pdfUrl, startPage, endPage }: PDFViewerProps) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ESL book: PDF page = book page + 19
  const PAGE_OFFSET = 19;
  const pdfStartPage = startPage + PAGE_OFFSET;
  const pdfEndPage = endPage + PAGE_OFFSET;

  useEffect(() => {
    let cancelled = false;

    async function extractPages() {
      setLoading(true);
      setError(null);

      try {
        // Fetch the original PDF
        const response = await fetch(pdfUrl);
        const pdfBytes = await response.arrayBuffer();

        // Load the PDF
        const originalPdf = await PDFDocument.load(pdfBytes);

        // Create a new PDF with only the pages we need
        const newPdf = await PDFDocument.create();

        // Copy pages (pdf-lib uses 0-based indexing)
        const pageIndices = [];
        for (let i = pdfStartPage - 1; i < pdfEndPage; i++) {
          pageIndices.push(i);
        }

        const pages = await newPdf.copyPages(originalPdf, pageIndices);
        pages.forEach((page) => newPdf.addPage(page));

        // Save the new PDF
        const newPdfBytes = await newPdf.save();

        // Create blob URL
        const blob = new Blob([newPdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        if (!cancelled) {
          setPdfBlobUrl(url);
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
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfUrl, pdfStartPage, pdfEndPage]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2 flex items-center">
        <span className="text-sm text-muted">
          Book pages {startPage}–{endPage}
        </span>
      </div>

      {/* PDF viewer */}
      <div className="flex-1 flex justify-center bg-gray-50">
        {loading && (
          <div className="text-center py-8 text-muted">Loading PDF pages...</div>
        )}
        {error && (
          <div className="text-center py-8 text-red-500">{error}</div>
        )}
        {!loading && !error && pdfBlobUrl && (
          <iframe
            src={pdfBlobUrl}
            className="h-full border-0 w-full max-w-3xl shadow-sm bg-white"
            title="PDF Viewer"
          />
        )}
      </div>
    </div>
  );
}
