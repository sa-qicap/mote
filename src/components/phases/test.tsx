"use client";

import { useState } from "react";

interface Question {
  id: string;
  type: "mcq" | "short" | "reflection";
  text: string;
  options: string[];
  correctAnswer: string;
}

interface Concept {
  id: string;
  title: string;
  questions: Question[];
}

interface Answer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

interface TestPhaseProps {
  concept: Concept;
  onComplete: (answers: Answer[]) => void;
  onRequestHint: () => void;
}

export function TestPhase({ concept, onComplete, onRequestHint }: TestPhaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);

  const question = concept.questions?.[currentIndex];
  const isLastQuestion = currentIndex === concept.questions.length - 1;

  // Placeholder when no questions exist
  if (!concept.questions || concept.questions.length === 0) {
    return (
      <div className="content-container py-12">
        <div className="text-center">
          <p className="text-xl text-muted mb-4">No questions available yet</p>
          <p className="text-sm text-muted">Questions for this concept are coming soon.</p>
        </div>
      </div>
    );
  }

  function handleSubmitAnswer() {
    const answer = question.type === "mcq" ? selectedOption : textAnswer;
    if (!answer) return;

    const isCorrect =
      question.type === "mcq"
        ? answer === question.correctAnswer
        : true; // For short/reflection, mark as correct (manual review would be ideal)

    const newAnswer: Answer = {
      questionId: question.id,
      answer,
      isCorrect,
    };

    setAnswers([...answers, newAnswer]);
    setShowResult(true);
  }

  function handleNext() {
    if (isLastQuestion) {
      onComplete([...answers]);
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setTextAnswer("");
      setShowResult(false);
    }
  }

  return (
    <div className="content-container py-12">
      <div className="flex justify-between items-center mb-12">
        <div />
        <span className="text-sm text-muted">
          {currentIndex + 1}/{concept.questions.length}
        </span>
      </div>

      <div className="text-center mb-12">
        <p className="text-xl mb-8">{question.text}</p>

        {question.type === "mcq" && (
          <div className="space-y-3 max-w-md mx-auto text-left">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => !showResult && setSelectedOption(option)}
                disabled={showResult}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  showResult
                    ? option === question.correctAnswer
                      ? "border-success bg-success/10"
                      : option === selectedOption
                      ? "border-error bg-error/10"
                      : "border-foreground/10"
                    : selectedOption === option
                    ? "border-accent bg-accent/10"
                    : "border-foreground/10 hover:border-foreground/30"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {(question.type === "short" || question.type === "reflection") && (
          <div className="max-w-md mx-auto">
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={showResult}
              placeholder={
                question.type === "reflection"
                  ? "Share your thoughts..."
                  : "Type your answer..."
              }
              className="w-full p-4 bg-transparent border border-foreground/20 rounded-lg focus:border-foreground/40 focus:outline-none transition-colors resize-none h-32"
            />
            {showResult && (
              <div className="mt-4 p-4 bg-foreground/5 rounded-lg text-left">
                <p className="text-sm text-muted mb-1">Key points:</p>
                <p className="text-sm">{question.correctAnswer}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4">
        {!showResult ? (
          <>
            <button
              onClick={onRequestHint}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              💬 hint
            </button>
            <button
              onClick={handleSubmitAnswer}
              disabled={
                (question.type === "mcq" && !selectedOption) ||
                (question.type !== "mcq" && !textAnswer.trim())
              }
              className="btn btn-primary disabled:opacity-50"
            >
              Submit
            </button>
          </>
        ) : (
          <button onClick={handleNext} className="btn btn-primary">
            {isLastQuestion ? "See Results" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}
