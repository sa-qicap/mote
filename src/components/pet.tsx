"use client";

type PetState = "neutral" | "curious" | "thinking" | "celebrating";

interface PetProps {
  state: PetState;
}

export function Pet({ state }: PetProps) {
  const emoji = getEmoji(state);
  const message = getMessage(state);

  return (
    <div className="fixed bottom-6 right-6 text-center">
      <div className="text-2xl mb-1">
        {emoji}
        {state === "celebrating" && <span className="ml-1">!</span>}
      </div>
      {message && (
        <p className="text-xs text-muted max-w-[120px]">{message}</p>
      )}
    </div>
  );
}

function getEmoji(state: PetState): string {
  // Using simple cat emoji for now
  // Could be replaced with custom illustrations
  return "🐱";
}

function getMessage(state: PetState): string | null {
  switch (state) {
    case "curious":
      return "Reading along...";
    case "thinking":
      return "Hmm...";
    case "celebrating":
      return "Nice work!";
    default:
      return null;
  }
}
