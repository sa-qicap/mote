"use client";

interface Concept {
  id: string;
  title: string;
  branchTitle: string;
  content: string;
}

interface LearnPhaseProps {
  concept: Concept;
}

export function LearnPhase({ concept }: LearnPhaseProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="mb-2">
          <p className="text-sm text-muted">{concept.branchTitle}</p>
        </div>
        <h1 className="font-display text-xl">{concept.title}</h1>
      </div>

      {/* Content */}
      <div id="preview" className="flex-1 overflow-y-auto bg-white">
        <div id="preview-content" className="max-w-3xl mx-auto px-8 py-10" dangerouslySetInnerHTML={{ __html: concept.content }} />
      </div>
    </div>
  );
}
