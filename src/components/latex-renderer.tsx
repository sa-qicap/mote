"use client";

import { useEffect, useRef, useState } from "react";

interface LaTeXRendererProps {
  content: string;
}

export function LaTeXRenderer({ content }: LaTeXRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string>("");
  const [css, setCss] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function renderLatex() {
      try {
        // Dynamic import to avoid SSR issues
        const { parse, HtmlGenerator } = await import("latex.js");

        // Wrap content in a minimal LaTeX document if not already
        let latexContent = content;
        if (!content.includes("\\begin{document}")) {
          latexContent = `
\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{multirow}
\\usepackage{graphicx}
\\begin{document}
${content}
\\end{document}
          `;
        }

        const generator = new HtmlGenerator({ hyphenate: false });
        const doc = parse(latexContent, { generator });

        // Get the full HTML document
        const htmlDoc = doc.htmlDocument();

        // Extract CSS from style tags in head
        const styleElements = htmlDoc.head.querySelectorAll("style");
        let styles = "";
        styleElements.forEach((style: Element) => {
          styles += style.innerHTML + "\n";
        });
        setCss(styles);

        // Get the HTML output
        const htmlOutput = htmlDoc.body.innerHTML;
        setHtml(htmlOutput);
        setError(null);
      } catch (err) {
        console.error("LaTeX rendering error:", err);
        setError(err instanceof Error ? err.message : "Failed to render LaTeX");
        // Fallback: show raw content
        setHtml(`<pre style="white-space: pre-wrap;">${content}</pre>`);
      }
    }

    renderLatex();
  }, [content]);

  if (error) {
    return (
      <div>
        <div className="text-amber-600 text-sm mb-4">
          Note: Some LaTeX could not be rendered. Showing best effort.
        </div>
        {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
        <div
          ref={containerRef}
          className="latex-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }

  return (
    <div>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      <div
        ref={containerRef}
        className="latex-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
