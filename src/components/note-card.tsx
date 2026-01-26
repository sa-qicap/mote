"use client";

import { useState } from "react";

interface NoteCardProps {
  note: {
    id: string;
    content: string;
    phase: string | null;
    highlightText: string | null;
    createdAt: string;
  };
  onDelete: (id: string) => void;
}

const PHASE_LABELS: Record<string, string> = {
  prime: "Prime",
  learn: "Learn",
  test: "Test",
  reflect: "Reflect",
};

const PHASE_COLORS: Record<string, string> = {
  prime: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  learn: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  test: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  reflect: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = note.content.length > 100;
  const displayContent = expanded || !isLong
    ? note.content
    : note.content.slice(0, 100) + "...";

  return (
    <div className="group p-3 rounded-lg bg-surface border border-border hover:border-foreground/20 transition-colors">
      {/* Highlight text indicator */}
      {note.highlightText && (
        <div className="mb-2 pl-2 border-l-2 border-amber-400">
          <p className="text-xs text-muted italic truncate">
            &ldquo;{note.highlightText.slice(0, 50)}{note.highlightText.length > 50 ? "..." : ""}&rdquo;
          </p>
        </div>
      )}

      {/* Note content */}
      <p className="text-sm text-foreground">{displayContent}</p>

      {/* Expand/collapse toggle */}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
        >
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? "Less" : "More"}
        </button>
      )}

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {note.phase && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${PHASE_COLORS[note.phase] || "bg-muted/20 text-muted"}`}>
              {PHASE_LABELS[note.phase] || note.phase}
            </span>
          )}
          <span className="text-xs text-muted">{formatRelativeTime(note.createdAt)}</span>
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(note.id)}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-error transition-opacity"
          aria-label="Delete note"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
