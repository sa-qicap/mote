"use client";

interface Concept {
  id: string;
  title: string;
  summary: string;
  branchTitle: string;
  estimatedMinutes: number;
  startPage?: number | null;
  endPage?: number | null;
}

interface PrimePhaseProps {
  concept: Concept;
}

export function PrimePhase({ concept }: PrimePhaseProps) {
  const pageRef = concept.startPage
    ? concept.endPage && concept.endPage !== concept.startPage
      ? `pp. ${concept.startPage}–${concept.endPage}`
      : `p. ${concept.startPage}`
    : null;

  return (
    <div className="content-container py-12">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{concept.branchTitle}</p>
        {pageRef && (
          <p className="text-sm text-muted font-mono">{pageRef}</p>
        )}
      </div>

      <h1 className="font-display text-2xl mb-2">{concept.title}</h1>

      <p className="text-sm text-muted mb-8">
        ~{concept.estimatedMinutes} min · Prime
      </p>

      <div className="prose prose-lg">
        <div
          className="text-lg leading-relaxed"
          dangerouslySetInnerHTML={{ __html: concept.summary }}
        />
      </div>
    </div>
  );
}
