import { PrismaClient } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";

const prisma = new PrismaClient();
const anthropic = new Anthropic();

// Configuration
const TARGET_MIN_MINUTES = 15;
const TARGET_MAX_MINUTES = 22;
const ABSOLUTE_MAX_MINUTES = 25;
const WORDS_PER_MINUTE = 200;

interface Section {
  title: string;
  content: string;
  wordCount: number;
  formulaCount: number;
  estimatedMinutes: number;
}

interface ProposedConcept {
  title: string;
  sections: Section[];
  totalWords: number;
  estimatedMinutes: number;
  needsSplit: boolean;
}

interface Chapter {
  number: number;
  title: string;
  sections: Section[];
}

// Parse MMD file into chapters and sections
function parseMMD(mmdPath: string): Chapter[] {
  const mmd = fs.readFileSync(mmdPath, "utf-8");

  // Find all section markers
  const sectionPattern = /\\section\*\{([^}]+)\}/g;
  const matches: { title: string; index: number }[] = [];
  let match;

  while ((match = sectionPattern.exec(mmd)) !== null) {
    matches.push({ title: match[1], index: match.index });
  }

  // Extract section content
  const allSections: Section[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : mmd.length;
    const content = mmd.substring(start, end);

    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const formulaCount = (content.match(/\$[^$]+\$/g) || []).length;
    const baseTime = wordCount / WORDS_PER_MINUTE;
    const formulaTime = formulaCount * 0.025; // ~1.5 sec per formula

    allSections.push({
      title: matches[i].title,
      content,
      wordCount,
      formulaCount,
      estimatedMinutes: Math.round(baseTime + formulaTime + 5), // +5 for questions
    });
  }

  // Group into chapters (chapters marked by "* N *" pattern)
  const chapters: Chapter[] = [];
  let currentChapter: Chapter | null = null;

  const chapterTitles: Record<number, string> = {
    1: "The Language of Options",
    2: "Elementary Strategies",
    3: "Introduction to Theoretical Pricing Models",
    4: "Volatility",
    5: "Using an Option's Theoretical Value",
    6: "Option Values and Changing Market Conditions",
  };

  for (const section of allSections) {
    // Check if this is a chapter marker
    const chapterMatch = section.title.match(/^\*\s*(\d+)\s*\*?$/);
    if (chapterMatch) {
      const num = parseInt(chapterMatch[1]);
      if (num <= 6) { // Only first 6 chapters
        currentChapter = {
          number: num,
          title: chapterTitles[num] || `Chapter ${num}`,
          sections: [],
        };
        chapters.push(currentChapter);
      } else {
        currentChapter = null; // Stop after chapter 6
      }
      continue;
    }

    // Skip front matter, TOC, prefaces
    if (!currentChapter) continue;
    if (section.title.includes("Table of Contents")) continue;
    if (section.title.includes("Preface")) continue;
    if (section.wordCount < 50) continue; // Skip very short sections

    currentChapter.sections.push(section);
  }

  return chapters;
}

// Group sections into concepts targeting 15-20 minutes
function groupIntoConcepts(chapter: Chapter): ProposedConcept[] {
  const concepts: ProposedConcept[] = [];
  let current: ProposedConcept = {
    title: "",
    sections: [],
    totalWords: 0,
    estimatedMinutes: 0,
    needsSplit: false,
  };

  for (const section of chapter.sections) {
    const sectionTime = section.wordCount / WORDS_PER_MINUTE;

    // If this single section is already too long, it needs splitting
    if (sectionTime > ABSOLUTE_MAX_MINUTES) {
      // Save current if it has content
      if (current.sections.length > 0) {
        current.title = generateConceptTitle(current.sections);
        concepts.push(current);
      }

      // Add oversized section as its own concept (will be split by LLM)
      concepts.push({
        title: section.title,
        sections: [section],
        totalWords: section.wordCount,
        estimatedMinutes: section.estimatedMinutes,
        needsSplit: true,
      });

      current = { title: "", sections: [], totalWords: 0, estimatedMinutes: 0, needsSplit: false };
      continue;
    }

    // If adding this section keeps us under max, add it
    const newTime = (current.totalWords + section.wordCount) / WORDS_PER_MINUTE + 5;
    if (newTime <= ABSOLUTE_MAX_MINUTES) {
      current.sections.push(section);
      current.totalWords += section.wordCount;
      current.estimatedMinutes = Math.round(newTime);
    } else {
      // Save current concept and start new one
      if (current.sections.length > 0) {
        current.title = generateConceptTitle(current.sections);
        concepts.push(current);
      }
      current = {
        title: "",
        sections: [section],
        totalWords: section.wordCount,
        estimatedMinutes: section.estimatedMinutes,
        needsSplit: false,
      };
    }

    // If we've hit target range, close this concept
    if (current.estimatedMinutes >= TARGET_MIN_MINUTES && current.estimatedMinutes <= TARGET_MAX_MINUTES) {
      current.title = generateConceptTitle(current.sections);
      concepts.push(current);
      current = { title: "", sections: [], totalWords: 0, estimatedMinutes: 0, needsSplit: false };
    }
  }

  // Don't forget last concept
  if (current.sections.length > 0) {
    current.title = generateConceptTitle(current.sections);
    concepts.push(current);
  }

  return concepts;
}

