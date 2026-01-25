"use client";

import React from "react";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

// Renders text with LaTeX $...$ notation using KaTeX
function renderWithLatex(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match $...$ for inline math (non-greedy, handles escaped dollars)
  const regex = /\$([^$]+)\$/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the math
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add the math component
    try {
      parts.push(<InlineMath key={match.index} math={match[1]} />);
    } catch {
      // If KaTeX fails to parse, show original text
      parts.push(`$${match[1]}$`);
    }
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

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
  status: string;
}

function getProgressPercent(status: string): number {
  switch (status) {
    case "completed":
      return 100;
    case "testing":
      return 75;
    case "learning":
      return 50;
    case "primed":
      return 25;
    default:
      return 0;
  }
}

function getProgressLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "testing":
      return "Testing";
    case "learning":
      return "Learning";
    case "primed":
      return "Primed";
    default:
      return "Not started";
  }
}

export function PrimePhase({ concept, status }: PrimePhaseProps) {
  const pageRef = concept.startPage
    ? concept.endPage && concept.endPage !== concept.startPage
      ? `pp. ${concept.startPage}–${concept.endPage}`
      : `p. ${concept.startPage}`
    : null;

  const progressPercent = getProgressPercent(status);
  const progressLabel = getProgressLabel(status);

  return (
    <div className="content-container py-12">
      {/* Progress bar - subtle, at the top */}
      <div className="mb-8 pb-6 border-b border-border/50">
        <div className="flex items-center justify-between text-xs text-muted mb-2">
          <span>Progress</span>
          <span>{progressLabel}</span>
        </div>
        <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent/60 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

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
        <div className="text-lg leading-relaxed">
          {renderWithLatex(concept.summary)}
        </div>
      </div>
    </div>
  );
}
