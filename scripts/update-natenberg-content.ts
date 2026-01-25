import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

// Read and parse the MMD file
const mmdContent = fs.readFileSync(
  "/Users/user/Downloads/Mcgraw-Hill - Option Pricing And Volatility - Advanced Strategies And Trading Techniques - Sheldon N.md",
  "utf-8"
);

// Helper to clean LaTeX/MMD markup for display
function cleanContent(text: string): string {
  return text
    // Remove figure/table blocks
    .replace(/\\begin\{figure\}[\s\S]*?\\end\{figure\}/g, "\n\n")
    .replace(/\\begin\{table\}[\s\S]*?\\end\{table\}/g, "\n\n")
    .replace(/\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/g, "")
    // Remove section markers
    .replace(/\\section\*\{[^}]*\}/g, "")
    // Clean up LaTeX math
    .replace(/\$\{?\s*\}?\$/g, "")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1/$2)")
    // Remove footnotes
    .replace(/\\footnotetext\{[\s\S]*?\}/g, "")
    .replace(/\\footnote\{[\s\S]*?\}/g, "")
    // Remove other LaTeX commands
    .replace(/\\captionsetup\{[^}]*\}/g, "")
    .replace(/\\caption\{[^}]*\}/g, "")
    .replace(/\\includegraphics[^}]*\{[^}]*\}/g, "")
    .replace(/\\[a-zA-Z]+\[[^\]]*\]\{[^}]*\}/g, "")
    .replace(/\\[a-zA-Z]+\{[^}]*\}/g, "")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/\{|\}/g, "")
    // Clean up extra whitespace
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// Extract content between two patterns
function extractSection(startPattern: string, endPattern: string): string {
  const startMatch = mmdContent.indexOf(startPattern);
  if (startMatch === -1) {
    console.log(`  Warning: Start pattern not found: "${startPattern.substring(0, 50)}..."`);
    return "";
  }

  const searchStart = startMatch + startPattern.length;
  const endMatch = endPattern ? mmdContent.indexOf(endPattern, searchStart) : mmdContent.length;
  if (endMatch === -1) {
    console.log(`  Warning: End pattern not found: "${endPattern.substring(0, 50)}..."`);
    return "";
  }

  const rawContent = mmdContent.substring(searchStart, endMatch);
  return cleanContent(rawContent);
}

// Content mapping for each concept
const contentUpdates: { title: string; content: string }[] = [
  {
    title: "Contract Specifications",
    content: extractSection(
      "\\section*{CONTRACT SPECIFICATIONS}",
      "\\section*{EXERCISE AND ASSIGNMENT}"
    ),
  },
  {
    title: "Exercise and Assignment",
    content: extractSection(
      "\\section*{EXERCISE AND ASSIGNMENT}",
      "\\section*{MARKET INTEGRITY}"
    ),
  },
  {
    title: "Market Integrity and Margin",
    content: extractSection(
      "\\section*{MARKET INTEGRITY}",
      "\\section*{SETTLEMENT PROCEDURES}"
    ),
  },
  {
    title: "Settlement Procedures",
    content: extractSection(
      "\\section*{SETTLEMENT PROCEDURES}",
      "\\section*{*2*}"
    ),
  },
  {
    title: "Simple Buy and Sell Strategies",
    content: extractSection(
      "\\section*{Elementary Strategies}",
      "\\section*{RISK/REWARD CHARACTERISTICS}"
    ),
  },
  {
    title: "Risk/Reward Characteristics",
    content: extractSection(
      "\\section*{RISK/REWARD CHARACTERISTICS}",
      "\\section*{COMBINATION STRATEGIES}"
    ),
  },
  {
    title: "Combination Strategies",
    content: extractSection(
      "\\section*{COMBINATION STRATEGIES}",
      "\\section*{CONSTRUCTING AN EXPIRATION GRAPH}"
    ),
  },
  {
    title: "Expected Return and Theoretical Value",
    content: extractSection(
      "\\section*{EXPECTED RETURN}",
      "\\section*{A WORD ON MODELS}"
    ),
  },
  {
    title: "A Simple Pricing Approach",
    content: extractSection(
      "\\section*{A SIMPLE APPROACH}",
      "\\section*{EXERCISE PRICE}"
    ),
  },
  {
    title: "Inputs to Pricing Models",
    content: extractSection(
      "\\section*{EXERCISE PRICE}",
      "\\section*{* 4 *}"
    ),
  },
  {
    title: "Random Walks and Normal Distributions",
    content: extractSection(
      "\\section*{RANDOM WALKS AND NORMAL DISTRIBUTIONS}",
      "\\section*{MEAN AND STANDARD DEVIATION}"
    ),
  },
  {
    title: "Mean and Standard Deviation",
    content: extractSection(
      "\\section*{MEAN AND STANDARD DEVIATION}",
      "\\section*{UNDERLYING PRICE AS THE MEAN OF A DISTRIBUTION}"
    ),
  },
  {
    title: "Volatility as Standard Deviation",
    content: extractSection(
      "\\section*{VOLATILITY AS A STANDARD DEVIATION}",
      "\\section*{LOGNORMAL DISTRIBUTIONS}"
    ),
  },
  {
    title: "Types of Volatility",
    content: extractSection(
      "\\section*{Future Volatility}",
      "\\section*{* 5}"
    ),
  },
  {
    title: "Delta Hedging and Capturing Theoretical Edge",
    content: extractSection(
      "\\section*{Using an Option's Theoretical Value}",
      "\\section*{* 6}"
    ),
  },
  {
    title: "The Delta",
    content: extractSection(
      "\\section*{THE DELTA}",
      "\\section*{THE GAMMA}"
    ),
  },
  {
    title: "The Gamma",
    content: extractSection(
      "\\section*{THE GAMMA}",
      "\\section*{THE THETA}"
    ),
  },
  {
    title: "Theta, Vega, and Rho",
    content: extractSection(
      "\\section*{THE THETA}",
      "\\section*{SUMMARY}"
    ),
  },
];

async function main() {
  const book = await prisma.book.findFirst({
    where: {
      title: "Option Volatility and Pricing",
      concepts: { some: {} }
    },
  });

  if (!book) {
    console.log("Book not found");
    return;
  }

  console.log("Updating content for book:", book.title, "(ID:", book.id + ")");

  for (const update of contentUpdates) {
    if (!update.content || update.content.length < 100) {
      console.log(`Skipping "${update.title}" - content too short (${update.content?.length || 0} chars)`);
      continue;
    }

    const result = await prisma.concept.updateMany({
      where: {
        bookId: book.id,
        title: update.title,
      },
      data: {
        content: update.content,
      },
    });

    console.log(`Updated "${update.title}": ${result.count} record(s), ${update.content.length} chars`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
