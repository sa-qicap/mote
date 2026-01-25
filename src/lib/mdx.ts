import { serialize } from "next-mdx-remote/serialize";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// Escape curly braces in plain text (not in math or JSX) to prevent MDX from interpreting them
function escapeCurlyBraces(content: string): string {
  // Split by math delimiters to preserve math expressions
  const parts: string[] = [];
  let remaining = content;

  // Match $$ ... $$ (block math) and $ ... $ (inline math)
  const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = mathRegex.exec(content)) !== null) {
    // Text before math - escape curly braces
    const textBefore = content.slice(lastIndex, match.index);
    parts.push(textBefore.replace(/\{/g, '\\{').replace(/\}/g, '\\}'));
    // Math content - keep as is
    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last math
  const textAfter = content.slice(lastIndex);
  parts.push(textAfter.replace(/\{/g, '\\{').replace(/\}/g, '\\}'));

  return parts.join('');
}

export async function serializeMDX(content: string) {
  const escapedContent = escapeCurlyBraces(content);

  return serialize(escapedContent, {
    mdxOptions: {
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    },
  });
}
