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
    <div className="w-full">
      <ul className="flex flex-col gap-4">
        {books.map((book, index) => (
          <BookRow
            key={book.id}
            book={book}
            onDelete={onDelete}
            onRetry={onRetry}
            index={index}
          />
        ))}
      </ul>
    </div>
  );
}

function BookRow({
  book,
  onDelete,
  onRetry,
  index = 0,
}: {
  book: Book;
  onDelete?: (bookId: string) => void;
  onRetry?: (bookId: string) => void;
  index?: number;
}) {
  const isProcessing = book.processingStatus !== "completed";
  const isFailed = book.processingStatus === "failed";

  const content = (
    <div
      className="group py-5 px-4 rounded-xl border border-foreground/[0.06] bg-foreground/[0.01] book-card"
      style={{ animationDelay: `${index * 100}ms, ${index * 100 + 400}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Book info */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-display text-base font-medium truncate ${
              isFailed ? "text-error" : "text-foreground"
            }`}
            title={book.title}
          >
            {book.title}
          </h3>
          {book.author && (
            <p className="text-sm text-muted truncate mt-0.5" title={book.author}>
              {book.author}
            </p>
          )}
        </div>

        {/* Status / Progress */}
        <div className="flex items-center gap-3">
          {isFailed ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-error">Failed</span>
              {onRetry && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRetry(book.id);
                  }}
                  className="text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          ) : isProcessing ? (
            <span className="text-sm text-muted animate-pulse">Processing...</span>
          ) : (
            <span className="text-sm text-muted tabular-nums w-12 text-right">
              {book.progress}%
            </span>
          )}

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(book.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-error transition-all"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar - only for completed books with progress */}
      {!isProcessing && (
        <div className="mt-3 h-0.5 bg-foreground/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent/40 rounded-full transition-all duration-500"
            style={{ width: `${book.progress}%` }}
          />
        </div>
      )}
    </div>
  );

  if (!isProcessing) {
    return (
      <li>
        <Link href={`/book/${book.id}`} className="block">
          {content}
        </Link>
      </li>
    );
  }

  return <li>{content}</li>;
}

// Empty state component
export function EmptyState({ onAddBook }: { onAddBook: () => void }) {
  return (
    <div className="text-center py-20">
      <p className="text-muted mb-4">No books yet</p>
      <button
        onClick={onAddBook}
        className="px-5 py-2.5 rounded-lg bg-foreground/5 border border-foreground/10 hover:border-foreground/20 hover:bg-foreground/[0.07] transition-all text-sm"
      >
        Add your first book
      </button>
    </div>
  );
}
