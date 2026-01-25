"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { BookList } from "./book-list";
import { UploadBook } from "./upload-book";
import { Pet } from "./pet";
import { ThemeToggle } from "./theme-toggle";

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
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-12">
          <h1 className="font-display text-2xl">Mote</h1>
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

        {showUpload ? (
          <UploadBook
            onComplete={handleUploadComplete}
            onCancel={() => setShowUpload(false)}
          />
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted mb-8">No books yet</p>
            <button
              onClick={() => setShowUpload(true)}
              className="btn btn-primary"
            >
              Upload your first book
            </button>
          </div>
        ) : (
          <>
            <BookList books={books} onDelete={handleDeleteBook} onRetry={handleRetryBook} />
            <button
              onClick={() => setShowUpload(true)}
              className="w-full mt-6 btn btn-secondary"
            >
              + Add book
            </button>
          </>
        )}
      </div>

      <Pet state="neutral" />
    </div>
  );
}
