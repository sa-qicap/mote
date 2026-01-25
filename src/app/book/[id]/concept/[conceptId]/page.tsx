"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PrimePhase } from "@/components/phases/prime";
import { LearnPhase } from "@/components/phases/learn";
import { TestPhase } from "@/components/phases/test";
import { ReflectPhase } from "@/components/phases/reflect";
import { ThemeToggle } from "@/components/theme-toggle";

type Phase = "prime" | "learn" | "test" | "reflect";

interface Question {
  id: string;
  type: "mcq" | "short" | "reflection";
  text: string;
  options: string[];
  correctAnswer: string;
}

interface ConceptImage {
  url: string;
  caption?: string;
  afterParagraph?: number;
}

interface ConceptData {
  id: string;
  title: string;
  summary: string;
  content: string;
  images: ConceptImage[];
  estimatedMinutes: number;
  startPage: number | null;
  endPage: number | null;
  branchTitle: string;
  pdfUrl: string;
  pageOffset: number;
  questions: Question[];
  status: string;
  questionAnswers: { questionId: string; answer: string; isCorrect: boolean }[];
  prevConceptId: string | null;
  nextConceptId: string | null;
}

export default function ConceptPage() {
  const params = useParams();
  const router = useRouter();
  const [concept, setConcept] = useState<ConceptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("prime");

  useEffect(() => {
    fetchConcept();
  }, [params.conceptId]);

  // Keyboard navigation between phases with arrow keys
  useEffect(() => {
    const phases: Phase[] = ["prime", "learn", "test", "reflect"];

    function handleKeyDown(e: KeyboardEvent) {
      // Don't navigate if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentIndex = phases.indexOf(phase);

      if (e.key === "ArrowLeft" && currentIndex > 0) {
        setPhase(phases[currentIndex - 1]);
      } else if (e.key === "ArrowRight" && currentIndex < phases.length - 1) {
        const nextPhase = phases[currentIndex + 1];
        setPhase(nextPhase);
        // Update progress when moving forward
        if (nextPhase === "learn") updateProgress("learning");
        else if (nextPhase === "test") updateProgress("testing");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase]);

  async function fetchConcept() {
    try {
      const res = await fetch(
        `/api/books/${params.id}/concepts/${params.conceptId}`
      );
      if (res.ok) {
        const data = await res.json();
        setConcept(data);
        // Always start at prime phase
        setPhase("prime");
      }
    } catch (error) {
      console.error("Failed to fetch concept:", error);
    } finally {
      setLoading(false);
    }
  }

  function getPhaseFromStatus(status: string): Phase {
    switch (status) {
      case "completed":
        return "reflect";
      case "testing":
        return "test";
      case "learning":
        return "learn";
      case "primed":
        return "learn";
      default:
        return "prime";
    }
  }

  async function updateProgress(newStatus: string) {
    try {
      await fetch(`/api/books/${params.id}/concepts/${params.conceptId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  }

  function handlePhaseContinue() {
    switch (phase) {
      case "prime":
        setPhase("learn");
        updateProgress("learning");
        break;
      case "learn":
        setPhase("test");
        updateProgress("testing");
        break;
      case "test":
        // Test phase handles its own completion
        break;
      case "reflect":
        // Go to next concept
        handleNextConcept();
        break;
    }
  }

  function handleTestComplete(answers: { questionId: string; answer: string; isCorrect: boolean }[]) {
    updateProgress("completed");
    setPhase("reflect");
    if (concept) {
      setConcept({ ...concept, questionAnswers: answers, status: "completed" });
    }
  }

  async function handleNextConcept() {
    try {
      const res = await fetch(`/api/books/${params.id}/next-concept`);
      if (res.ok) {
        const data = await res.json();
        if (data.conceptId) {
          router.push(`/book/${params.id}/concept/${data.conceptId}`);
        } else {
          // Book complete
          router.push(`/book/${params.id}`);
        }
      }
    } catch (error) {
      router.push(`/book/${params.id}`);
    }
  }

  function handleBack() {
    router.push(`/book/${params.id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Concept not found</div>
      </div>
    );
  }

  const phaseIndex = ["prime", "learn", "test", "reflect"].indexOf(phase);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={handleBack}
          className="text-muted hover:text-foreground transition-colors"
        >
          ←
        </button>

        {/* Phase dots */}
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`phase-dot ${
                i < phaseIndex
                  ? "phase-dot-completed"
                  : i === phaseIndex
                  ? "phase-dot-current"
                  : "phase-dot-pending"
              }`}
            />
          ))}
        </div>

        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="flex-1">
        {phase === "prime" && (
          <PrimePhase concept={concept} status={concept.status} />
        )}
        {phase === "learn" && (
          <LearnPhase concept={concept} />
        )}
        {phase === "test" && (
          <TestPhase
            concept={concept}
            onComplete={handleTestComplete}
          />
        )}
        {phase === "reflect" && (
          <ReflectPhase concept={concept} onDone={handleBack} />
        )}
      </div>
    </div>
  );
}
