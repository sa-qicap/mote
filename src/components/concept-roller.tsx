"use client";

import { useRef, memo } from "react";
import { Handle, Position } from "reactflow";

interface Concept {
  id: string;
  title: string;
  pageRef: string | null;
  status: "not_started" | "primed" | "learning" | "testing" | "completed";
}

interface ConceptRollerData {
  concepts: Concept[];
  branchTitle: string;
  onConceptClick: (conceptId: string) => void;
}

function ConceptRollerComponent({ data }: { data: ConceptRollerData }) {
  const { concepts, onConceptClick } = data;
  const containerRef = useRef<HTMLDivElement>(null);

  // Get status color
  const getStatusColor = (status: Concept["status"]) => {
    switch (status) {
      case "completed":
        return { bg: "#dcfce7", border: "#22c55e", text: "#166534" };
      case "primed":
      case "learning":
      case "testing":
        return { bg: "#fef3c7", border: "#eab308", text: "#854d0e" };
      default:
        return { bg: "#ffffff", border: "#e5e7eb", text: "#374151" };
    }
  };

  return (
    <div className="relative flex items-center">
      <Handle type="target" position={Position.Left} className="opacity-0" />

      {/* Horizontal concept list */}
      <div
        ref={containerRef}
        className="flex items-center gap-2"
      >
        {concepts.map((concept, index) => {
          const colors = getStatusColor(concept.status);

          return (
            <div
              key={concept.id}
              className="cursor-pointer transition-all duration-150 hover:scale-105"
              onClick={() => onConceptClick(concept.id)}
            >
              <div
                className="px-3 py-2 rounded-lg border whitespace-nowrap"
                style={{
                  background: colors.bg,
                  borderColor: colors.border,
                  minWidth: 120,
                  maxWidth: 180,
                }}
              >
                <div
                  className="text-xs font-medium truncate"
                  style={{ color: colors.text }}
                >
                  {concept.title}
                </div>
                {concept.pageRef && (
                  <div
                    className="text-[10px] font-mono truncate opacity-70"
                    style={{ color: colors.text }}
                  >
                    {concept.pageRef}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}

export const ConceptRoller = memo(ConceptRollerComponent);
