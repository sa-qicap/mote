"use client";

import Link from "next/link";

interface Book {
  id: string;
  title: string;
  author: string | null;
  processingStatus: string;
  processingError?: string | null;
  progress: number;
}

interface BookListProps {
  books: Book[];
  onDelete?: (bookId: string) => void;
  onRetry?: (bookId: string) => void;
}

export function BookList({ books, onDelete, onRetry }: BookListProps) {
  return (
    <div className="space-y-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} onDelete={onDelete} onRetry={onRetry} />
      ))}
    </div>
  );
}

function BookCard({ book, onDelete, onRetry }: { book: Book; onDelete?: (bookId: string) => void; onRetry?: (bookId: string) => void }) {
  const isProcessing = book.processingStatus !== "completed";
  const isFailed = book.processingStatus === "failed";

  if (isFailed) {
    return (
      <div className="p-6 rounded-lg border border-error/30 bg-error/5">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-display text-lg mb-1">{book.title}</h3>
            <p className="text-sm text-error mb-2">Processing failed</p>
            {book.processingError && (
              <p className="text-xs text-muted bg-foreground/5 p-2 rounded font-mono break-all">
                {book.processingError}
              </p>
            )}
          </div>
          <div className="flex gap-3 ml-4">
            <button
              onClick={() => onRetry?.(book.id)}
              className="text-accent hover:underline transition-colors text-sm"
            >
              Retry
            </button>
            <button
              onClick={() => onDelete?.(book.id)}
              className="text-muted hover:text-error transition-colors text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="p-6 rounded-lg border border-foreground/10 opacity-60">
        <h3 className="font-display text-lg mb-1">{book.title}</h3>
        {book.author && (
          <p className="text-sm text-muted mb-3">{book.author}</p>
        )}
        <p className="text-sm text-muted">
          {book.processingStatus === "processing"
            ? "Processing..."
            : "Pending..."}
        </p>
      </div>
    );
  }

  return (
    <Link href={`/book/${book.id}`}>
      <div className="p-6 rounded-lg border border-foreground/10 hover:border-foreground/30 transition-colors cursor-pointer">
        <h3 className="font-display text-lg mb-1">{book.title}</h3>
        {book.author && (
          <p className="text-sm text-muted mb-3">{book.author}</p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-500"
              style={{ width: `${book.progress}%` }}
            />
          </div>
          <span className="text-sm text-muted">{book.progress}%</span>
        </div>
      </div>
    </Link>
  );
}
