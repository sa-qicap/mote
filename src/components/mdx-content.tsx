"use client";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { InlineMath, BlockMath } from "react-katex";
import Image from "next/image";

interface ImageProps {
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

function MDXImage({ src, alt, caption, width = 600, height = 400 }: ImageProps) {
  return (
    <figure className="my-8 not-prose">
      <div className="relative w-full overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
        <Image
          src={src}
          alt={alt || caption || ""}
          width={width}
          height={height}
          className="w-full h-auto"
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-gray-500 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function Callout({ children, type = "info" }: { children: React.ReactNode; type?: "info" | "warning" | "tip" }) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    tip: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };

  const labels = {
    info: "Note",
    warning: "Warning",
    tip: "Tip",
  };

  return (
    <div className={`my-6 p-4 rounded-lg border-l-4 ${styles[type]} not-prose`}>
      <div className="font-medium text-sm mb-1">{labels[type]}</div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function Definition({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="my-4 not-prose">
      <dt className="font-semibold text-gray-900">{term}</dt>
      <dd className="mt-1 text-gray-600 pl-4 border-l-2 border-gray-200">{children}</dd>
    </div>
  );
}

// Custom components for MDX
const components = {
  // Math components
  Math: ({ children }: { children: string }) => (
    <div className="my-6 overflow-x-auto">
      <BlockMath math={children} />
    </div>
  ),
  InlineMath: ({ children }: { children: string }) => <InlineMath math={children} />,

  // Image with caption
  Figure: MDXImage,

  // Callout boxes
  Callout,

  // Definition terms
  Definition,

  // Override default elements with better styling
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="font-display text-2xl font-normal text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200">
      {children}
    </h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="font-display text-xl font-normal text-gray-900 mt-8 mb-3">
      {children}
    </h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="font-display text-lg font-medium text-gray-800 mt-6 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="my-4 text-gray-700 leading-7">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="my-4 ml-4 space-y-2 text-gray-700">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="my-4 ml-4 space-y-2 text-gray-700 list-decimal">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="leading-7 pl-2">{children}</li>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="my-6 pl-4 border-l-4 border-gray-300 text-gray-600 italic">
      {children}
    </blockquote>
  ),
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono">
      {children}
    </code>
  ),
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="my-6 p-4 bg-gray-50 border border-gray-200 rounded-lg overflow-x-auto text-sm">
      {children}
    </pre>
  ),
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="my-6 overflow-x-auto">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-gray-50 border-b border-gray-200">{children}</thead>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left font-medium text-gray-900">{children}</th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{children}</td>
  ),
  hr: () => <hr className="my-8 border-gray-200" />,
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-gray-800">{children}</em>
  ),
};

interface MDXContentProps {
  source: MDXRemoteSerializeResult;
}

export function MDXContent({ source }: MDXContentProps) {
  return (
    <article className="prose prose-gray prose-lg max-w-none">
      <MDXRemote {...source} components={components} />
    </article>
  );
}
