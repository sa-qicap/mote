import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

const mmd = fs.readFileSync(
  "/Users/user/Downloads/Mcgraw-Hill - Option Pricing And Volatility - Advanced Strategies And Trading Techniques - Sheldon N.md",
  "utf-8"
);

// Minimal cleaning: convert LaTeX to markdown, preserve math and images
function cleanContent(text: string): string {
  let result = text;

  // Convert \section*{Title} to ## Title
  result = result.replace(/\\section\*\{([^}]+)\}/g, "\n\n## $1\n\n");

  // Convert LaTeX figures to markdown images - extract caption and URL
  result = result.replace(
    /\\begin\{figure\}[\s\S]*?\\end\{figure\}/g,
    (match) => {
      // Extract URL from \includegraphics
      const urlMatch = match.match(/\\includegraphics[^{]*\{([^}]+)\}/);
      // Extract caption
      const captionMatch = match.match(/\\caption\{([^}]*)\}/);

      if (urlMatch) {
        const url = urlMatch[1];
        const caption = captionMatch ? captionMatch[1].replace(/Figure\s*\d*[-:]?\s*/i, "").trim() : "Figure";
        return `\n\n![${caption}](${url})\n\n`;
      }
      return "";
    }
  );

  // Convert footnotes to inline notes
  result = result.replace(/\\footnote\{([^}]*)\}/g, " (*$1*) ");
  result = result.replace(/\\footnotetext\{([^}]*)\}/g, "\n\n*Note: $1*\n\n");

  // Remove tables (complex LaTeX tables don't render well)
  result = result
    .replace(/\\begin\{table\}[\s\S]*?\\end\{table\}/g, "")
    .replace(/\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/g, "");

  // Convert text formatting
  result = result
    .replace(/\\textbf\{([^}]*)\}/g, "**$1**")
    .replace(/\\textit\{([^}]*)\}/g, "*$1*")
    .replace(/\\emph\{([^}]*)\}/g, "*$1*");

  // Remove captionsetup (styling command)
  result = result.replace(/\\captionsetup\{[^}]*\}/g, "");

  // Clean up whitespace
  result = result
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return result;
}

function extractSection(startPattern: string, endPattern: string): string {
  const startMatch = mmd.indexOf(startPattern);
  if (startMatch === -1) return "";

  const searchStart = startMatch + startPattern.length;
  const endMatch = endPattern ? mmd.indexOf(endPattern, searchStart) : mmd.length;
  if (endMatch === -1) return "";

  return cleanContent(mmd.substring(searchStart, endMatch));
}

const contentUpdates: { title: string; content: string }[] = [
  {
    title: "Contract Specifications",
    content: extractSection("\\section*{CONTRACT SPECIFICATIONS}", "\\section*{EXERCISE AND ASSIGNMENT}"),
  },
  {
    title: "Exercise and Assignment",
    content: extractSection("\\section*{EXERCISE AND ASSIGNMENT}", "\\section*{MARKET INTEGRITY}"),
  },
  {
    title: "Market Integrity and Margin",
    content: extractSection("\\section*{MARKET INTEGRITY}", "\\section*{SETTLEMENT PROCEDURES}"),
  },
  {
    title: "Settlement Procedures",
    content: extractSection("\\section*{SETTLEMENT PROCEDURES}", "\\section*{*2*}"),
  },
  {
    title: "Simple Buy and Sell Strategies",
    content: extractSection("\\section*{Elementary Strategies}", "\\section*{RISK/REWARD CHARACTERISTICS}"),
  },
  {
    title: "Risk/Reward Characteristics",
    content: extractSection("\\section*{RISK/REWARD CHARACTERISTICS}", "\\section*{COMBINATION STRATEGIES}"),
  },
  {
    title: "Combination Strategies",
    content: extractSection("\\section*{COMBINATION STRATEGIES}", "\\section*{CONSTRUCTING AN EXPIRATION GRAPH}"),
  },
  {
    title: "Expected Return and Theoretical Value",
    content: extractSection("\\section*{EXPECTED RETURN}", "\\section*{A WORD ON MODELS}"),
  },
  {
    title: "A Simple Pricing Approach",
    content: extractSection("\\section*{A SIMPLE APPROACH}", "\\section*{EXERCISE PRICE}"),
  },
  {
    title: "Inputs to Pricing Models",
    content: extractSection("\\section*{EXERCISE PRICE}", "\\section*{* 4 *}"),
  },
  {
    title: "Random Walks and Normal Distributions",
    content: extractSection("\\section*{RANDOM WALKS AND NORMAL DISTRIBUTIONS}", "\\section*{MEAN AND STANDARD DEVIATION}"),
  },
  {
    title: "Mean and Standard Deviation",
    content: extractSection("\\section*{MEAN AND STANDARD DEVIATION}", "\\section*{UNDERLYING PRICE AS THE MEAN OF A DISTRIBUTION}"),
  },
  {
    title: "Volatility as Standard Deviation",
    content: extractSection("\\section*{VOLATILITY AS A STANDARD DEVIATION}", "\\section*{LOGNORMAL DISTRIBUTIONS}"),
  },
  {
    title: "Types of Volatility",
    content: extractSection("\\section*{Future Volatility}", "\\section*{Using an Option's Theoretical Value}"),
  },
  {
    title: "Delta Hedging and Capturing Theoretical Edge",
    content: extractSection("\\section*{Using an Option's Theoretical Value}", "\\section*{* 6 *}"),
  },
  {
    title: "The Delta",
    content: extractSection("\\section*{THE DELTA}", "\\section*{THE GAMMA}"),
  },
  {
    title: "The Gamma",
    content: extractSection("\\section*{THE GAMMA}", "\\section*{THE THETA}"),
  },
  {
    title: "Theta, Vega, and Rho",
    content: extractSection("\\section*{THE THETA}", "\\section*{SUMMARY}"),
  },
];

async function main() {
  const book = await prisma.book.findFirst({
    where: { title: "Option Volatility and Pricing", concepts: { some: {} } },
  });

  if (!book) {
    console.log("Book not found");
    return;
  }

  console.log("Updating content with proper math symbols for book:", book.title);

  for (const update of contentUpdates) {
    if (!update.content || update.content.length < 100) {
      console.log(`Skipping "${update.title}" - content too short`);
      continue;
    }

    const imageCount = (update.content.match(/!\[/g) || []).length;

    const result = await prisma.concept.updateMany({
      where: { bookId: book.id, title: update.title },
      data: { content: update.content },
    });

    console.log(`Updated "${update.title}": ${result.count} record(s), ${update.content.length} chars, ${imageCount} images`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
