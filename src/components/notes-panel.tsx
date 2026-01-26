"use client";

import { useState, useEffect, useRef } from "react";
import { NoteCard } from "./note-card";

interface Note {
  id: string;
  content: string;
  phase: string | null;
  highlightText: string | null;
  createdAt: string;
}

interface Highlight {
  id: string;
  text: string;
  color: string;
  note: string | null;
}

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  conceptId: string;
  currentPhase: string;
  highlights: Highlight[];
  onHighlightDelete: (highlightId: string) => void;
}

export function NotesPanel({
  isOpen,
  onClose,
  bookId,
  conceptId,
  currentPhase,
  highlights,
  onHighlightDelete,
}: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch notes when panel opens or conceptId changes
  useEffect(() => {
    if (isOpen) {
      fetchNotes();
    }
  }, [isOpen, conceptId]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  async function fetchNotes() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}/concepts/${conceptId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveNote() {
    if (!newNoteContent.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/books/${bookId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId,
          phase: currentPhase,
          content: newNoteContent.trim(),
        }),
      });

      if (res.ok) {
        const newNote = await res.json();
        setNotes((prev) => [
          {
            id: newNote.id,
            content: newNote.content,
            phase: currentPhase,
            highlightText: newNote.highlightText,
            createdAt: newNote.createdAt,
          },
          ...prev,
        ]);
        setNewNoteContent("");
      }
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      const res = await fetch(`/api/books/${bookId}/concepts/${conceptId}/notes?noteId=${noteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  }

  async function handleEditNote(noteId: string, content: string) {
    const res = await fetch(`/api/books/${bookId}/concepts/${conceptId}/notes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId, content }),
    });

    if (res.ok) {
      const updatedNote = await res.json();
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? { ...n, content: updatedNote.content } : n
        )
      );
    } else {
      throw new Error("Failed to update note");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveNote();
    }
  }

  const totalCount = notes.length + highlights.length;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-35 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] z-40 bg-background border-l border-border shadow-xl transform transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-medium text-foreground">Notes</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-foreground/5 transition-colors"
            aria-label="Close notes panel"
          >
            <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-57px)]">
          {/* Add note input */}
          <div className="p-4 border-b border-border">
            <textarea
              ref={inputRef}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a note..."
              className="w-full p-2 text-sm bg-surface border border-border rounded-lg resize-none focus:outline-none focus:border-accent"
              rows={3}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted">
                {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Enter to save
              </span>
              <button
                onClick={handleSaveNote}
                disabled={!newNoteContent.trim() || isSaving}
                className="px-3 py-1 text-sm bg-foreground text-background rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* Notes & Highlights list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="text-center text-muted py-8">Loading...</div>
            ) : totalCount === 0 ? (
              <div className="text-center text-muted py-8">
                <p className="text-sm">No notes yet</p>
                <p className="text-xs mt-1">Add notes or highlight text in Learn phase</p>
              </div>
            ) : (
              <>
                {/* Notes section */}
                {notes.length > 0 && (
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <NoteCard key={note.id} note={note} onDelete={handleDeleteNote} onEdit={handleEditNote} />
                    ))}
                  </div>
                )}

                {/* Highlights section */}
                {highlights.length > 0 && (
                  <>
                    {notes.length > 0 && (
                      <div className="flex items-center gap-2 py-2">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted">Highlights</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}
                    <div className="space-y-2">
                      {highlights.map((highlight) => (
                        <div
                          key={highlight.id}
                          className="group p-3 rounded-lg bg-surface border border-border hover:border-foreground/20 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className="w-1 h-full min-h-[20px] rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  highlight.color === "yellow"
                                    ? "rgb(250, 204, 21)"
                                    : highlight.color === "green"
                                    ? "rgb(74, 222, 128)"
                                    : "rgb(248, 113, 113)",
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">
                                &ldquo;{highlight.text.slice(0, 100)}{highlight.text.length > 100 ? "..." : ""}&rdquo;
                              </p>
                              {highlight.note && (
                                <p className="mt-1 text-xs text-muted">{highlight.note}</p>
                              )}
                            </div>
                            <button
                              onClick={() => onHighlightDelete(highlight.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted hover:text-error transition-opacity shrink-0"
                              aria-label="Delete highlight"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