function generateConceptTitle(sections: Section[]): string {
  if (sections.length === 1) {
    return cleanTitle(sections[0].title);
  }
  // Use first meaningful section title
  const mainSection = sections.find(s => !s.title.match(/^\*|^Figure|^Table/));
  return mainSection ? cleanTitle(mainSection.title) : cleanTitle(sections[0].title);
}

function cleanTitle(title: string): string {
  return title
    .replace(/\\\\/g, " ")
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
    .replace(/[{}\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Use Claude to split oversized sections
async function splitOversizedConcept(concept: ProposedConcept): Promise<ProposedConcept[]> {
  const content = concept.sections.map(s => s.content).join("\n\n");
  const estimatedTime = concept.estimatedMinutes;

  console.log(`  Asking Claude to split "${concept.title}" (${estimatedTime} min)...`);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `This section is approximately ${estimatedTime} minutes of reading time, which exceeds our 25-minute maximum for a single learning concept.

Split it into smaller concepts where each:
1. Has ONE central idea or skill
2. Is self-contained (understandable without the others, though they build on each other)
3. Is 10-20 minutes of learning time
4. Has a clear, descriptive title

The content uses Mathpix Markdown (LaTeX + Markdown). Keep the original formatting.

Respond in JSON format:
{
  "concepts": [
    {
      "title": "Concept Title",
      "startMarker": "exact text that starts this concept (first ~50 chars)",
      "endMarker": "exact text that ends this concept (last ~50 chars)"
    }
  ]
}

Section content:
"""
${content.substring(0, 15000)}
"""`
    }]
  });

  try {
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const result = JSON.parse(jsonMatch[0]);
    const splitConcepts: ProposedConcept[] = [];

    for (const c of result.concepts) {
      // Find the content between markers
      const startIdx = content.indexOf(c.startMarker.substring(0, 30));
      const endIdx = content.indexOf(c.endMarker.substring(0, 30));

      if (startIdx === -1) {
        console.log(`    Warning: Could not find start marker for "${c.title}"`);
        continue;
      }

      const conceptContent = endIdx > startIdx
        ? content.substring(startIdx, endIdx + c.endMarker.length)
        : content.substring(startIdx);

      const wordCount = conceptContent.split(/\s+/).length;

      splitConcepts.push({
        title: c.title,
        sections: [{
          title: c.title,
          content: conceptContent,
          wordCount,
          formulaCount: (conceptContent.match(/\$[^$]+\$/g) || []).length,
          estimatedMinutes: Math.round(wordCount / WORDS_PER_MINUTE + 5),
        }],
        totalWords: wordCount,
        estimatedMinutes: Math.round(wordCount / WORDS_PER_MINUTE + 5),
        needsSplit: false,
      });
    }

    console.log(`    Split into ${splitConcepts.length} concepts`);
    return splitConcepts.length > 0 ? splitConcepts : [concept];
  } catch (e) {
    console.log(`    Error splitting: ${e}. Keeping as single concept.`);
    return [concept];
  }
}

