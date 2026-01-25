"use client";

import { useState, useEffect } from "react";

interface Note {
  id: string;
  content: string;
  highlightText: string | null;
  createdAt: string;
}

interface Bookmark {
  id: string;
  highlightedText: string;
  annotation: string | null;
  createdAt: string;
}

interface NotesPanelProps {
  bookId: string;
  conceptId: string;
  phase: string;
  onClose: () => void;
}

export function NotesPanel({ bookId, conceptId, phase, onClose }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [conceptId]);

  async function fetchNotes() {
    try {
      const res = await fetch(`/api/books/${bookId}/concepts/${conceptId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
        setBookmarks(data.bookmarks);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;

    try {
      const res = await fetch(`/api/books/${bookId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId,
          phase,
          content: newNote,
        }),
      });

      if (res.ok) {
        const note = await res.json();
        setNotes([note, ...notes]);
        setNewNote("");
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      await fetch(`/api/books/${bookId}/notes/${noteId}`, {
        method: "DELETE",
      });
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-background border-l border-foreground/10 flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-foreground/10">
        <span className="font-medium">Notes</span>
        <button
          onClick={onClose}
          className="text-muted hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Add note */}
      <div className="p-4 border-b border-foreground/10">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="+ add note..."
          className="w-full p-2 bg-transparent border border-foreground/10 rounded-lg focus:border-foreground/20 focus:outline-none resize-none text-sm"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) {
              handleAddNote();
            }
          }}
        />
        {newNote.trim() && (
          <button
            onClick={handleAddNote}
            className="mt-2 text-sm text-accent hover:underline"
          >
            Save (⌘↵)
          </button>
        )}
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : (
          <>
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-3 bg-foreground/5 rounded-lg group relative"
              >
                {note.highlightText && (
                  <p className="text-xs text-muted mb-2 italic">
                    "{note.highlightText}"
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="absolute top-2 right-2 text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  ✕
                </button>
              </div>
            ))}

            {bookmarks.length > 0 && (
              <>
                <div className="text-xs text-muted mt-6 mb-2">Bookmarks</div>
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="p-3 border border-foreground/10 rounded-lg"
                  >
                    <p className="text-sm">🔖 "{bookmark.highlightedText}"</p>
                    {bookmark.annotation && (
                      <p className="text-xs text-muted mt-1">
                        {bookmark.annotation}
                      </p>
                    )}
                  </div>
                ))}
              </>
            )}

            {notes.length === 0 && bookmarks.length === 0 && (
              <p className="text-sm text-muted text-center py-8">
                No notes yet
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
