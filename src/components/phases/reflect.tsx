"use client";

interface Answer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  correctAnswer: string;
}

interface Concept {
  id: string;
  title: string;
  questions: Question[];
  questionAnswers: Answer[];
}

interface ReflectPhaseProps {
  concept: Concept;
  onDone: () => void;
}

export function ReflectPhase({ concept, onDone }: ReflectPhaseProps) {
  const correctCount = concept.questionAnswers.filter((a) => a.isCorrect).length;
  const totalCount = concept.questions.length;

  const answerMap = new Map(
    concept.questionAnswers.map((a) => [a.questionId, a])
  );

  return (
    <div className="content-container py-12 text-center">
      <div className="text-4xl mb-4">✓</div>

      <h1 className="font-display text-2xl mb-4">{concept.title}</h1>

      <p className="text-3xl font-light mb-8">
        {correctCount}/{totalCount}
      </p>

      {/* Result dots */}
      <div className="flex justify-center gap-2 mb-8">
        {concept.questions.map((q) => {
          const answer = answerMap.get(q.id);
          return (
            <div
              key={q.id}
              className={`w-3 h-3 rounded-full ${
                answer?.isCorrect ? "bg-success" : "bg-error"
              }`}
              title={answer?.isCorrect ? "Correct" : "Incorrect"}
            />
          );
        })}
      </div>

      {/* Review wrong answers */}
      {concept.questionAnswers.some((a) => !a.isCorrect) && (
        <div className="text-left max-w-md mx-auto mb-8">
          <p className="text-sm text-muted mb-4">Review:</p>
          {concept.questions.map((q) => {
            const answer = answerMap.get(q.id);
            if (answer?.isCorrect) return null;
            return (
              <div
                key={q.id}
                className="p-4 bg-error/5 border border-error/20 rounded-lg mb-3"
              >
                <p className="text-sm mb-2">{q.text}</p>
                <p className="text-sm text-muted">
                  Your answer: {answer?.answer}
                </p>
                <p className="text-sm text-success">
                  Correct: {q.correctAnswer}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center">
        <button onClick={onDone} className="btn btn-primary">
          Done
        </button>
      </div>
    </div>
  );
}
