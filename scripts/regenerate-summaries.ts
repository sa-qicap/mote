#!/usr/bin/env npx tsx
/**
 * Regenerate summaries using Feynman-style teaching.
 *
 * Usage:
 *   npx tsx scripts/regenerate-summaries.ts [book-pattern] [--dry-run]
 *
 * Examples:
 *   npx tsx scripts/regenerate-summaries.ts "Statistical" --dry-run
 *   npx tsx scripts/regenerate-summaries.ts  # All books
 */

import { readFileSync, existsSync } from "fs";
import { PrismaClient, Concept, Book, Branch } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

// Load .env file manually
const envPath = ".env";
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, "");
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}
import { execSync } from "child_process";
import path from "path";

const prisma = new PrismaClient();
const anthropic = new Anthropic();

// Word count validation
const MIN_WORDS = 400;
const MAX_WORDS = 800;
const TARGET_WORDS = 550;

interface ConceptWithRelations extends Concept {
  branch: Branch;
}

/**
 * Strip HTML tags from content to get plain text.
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract text from PDF for a page range using Python script.
 */
function extractPdfText(
  pdfPath: string,
  startPage: number,
  endPage: number
): string {
  const scriptPath = path.join(__dirname, "lib", "pdf-extractor.py");
  const fullPdfPath = path.join(process.cwd(), "public", pdfPath);
  const venvPython = path.join(process.cwd(), ".venv", "bin", "python3");

  try {
    const result = execSync(
      `"${venvPython}" "${scriptPath}" "${fullPdfPath}" --extract ${startPage} ${endPage}`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );

    const parsed = JSON.parse(result);
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    return parsed.text;
  } catch (error) {
    throw new Error(
      `Failed to extract PDF text: ${error instanceof Error ? error.message : error}`
    );
  }
}

/**
 * Get concept content from HTML or PDF.
 */
async function getConceptContent(concept: ConceptWithRelations): Promise<{
  text: string;
  source: string;
}> {
  // If HTML content exists, use it
  if (concept.content && concept.content.trim()) {
    const text = stripHtmlTags(concept.content);
    return { text, source: `HTML content (${text.length.toLocaleString()} chars)` };
  }

  // Otherwise extract from PDF
  if (concept.pdfPath && concept.startPage && concept.endPage) {
    const text = extractPdfText(
      concept.pdfPath,
      concept.startPage,
      concept.endPage
    );
    return {
      text,
      source: `PDF pages ${concept.startPage}-${concept.endPage} (${text.length.toLocaleString()} chars)`,
    };
  }

  throw new Error(`No content source for concept: ${concept.title}`);
}

/**
 * Count words in text.
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Validate summary meets requirements.
 */
