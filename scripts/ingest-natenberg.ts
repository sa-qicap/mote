import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

const HTML_PATH = "/Users/user/Downloads/Mcgraw-Hill - Option Pricing And Volatility - Advanced Strategies And Trading Techniques - Sheldon N.html";

// Book structure - using HTML section IDs for extraction
const BOOK_STRUCTURE = {
  title: "Option Volatility and Pricing",
  author: "Sheldon Natenberg",
  chapters: [
    {
      number: 1,
      title: "The Language of Options",
      concepts: [
        {
          title: "Contract Specifications",
          startId: "the-language-of-options",
          endId: "exercise-and-assignment",
        },
        {
          title: "Exercise and Assignment",
          startId: "exercise-and-assignment",
          endId: "market-integrity",
        },
        {
          title: "Market Integrity and Settlement",
          startId: "market-integrity",
          endId: "*2*",
        },
      ],
    },
    {
      number: 2,
      title: "Elementary Strategies",
      concepts: [
        {
          title: "Simple Buy and Sell Strategies",
          startId: "elementary-strategies",
          endId: "combination-strategies",
        },
        {
          title: "Combination Strategies",
          startId: "combination-strategies",
          endId: "futures-and-futures-options",
        },
        {
          title: "Futures and Equity Options",
          startId: "futures-and-futures-options",
          endId: "introduction-to-theoretical-pricing-models",
        },
      ],
    },
    {
      number: 3,
      title: "Introduction to Theoretical Pricing Models",
      concepts: [
        {
          title: "Expected Return and Theoretical Value",
          startId: "introduction-to-theoretical-pricing-models",
          endId: "a-simple-approach",
        },
        {
          title: "A Simple Pricing Approach",
          startId: "a-simple-approach",
          endId: "exercise-price",
        },
        {
          title: "Inputs to Pricing Models",
          startId: "exercise-price",
          endId: "*-4-*",
        },
      ],
    },
    {
      number: 4,
      title: "Volatility",
      concepts: [
        {
          title: "Random Walks and Normal Distributions",
          startId: "volatility",
          endId: "underlying-price-as-the-mean-of-a-distribution",
        },
        {
          title: "Lognormal Distributions",
          startId: "underlying-price-as-the-mean-of-a-distribution",
          endId: "volatility-and-observed-price-changes",
        },
        {
          title: "Volatility and Price Changes",
          startId: "volatility-and-observed-price-changes",
          endId: "types-of-volatilities",
        },
        {
          title: "Types of Volatility",
          startId: "types-of-volatilities",
          endId: "using-the-model-to-solve-for-a-theoretlcal-value",
        },
        {
          title: "Implied and Seasonal Volatility",
          startId: "using-the-model-to-solve-for-a-theoretlcal-value",
          endId: "using-an-option's-theoretical-value",
        },
      ],
    },
    {
      number: 5,
      title: "Using an Option's Theoretical Value",
      concepts: [
        {
          title: "Using an Option's Theoretical Value",
          startId: "using-an-option's-theoretical-value",
          endId: "*-6-*",
        },
      ],
    },
    {
      number: 6,
      title: "Option Sensitivities (The Greeks)",
      concepts: [
        {
          title: "The Delta",
          startId: "option-values-and-changing-market-conditions",
          endId: "the-gamma",
        },
        {
          title: "Gamma and Theta",
          startId: "the-gamma",
          endId: "the-vega-or-kappa",
        },
        {
          title: "Vega and Rho",
          startId: "the-vega-or-kappa",
          endId: "summary",
        },
        {
          title: "Greeks Summary and Relationships",
          startId: "summary",
          endId: "*-7-*",
        },
      ],
    },
  ],
};

// Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Extract content between two section IDs from HTML
function extractHtmlContent(html: string, startId: string, endId: string): string {
  // Find the start section by ID (escape special characters)
  const escapedStartId = escapeRegex(startId);
  const startPattern = new RegExp(`<h2[^>]*id="${escapedStartId}"[^>]*>`, "i");
  const startMatch = html.match(startPattern);

  if (!startMatch) {
    console.log(`  Warning: Start ID not found: "${startId}"`);
    return "";
  }

  const startIdx = html.indexOf(startMatch[0]);

  // Find the end section by ID
  const escapedEndId = escapeRegex(endId);
  const endPattern = new RegExp(`<h2[^>]*id="${escapedEndId}"`, "i");
  const endMatch = html.substring(startIdx + 100).match(endPattern);

  let endIdx: number;
  if (!endMatch) {
    console.log(`  Warning: End ID not found: "${endId}", using next chapter marker`);
    // Try to find next chapter marker (* N * or *N*)
    const chapterPattern = /id="\*-?\d+-?\*"/;
    const chapterMatch = html.substring(startIdx + 100).match(chapterPattern);
    if (chapterMatch) {
      endIdx = html.indexOf(chapterMatch[0], startIdx + 100);
    } else {
      endIdx = html.length;
    }
  } else {
    endIdx = html.indexOf(endMatch[0], startIdx + 100);
  }

  // Extract the content
  let content = html.substring(startIdx, endIdx);

  // Clean up the content - remove data attributes but keep structure
  content = content.replace(/\s+data_line_start="[^"]*"/g, "");
  content = content.replace(/\s+data_line_end="[^"]*"/g, "");
  content = content.replace(/\s+data_line="[^"]*"/g, "");
  content = content.replace(/\s+count_line="[^"]*"/g, "");

  return content;
}

function calculateEstimatedMinutes(content: string): number {
  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
  const formulaCount = (content.match(/\$[^$]+\$/g) || []).length;
  const baseTime = wordCount / 200;
  const formulaTime = formulaCount * 0.025;
  return Math.round(baseTime + formulaTime + 5); // +5 for questions
}

async function main() {
  console.log("=".repeat(70));
  console.log("MOTE BOOK INGESTION: Option Volatility and Pricing");
  console.log("=".repeat(70));

  const html = fs.readFileSync(HTML_PATH, "utf-8");
  console.log(`\nLoaded HTML file: ${html.length} characters\n`);

  // Find or create default user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "test@example.com",
      },
    });
    console.log("Created default user\n");
  }

  // Find or create book
  let book = await prisma.book.findFirst({
    where: { title: BOOK_STRUCTURE.title, userId: user.id },
  });

  if (book) {
    // Clear existing data
    await prisma.concept.deleteMany({ where: { bookId: book.id } });
    await prisma.branch.deleteMany({ where: { bookId: book.id } });
    console.log("Cleared existing concepts and branches\n");
  } else {
    book = await prisma.book.create({
      data: {
        title: BOOK_STRUCTURE.title,
        author: BOOK_STRUCTURE.author,
        sourceFile: HTML_PATH,
        userId: user.id,
      },
    });
    console.log("Created new book\n");
  }

  let totalConcepts = 0;

  for (const chapter of BOOK_STRUCTURE.chapters) {
    console.log(`\nChapter ${chapter.number}: ${chapter.title}`);
    console.log("-".repeat(50));

    const branch = await prisma.branch.create({
      data: {
        bookId: book.id,
        title: `Chapter ${chapter.number}: ${chapter.title}`,
        chapterNumber: chapter.number,
      },
    });

    for (let i = 0; i < chapter.concepts.length; i++) {
      const conceptDef = chapter.concepts[i];
      const content = extractHtmlContent(html, conceptDef.startId, conceptDef.endId);

      // Calculate stats from the extracted HTML
      const textContent = content.replace(/<[^>]*>/g, " "); // Strip HTML for word count
      const wordCount = textContent.split(/\s+/).filter((w) => w.length > 0).length;
      const estimatedMinutes = calculateEstimatedMinutes(textContent);
      const imageCount = (content.match(/<img/g) || []).length;
      const tableCount = (content.match(/<table/g) || []).length;

      await prisma.concept.create({
        data: {
          bookId: book.id,
          branchId: branch.id,
          title: conceptDef.title,
          content,
          summary: "", // To be generated later
          orderInBranch: i,
          estimatedMinutes,
        },
      });

      const status =
        estimatedMinutes < 10 ? " [SHORT]" : estimatedMinutes > 25 ? " [LONG]" : "";
      const extras = [
        imageCount > 0 ? `${imageCount} img` : "",
        tableCount > 0 ? `${tableCount} tbl` : "",
      ].filter(Boolean).join(", ");
      console.log(
        `  • ${conceptDef.title}: ~${estimatedMinutes} min, ${wordCount} words${extras ? ` (${extras})` : ""}${status}`
      );
      totalConcepts++;
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`COMPLETE: ${totalConcepts} concepts across ${BOOK_STRUCTURE.chapters.length} chapters`);
  console.log("=".repeat(70));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
