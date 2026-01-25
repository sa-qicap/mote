"use client";

import { useState } from "react";

interface HighlightPopupProps {
  position: { x: number; y: number };
  onSave: (color: string, note: string) => void;
  onCancel: () => void;
}

const COLORS = [
  { name: "yellow", bg: "bg-yellow-200", border: "border-yellow-400" },
  { name: "green", bg: "bg-green-200", border: "border-green-400" },
  { name: "red", bg: "bg-red-200", border: "border-red-400" },
];

export function HighlightPopup({ position, onSave, onCancel }: HighlightPopupProps) {
  const [selectedColor, setSelectedColor] = useState("yellow");
  const [note, setNote] = useState("");

  function handleSave() {
    onSave(selectedColor, note);
  }

  return (
    <div
      data-highlight-popup
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg p-3 w-64"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Color selection */}
      <div className="flex gap-2 mb-3">
        {COLORS.map((color) => (
          <button
            key={color.name}
            onClick={() => setSelectedColor(color.name)}
            className={`w-8 h-8 rounded-full ${color.bg} border-2 ${
              selectedColor === color.name ? color.border : "border-transparent"
            } transition-all`}
          />
        ))}
      </div>

      {/* Note input */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        className="w-full p-2 text-sm bg-transparent border border-border rounded resize-none h-16 focus:outline-none focus:border-foreground/40"
      />

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm text-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-foreground text-background rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
}