// Clean content for display (convert LaTeX to markdown, preserve math)
function cleanContent(text: string): string {
  let result = text;

  // Convert \section*{Title} to ## Title
  result = result.replace(/\\section\*\{([^}]+)\}/g, "\n\n## $1\n\n");

  // Convert LaTeX figures to markdown images
  result = result.replace(
    /\\begin\{figure\}[\s\S]*?\\end\{figure\}/g,
    (match) => {
      const urlMatch = match.match(/\\includegraphics[^{]*\{([^}]+)\}/);
      const captionMatch = match.match(/\\caption\{([^}]*)\}/);
      if (urlMatch) {
        const url = urlMatch[1];
        const caption = captionMatch
          ? captionMatch[1].replace(/Figure\s*\d*[-:]?\s*/i, "").trim()
          : "Figure";
        return `\n\n![${caption}](${url})\n\n`;
      }
      return "";
    }
  );

  // Convert footnotes to inline notes
  result = result.replace(/\\footnote\{([^}]*)\}/g, " (*$1*) ");
  result = result.replace(/\\footnotetext\{([^}]*)\}/g, "\n\n*Note: $1*\n\n");

  // Remove tables
  result = result
    .replace(/\\begin\{table\}[\s\S]*?\\end\{table\}/g, "")
    .replace(/\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/g, "");

  // Convert text formatting
  result = result
    .replace(/\\textbf\{([^}]*)\}/g, "**$1**")
    .replace(/\\textit\{([^}]*)\}/g, "*$1*")
    .replace(/\\emph\{([^}]*)\}/g, "*$1*");

  // Remove captionsetup
  result = result.replace(/\\captionsetup\{[^}]*\}/g, "");

  // Clean up whitespace
  result = result.replace(/\n{3,}/g, "\n\n").trim();

  return result;
}

async function main() {
  const mmdPath = "/Users/user/Downloads/Mcgraw-Hill - Option Pricing And Volatility - Advanced Strategies And Trading Techniques - Sheldon N.md";

  console.log("=".repeat(70));
  console.log("MOTE BOOK INGESTION");
  console.log("=".repeat(70));
  console.log(`\nParsing: ${mmdPath}\n`);

  // Step 1: Parse MMD
  const chapters = parseMMD(mmdPath);
  console.log(`Found ${chapters.length} chapters\n`);

  // Step 2: Group into concepts
  const allConcepts: { chapter: Chapter; concepts: ProposedConcept[] }[] = [];

  for (const chapter of chapters) {
    console.log(`\nChapter ${chapter.number}: ${chapter.title}`);
    console.log("-".repeat(50));

    let concepts = groupIntoConcepts(chapter);

    // Step 3: Split oversized concepts using LLM
    const finalConcepts: ProposedConcept[] = [];
    for (const concept of concepts) {
      if (concept.needsSplit) {
        const split = await splitOversizedConcept(concept);
        finalConcepts.push(...split);
      } else {
        finalConcepts.push(concept);
      }
    }

    for (const c of finalConcepts) {
      const status = c.estimatedMinutes < 10 ? " [SHORT]" : c.estimatedMinutes > 25 ? " [LONG]" : "";
      console.log(`  • ${c.title} (~${c.estimatedMinutes} min, ${c.totalWords} words)${status}`);
    }

    allConcepts.push({ chapter, concepts: finalConcepts });
  }

  // Step 4: Update database
  console.log("\n" + "=".repeat(70));
  console.log("UPDATING DATABASE");
  console.log("=".repeat(70));

  // Find or create book
  let book = await prisma.book.findFirst({
    where: { title: "Option Volatility and Pricing" },
  });

  if (book) {
    // Delete existing concepts and branches for this book
    await prisma.concept.deleteMany({ where: { bookId: book.id } });
    await prisma.branch.deleteMany({ where: { bookId: book.id } });
    console.log("\nCleared existing concepts and branches");
  } else {
    book = await prisma.book.create({
      data: {
        title: "Option Volatility and Pricing",
        author: "Sheldon Natenberg",
      },
    });
    console.log("\nCreated new book");
  }

  // Create branches and concepts
  let totalConcepts = 0;

  for (const { chapter, concepts } of allConcepts) {
    const branch = await prisma.branch.create({
      data: {
        bookId: book.id,
        title: `Chapter ${chapter.number}: ${chapter.title}`,
        chapterNumber: chapter.number,
      },
    });

    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i];
      const content = cleanContent(concept.sections.map(s => s.content).join("\n\n"));

      await prisma.concept.create({
        data: {
          bookId: book.id,
          branchId: branch.id,
          title: concept.title,
          content,
          summary: "", // To be generated later
          orderInBranch: i,
          estimatedMinutes: concept.estimatedMinutes,
        },
      });
      totalConcepts++;
    }

    console.log(`  Created branch "${branch.title}" with ${concepts.length} concepts`);
  }

  console.log(`\nTotal: ${totalConcepts} concepts across ${allConcepts.length} chapters`);
  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
