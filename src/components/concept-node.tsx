"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";

interface ConceptNodeData {
  title: string;
  pageRef: string | null;
  status: string;
}

function ConceptNode({ data }: { data: ConceptNodeData }) {
  console.log("ConceptNode data:", data);
  const getStatusStyles = () => {
    switch (data.status) {
      case "completed":
        return {
          background: "#dcfce7",
          borderColor: "#22c55e",
          color: "#166534",
        };
      case "primed":
      case "learning":
      case "testing":
        return {
          background: "#fef3c7",
          borderColor: "#eab308",
          color: "#854d0e",
        };
      default:
        return {
          background: "#ffffff",
          borderColor: "#e5e7eb",
          color: "#1a1a1a",
        };
    }
  };

  const statusStyles = getStatusStyles();

  return (
    <div
      style={{
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: 500,
        border: "1px solid",
        cursor: "pointer",
        minWidth: "180px",
        textAlign: "left",
        ...statusStyles,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div>{data.title}</div>
      <div
        style={{
          fontSize: "10px",
          opacity: 0.5,
          marginTop: "4px",
          fontFamily: "monospace",
        }}
      >
        {data.pageRef || "no page"}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

export default memo(ConceptNode);
