"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface DrawingCanvasProps {
  isActive: boolean;
  onClose: () => void;
  conceptId: string;
}

const COLORS = [
  { name: "ink", value: "#1a1a1a" },
  { name: "ember", value: "#dc2626" },
  { name: "ocean", value: "#2563eb" },
];

export function DrawingCanvas({
  isActive,
  onClose,
  conceptId,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(COLORS[0].value);
  const [isEraser, setIsEraser] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved drawings on mount (once)
  useEffect(() => {
    if (hasLoaded) return;

    async function loadDrawings() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/concepts/${conceptId}/drawings`);
        if (res.ok) {
          const data = await res.json();
          setStrokes(data.strokes || []);
        }
      } catch (error) {
        console.error("Failed to load drawings:", error);
      } finally {
        setIsLoading(false);
        setHasLoaded(true);
      }
    }

    loadDrawings();
  }, [conceptId, hasLoaded]);

  // Save drawings
  const saveDrawings = useCallback(
    async (strokesToSave: Stroke[]) => {
      setIsSaving(true);
      try {
        await fetch(`/api/concepts/${conceptId}/drawings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ strokes: strokesToSave }),
        });
      } catch (error) {
        console.error("Failed to save drawings:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [conceptId]
  );

  // Debounced save
  const debouncedSave = useCallback(
    (strokesToSave: Stroke[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveDrawings(strokesToSave);
      }, 500);
    },
    [saveDrawings]
  );

  // Resize canvas to match container
  useEffect(() => {
    const updateSize = () => {
      const preview = document.getElementById("preview");
      if (!preview) return;

      const width = preview.scrollWidth;
      const height = preview.scrollHeight;

      if (width > 0 && height > 0) {
        setCanvasSize({ width, height });
      }
    };

    // Initial size
    updateSize();

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(updateSize, 100);

    window.addEventListener("resize", updateSize);

    const observer = new ResizeObserver(updateSize);
    const preview = document.getElementById("preview");
    if (preview) observer.observe(preview);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", updateSize);
      observer.disconnect();
    };
  }, [isActive]);

  // Redraw canvas when strokes change or canvas resizes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      drawStroke(ctx, stroke);
    }

    if (currentStroke.length > 0) {
      drawStroke(ctx, {
        points: currentStroke,
        color: isEraser ? "eraser" : currentColor,
        width: isEraser ? 20 : 2,
      });
    }
  }, [strokes, currentStroke, canvasSize, currentColor, isEraser]);

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (stroke.color === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = stroke.width;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
    }

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length - 1; i++) {
      const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
      const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
    }

    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();

    ctx.globalCompositeOperation = "source-over";
  };

  const getPointerPosition = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scrollContainer = document.getElementById("preview");

      let clientX: number, clientY: number;

      if ("touches" in e) {
        if (e.touches.length === 0) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const scrollTop = scrollContainer?.scrollTop || 0;
      const scrollLeft = scrollContainer?.scrollLeft || 0;

      return {
        x: clientX - rect.left + scrollLeft,
        y: clientY - rect.top + scrollTop,
      };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isActive) return;
      e.preventDefault();
      const point = getPointerPosition(e);
      if (!point) return;

      setIsDrawing(true);
      setCurrentStroke([point]);
    },
    [getPointerPosition, isActive]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !isActive) return;
      e.preventDefault();

      const point = getPointerPosition(e);
      if (!point) return;

      setCurrentStroke((prev) => [...prev, point]);
    },
    [isDrawing, getPointerPosition, isActive]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || currentStroke.length === 0 || !isActive) {
      setIsDrawing(false);
      return;
    }

    const newStroke: Stroke = {
      points: currentStroke,
      color: isEraser ? "eraser" : currentColor,
      width: isEraser ? 20 : 2,
    };

    const newStrokes = [...strokes, newStroke];
    setStrokes(newStrokes);
    setCurrentStroke([]);
    setIsDrawing(false);

    // Save after each stroke
    debouncedSave(newStrokes);
  }, [isDrawing, currentStroke, isEraser, currentColor, strokes, debouncedSave, isActive]);

  const handleClear = async () => {
    setStrokes([]);
    setCurrentStroke([]);

    // Delete from server
    try {
      await fetch(`/api/concepts/${conceptId}/drawings`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to clear drawings:", error);
    }
  };

  const handleDone = async () => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Always save before closing
    if (strokes.length > 0) {
      await saveDrawings(strokes);
    }

    onClose();
  };

  // Don't render anything if no strokes and not active
  if (!isActive && strokes.length === 0) return null;

  return (
    <>
      {/* Canvas overlay - always visible if there are strokes */}
      <div
        ref={containerRef}
        className={`absolute inset-0 ${isActive ? 'z-20' : 'z-10 pointer-events-none'}`}
        style={{
          cursor: isActive
            ? isEraser
              ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='8' fill='none' stroke='%23666' stroke-width='1.5'/%3E%3C/svg%3E") 10 10, auto`
              : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='${encodeURIComponent(currentColor)}'/%3E%3C/svg%3E") 2 2, crosshair`
            : 'default',
        }}
      >
        {/* Paper grain texture overlay - only in active mode */}
        {isActive && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        )}

        {isActive && isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
            <span className="text-sm text-muted">Loading drawings...</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="touch-none"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>

      {/* Floating toolbar - only when active */}
      {isActive && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <div
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-lg border"
            style={{
              background: "linear-gradient(to bottom, rgba(255,255,255,0.98), rgba(250,250,250,0.98))",
              borderColor: "rgba(0,0,0,0.08)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            {/* Drawing tool */}
            <button
              onClick={() => setIsEraser(false)}
              className={`
                relative p-2 rounded-lg transition-all duration-150
                ${!isEraser ? "bg-neutral-100 shadow-inner" : "hover:bg-neutral-50"}
              `}
              title="Draw"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={!isEraser ? currentColor : "#888"}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
              {!isEraser && (
                <span
                  className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white"
                  style={{ backgroundColor: currentColor }}
                />
              )}
            </button>

            {/* Eraser */}
            <button
              onClick={() => setIsEraser(true)}
              className={`
                p-2 rounded-lg transition-all duration-150
                ${isEraser ? "bg-neutral-100 shadow-inner" : "hover:bg-neutral-50"}
              `}
              title="Eraser"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isEraser ? "#1a1a1a" : "#888"}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 21h10" />
                <path d="M5.5 13.5L15 4a2.12 2.12 0 0 1 3 3L8.5 16.5l-4 1 1-4z" />
              </svg>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-neutral-200 mx-1" />

            {/* Color options */}
            {COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => {
                  setCurrentColor(color.value);
                  setIsEraser(false);
                }}
                className={`
                  w-6 h-6 rounded-full transition-all duration-150
                  ${currentColor === color.value && !isEraser
                    ? "ring-2 ring-offset-2 ring-neutral-400 scale-110"
                    : "hover:scale-105"
                  }
                `}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-neutral-200 mx-1" />

            {/* Clear */}
            <button
              onClick={handleClear}
              className="p-2 rounded-lg hover:bg-red-50 transition-all duration-150 group"
              title="Clear all"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#888"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:stroke-red-500 transition-colors"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-neutral-200 mx-1" />

            {/* Saving indicator */}
            {isSaving && (
              <span className="text-xs text-muted px-1">Saving...</span>
            )}

            {/* Done */}
            <button
              onClick={handleDone}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-all duration-150"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