function validateSummary(summary: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const wordCount = countWords(summary);

  if (wordCount < MIN_WORDS) {
    issues.push(`Too short: ${wordCount} words (min: ${MIN_WORDS})`);
  }
  if (wordCount > MAX_WORDS) {
    issues.push(`Too long: ${wordCount} words (max: ${MAX_WORDS})`);
  }

  // Check for bullet points
  if (/^[-*•]\s/m.test(summary)) {
    issues.push("Contains bullet points");
  }

  // Check for numbered lists
  if (/^\d+\.\s/m.test(summary)) {
    issues.push("Contains numbered lists");
  }

  // Check for headers
  if (/^#{1,6}\s/m.test(summary)) {
    issues.push("Contains markdown headers");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Generate a Feynman-style summary using Claude.
 */
async function generateSummary(
  concept: ConceptWithRelations,
  book: Book,
  contentText: string
): Promise<string> {
  // Truncate content to stay within context limits
  const maxContentLength = 50000;
  const truncatedContent =
    contentText.length > maxContentLength
      ? contentText.slice(0, maxContentLength) + "\n\n[Content truncated...]"
      : contentText;

  const prompt = `You are a master teacher who explains complex topics like Richard Feynman - building deep intuition before introducing formulas.

Write a ${TARGET_WORDS}-word summary for this learning concept. The summary should be a SINGLE FLOWING PARAGRAPH.

Book: "${book.title}" by ${book.author || "Unknown"}
Chapter: "${concept.branch.title}"
Concept: "${concept.title}"

Source Content:
"""
${truncatedContent}
"""

Writing Guidelines:
1. START with why this matters - what problem does it solve?
2. BUILD INTUITION using an analogy, example, or mental model
3. EXPLAIN the core idea in plain English first
4. ONLY THEN introduce mathematical notation (use $...$ for LaTeX)
5. END with what this enables or connects to

Style:
- Conversational but precise
- No bullet points or headers - one flowing paragraph
- Assume the reader is intelligent but unfamiliar with this specific topic
- Bold key terms using **term** syntax
- Match terminology from the source content

Target: ${TARGET_WORDS} words (must be between ${MIN_WORDS}-${MAX_WORDS})

Write ONLY the summary paragraph, no preamble or explanation.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  if (response.content[0].type !== "text") {
    throw new Error("No text response from Claude");
  }

  return response.content[0].text.trim();
}

/**
 * Main entry point.
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const bookPattern = args.find((arg) => !arg.startsWith("--"));

  console.log("=== SUMMARY REGENERATION ===");
  console.log(`Mode: ${dryRun ? "DRY RUN (preview only)" : "LIVE (updating database)"}`);
  if (bookPattern) {
    console.log(`Book filter: "${bookPattern}"`);
  }
  console.log();

  // Find books matching pattern
  const books = await prisma.book.findMany({
    where: bookPattern
      ? { title: { contains: bookPattern } }
      : undefined,
  });

  if (books.length === 0) {
    console.error("No books found matching pattern");
    process.exit(1);
  }

  console.log(`Found ${books.length} book(s):`);
  books.forEach((b) => console.log(`  - ${b.title}`));
  console.log();

  // Process each book
  let totalProcessed = 0;
  let totalSuccess = 0;
  let wordCounts: number[] = [];

  for (const book of books) {
    console.log(`\nBook: ${book.title}`);
    console.log("-".repeat(50));

    const concepts = await prisma.concept.findMany({
      where: { bookId: book.id },
      include: { branch: true },
      orderBy: [{ branch: { chapterNumber: "asc" } }, { orderInBranch: "asc" }],
    });

    console.log(`Processing ${concepts.length} concepts...\n`);

    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i];
      totalProcessed++;

      process.stdout.write(
        `[${i + 1}/${concepts.length}] ${concept.title.slice(0, 50)}...`
      );

      try {
        // Get source content
        const { text: contentText, source } = await getConceptContent(concept);
        console.log(`\n  Source: ${source}`);

        // Generate summary
        const summary = await generateSummary(concept, book, contentText);
        const wordCount = countWords(summary);
        wordCounts.push(wordCount);

        // Validate
        const validation = validateSummary(summary);
        if (!validation.valid) {
          console.log(`  Warning: ${validation.issues.join(", ")}`);
        }

        console.log(`  Generated: ${wordCount} words ${validation.valid ? "✓" : "⚠"}`);

        // Preview in dry-run
        if (dryRun) {
          console.log(`  Preview: ${summary.slice(0, 200)}...`);
        } else {
          // Update database
          await prisma.concept.update({
            where: { id: concept.id },
            data: { summary },
          });
          console.log("  Saved to database ✓");
        }

        totalSuccess++;

        // Rate limiting delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(
          `\n  ✗ Failed: ${error instanceof Error ? error.message : error}`
        );
      }

      console.log();
    }
  }

  // Final summary
  console.log("\n=== COMPLETE ===");
  console.log(`${totalSuccess}/${totalProcessed} summaries generated`);

  if (wordCounts.length > 0) {
    const minWc = Math.min(...wordCounts);
    const maxWc = Math.max(...wordCounts);
    const inRange = wordCounts.every((wc) => wc >= MIN_WORDS && wc <= MAX_WORDS);
    console.log(
      `Word count range: ${minWc}-${maxWc} (target: ${MIN_WORDS}-${MAX_WORDS}) ${inRange ? "✓" : "⚠"}`
    );
  }

  if (dryRun) {
    console.log("\nRun without --dry-run to save to database");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
