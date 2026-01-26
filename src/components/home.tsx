"use client";

import { useState, useEffect, useMemo } from "react";
import { signOut } from "next-auth/react";
import { BookList, EmptyState } from "./book-list";
import { UploadBook } from "./upload-book";
import { ThemeToggle } from "./theme-toggle";

function DailyQuote() {
  const quote = useMemo(() => {
    const hour = new Date().getHours();

    let quotes: string[];

    if (hour >= 5 && hour < 12) {
      quotes = [
        "A fresh mind learns best.",
        "Small steps, big gains.",
        "What will you discover today?",
      ];
    } else if (hour >= 12 && hour < 17) {
      quotes = [
        "A few minutes now compounds later.",
        "Steady progress beats bursts.",
        "The best time to review is now.",
      ];
    } else if (hour >= 17 && hour < 21) {
      quotes = [
        "Let it settle overnight.",
        "A quiet moment to reflect.",
        "Review helps memories take root.",
      ];
    } else {
      quotes = [
        "The world is quiet. Learn deeply.",
        "One concept before rest.",
        "Night owls learn well too.",
      ];
    }

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return quotes[dayOfYear % quotes.length];
  }, []);

  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      <svg className="w-7 h-7 text-accent flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="3" />
        {[...Array(8)].map((_, i) => (
          <line
            key={i}
            x1="12"
            y1="2"
            x2="12"
            y2="6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${i * 45} 12 12)`}
          />
        ))}
      </svg>
      <h2 className="font-display text-2xl font-medium text-foreground">
        {quote}
      </h2>
    </div>
  );
}

function MoteIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Central mote */}
      <circle cx="20" cy="20" r="4" fill="currentColor" />

      {/* Surrounding motes - arranged organically */}
      <circle cx="20" cy="8" r="2.5" fill="currentColor" opacity="0.7" />
      <circle cx="30" cy="13" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="32" cy="23" r="2.5" fill="currentColor" opacity="0.6" />
      <circle cx="27" cy="32" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="15" cy="33" r="2.5" fill="currentColor" opacity="0.6" />
      <circle cx="8" cy="25" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="9" cy="14" r="2.5" fill="currentColor" opacity="0.6" />

      {/* Subtle connection lines */}
      <path
        d="M20 16 L20 8 M24 18 L30 13 M24 22 L32 23 M22 24 L27 32 M18 24 L15 33 M16 20 L8 25 M16 18 L9 14"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}

interface Book {
  id: string;
  title: string;
  author: string | null;
  processingStatus: string;
  processingError?: string | null;
  progress: number;
}

export function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    try {
      const res = await fetch("/api/books");
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleUploadComplete() {
    setShowUpload(false);
    fetchBooks();
  }

  async function handleDeleteBook(bookId: string) {
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBooks(books.filter((b) => b.id !== bookId));
      }
    } catch (error) {
      console.error("Failed to delete book:", error);
    }
  }

  async function handleRetryBook(bookId: string) {
    try {
      // Update UI immediately
      setBooks(books.map((b) =>
        b.id === bookId
          ? { ...b, processingStatus: "processing", processingError: null }
          : b
      ));

      const res = await fetch(`/api/books/${bookId}/retry`, {
        method: "POST",
      });

      if (!res.ok) {
        // Revert on failure
        fetchBooks();
      }
    } catch (error) {
      console.error("Failed to retry book:", error);
      fetchBooks();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header - stays at top */}
      <div className="w-full max-w-xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MoteIcon className="w-7 h-7 text-foreground" />
            <h1 className="font-display text-2xl font-medium">Mote</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => signOut()}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content - vertically centered */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-xl">
          {showUpload ? (
            <UploadBook
              onComplete={handleUploadComplete}
              onCancel={() => setShowUpload(false)}
            />
          ) : books.length === 0 ? (
            <EmptyState onAddBook={() => setShowUpload(true)} />
          ) : (
            <>
              <DailyQuote />
              <BookList books={books} onDelete={handleDeleteBook} onRetry={handleRetryBook} />
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setShowUpload(true)}
                  className="px-5 py-2.5 rounded-lg bg-foreground/5 border border-foreground/10 hover:border-foreground/20 hover:bg-foreground/[0.07] transition-all text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add book
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
