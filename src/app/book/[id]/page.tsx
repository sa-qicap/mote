"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

interface Concept {
  id: string;
  title: string;
  branchId: string;
  orderInBranch: number;
  estimatedMinutes: number;
  status: "not_started" | "primed" | "learning" | "testing" | "completed";
  dependencies: string[];
}

interface Branch {
  id: string;
  title: string;
  chapterNumber: number;
}

interface BookData {
  id: string;
  title: string;
  author: string | null;
  branches: Branch[];
  concepts: Concept[];
  progress: number;
  currentConceptId: string | null;
  nextConceptId: string | null;
}

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchBook();
    }
  }, [params.id]);

  async function fetchBook() {
    try {
      const res = await fetch(`/api/books/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setBook(data);
      }
    } catch (error) {
      console.error("Failed to fetch book:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusClass(status: Concept["status"]) {
    switch (status) {
      case "completed":
        return "bg-success/20 border-success text-success";
      case "primed":
      case "learning":
      case "testing":
        return "bg-accent/20 border-accent text-accent";
      default:
        return "bg-surface border-border text-foreground";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Book not found</div>
      </div>
    );
  }

  // Group concepts by branch
  const branchConcepts = new Map<string, Concept[]>();
  for (const concept of book.concepts) {
    const existing = branchConcepts.get(concept.branchId) || [];
    existing.push(concept);
    branchConcepts.set(concept.branchId, existing);
  }

  // Sort branches by chapter number
  const sortedBranches = [...book.branches].sort(
    (a, b) => a.chapterNumber - b.chapterNumber
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="text-center py-8 border-b border-border">
        <button
          onClick={() => router.push("/")}
          className="absolute left-6 top-8 text-muted hover:text-foreground transition-colors"
        >
          ←
        </button>
        <div className="absolute right-6 top-8">
          <ThemeToggle />
        </div>

        <h1 className="font-display text-xl mb-1">{book.title}</h1>
        {book.author && <p className="text-sm text-muted">{book.author}</p>}

        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="w-32 h-1 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-500"
              style={{ width: `${book.progress}%` }}
            />
          </div>
          <span className="text-sm text-muted">{book.progress}%</span>
        </div>
      </div>

      {/* Mind Map - Flow Layout */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {sortedBranches.map((branch) => {
            const concepts = branchConcepts.get(branch.id) || [];
            concepts.sort((a, b) => a.orderInBranch - b.orderInBranch);

            if (concepts.length === 0) return null;

            return (
              <div key={branch.id} className="space-y-3">
                {/* Branch title */}
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-medium text-muted shrink-0">
                    {branch.title}
                  </h2>
                  <div className="h-px bg-border flex-1" />
                </div>

                {/* Concepts - horizontal wrap */}
                <div className="flex flex-wrap gap-2">
                  {concepts.map((concept) => {
                    const statusClass = getStatusClass(concept.status);

                    return (
                      <button
                        key={concept.id}
                        onClick={() => router.push(`/book/${params.id}/concept/${concept.id}`)}
                        className={`px-3 py-2 rounded-lg border text-left transition-all hover:scale-[1.02] hover:shadow-sm ${statusClass}`}
                      >
                        <div className="text-xs font-medium">
                          {concept.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
