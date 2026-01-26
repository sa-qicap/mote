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
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-muted/30 border-t-foreground/60 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 text-center py-6 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <button
          onClick={() => router.push("/")}
          className="absolute left-5 top-6 text-muted hover:text-foreground transition-colors duration-200"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 4L6 10L12 16" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="absolute right-5 top-6">
          <ThemeToggle />
        </div>

        <h1 className="font-display text-xl mb-0.5">{book.title}</h1>
        {book.author && (
          <p className="text-sm text-muted">{book.author}</p>
        )}

        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="relative w-32 h-1 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-success rounded-full transition-all duration-500"
              style={{ width: `${book.progress}%` }}
            />
          </div>
          <span className="text-xs text-muted tabular-nums">{book.progress}%</span>
        </div>
      </header>

      {/* Mind Map */}
      <div className="flex-1 overflow-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-10">
          {sortedBranches.map((branch, branchIndex) => {
            const concepts = branchConcepts.get(branch.id) || [];
            concepts.sort((a, b) => a.orderInBranch - b.orderInBranch);

            if (concepts.length === 0) return null;

            return (
              <div
                key={branch.id}
                className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${branchIndex * 80}ms` }}
              >
                {/* Branch Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-surface border border-border/60 flex items-center justify-center text-xs text-muted font-medium">
                    {branch.chapterNumber}
                  </div>
                  <h2 className="text-sm font-medium text-foreground/80">
                    {branch.title}
                  </h2>
                </div>

                {/* Concepts Row with Connection Line */}
                <div className="relative pl-4 ml-4 border-l border-border/40">
                  <div className="flex flex-wrap gap-2 py-2">
                    {concepts.map((concept, i) => {
                      const isHovered = hoveredNode === concept.id;
                      const isCompleted = concept.status === 'completed';
                      const isInProgress = ['primed', 'learning', 'testing'].includes(concept.status);

                      return (
                        <button
                          key={concept.id}
                          onClick={() => router.push(`/book/${params.id}/concept/${concept.id}`)}
                          onMouseEnter={() => setHoveredNode(concept.id)}
                          onMouseLeave={() => setHoveredNode(null)}
                          className={`
                            relative px-3 py-2 rounded-lg text-left
                            transition-all duration-200 ease-out
                            border
                            ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                            ${isCompleted
                              ? 'bg-success/10 border-success/35 hover:border-success/50 shadow-[inset_0_0_10px_rgba(var(--success)/0.12)]'
                              : isInProgress
                                ? 'bg-accent/10 border-accent/35 hover:border-accent/50 shadow-[inset_0_0_10px_rgba(var(--accent)/0.15)] in-progress-glow'
                                : 'bg-surface/50 border-border/35 hover:border-border/55 hover:bg-surface/70'
                            }
                            ${isHovered ? 'scale-[1.02]' : ''}
                          `}
                          style={{
                            transitionDelay: mounted ? '0ms' : `${branchIndex * 80 + i * 30 + 100}ms`,
                            maxWidth: '200px'
                          }}
                        >
                          {/* Status dot */}
                          <div className="relative flex items-start gap-2">
                            <div
                              className={`
                                w-1.5 h-1.5 rounded-full mt-[5px] shrink-0
                                ${isCompleted
                                  ? 'bg-success shadow-[0_0_6px_rgba(var(--success)/0.55)]'
                                  : isInProgress
                                    ? 'bg-accent shadow-[0_0_6px_rgba(var(--accent)/0.55)] animate-pulse'
                                    : 'bg-muted/20'
                                }
                              `}
                            />
                            <div>
                              <span className={`text-xs font-medium leading-tight line-clamp-2 ${
                                isCompleted
                                  ? 'text-foreground'
                                  : isInProgress
                                    ? 'text-foreground'
                                    : 'text-foreground/55'
                              }`}>
                                {concept.title}
                              </span>
                              <span className={`
                                block text-[10px] mt-0.5 transition-opacity duration-150 text-muted/60
                                ${isHovered ? 'opacity-100' : 'opacity-0'}
                              `}>
                                {concept.estimatedMinutes} min
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: inset 0 0 10px rgba(var(--accent) / 0.15);
          }
          50% {
            box-shadow: inset 0 0 14px rgba(var(--accent) / 0.25);
          }
        }
        .in-progress-glow {
          animation: glow-pulse 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
