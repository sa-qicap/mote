import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

const HTML_PATH =
  "/Users/user/Downloads/Mcgraw-Hill - Option Pricing And Volatility - Advanced Strategies And Trading Techniques - Sheldon N.html";

const BOOK_TITLE = "Option Volatility and Pricing";

// Chapters 7-18 structure - properly split for 15-20 min concepts
const NEW_CHAPTERS = [
  {
    number: 7,
    title: "Introduction to Spreading",
    concepts: [
      {
        title: "What is a Spread?",
        startId: "introduction-to-spreading",
        endId: "spreading-as-a-risk-management-tool",
      },
      {
        title: "Spreading as Risk Management",
        startId: "spreading-as-a-risk-management-tool",
        endId: "*-8-*",
      },
    ],
  },
  {
    number: 8,
    title: "Volatility Spreads",
    concepts: [
      {
        title: "Ratio Spreads and Straddles",
        startId: "volatility-spreads",
        endId: "butterfly",
      },
      {
        title: "Butterfly Spreads",
        startId: "butterfly",
        endId: "time-spread",
      },
      {
        title: "Time Spreads and Calendar Spreads",
        startId: "time-spread",
        endId: "diagonal-spreads",
      },
      {
        title: "Diagonal Spreads and Variations",
        startId: "diagonal-spreads",
        endId: "choosing-an-appropriate-strategy",
      },
      {
        title: "Choosing an Appropriate Strategy",
        startId: "choosing-an-appropriate-strategy",
        endId: "adjustments",
      },
      {
        title: "Spread Adjustments",
        startId: "adjustments",
        endId: "*9*",
      },
    ],
  },
  {
    number: 9,
    title: "Risk Considerations",
    concepts: [
      {
        title: "Choosing the Best Spread",
        startId: "risk-considerations",
        endId: "dividends-and-interest",
      },
      {
        title: "Dividends, Interest, and Good Spreads",
        startId: "dividends-and-interest",
        endId: "adjustments-2",
      },
      {
        title: "Adjustments and Trading Style",
        startId: "adjustments-2",
        endId: "*-10-*",
      },
    ],
  },
  {
    number: 10,
    title: "Bull and Bear Spreads",
    concepts: [
      {
        title: "Bull and Bear Spreads",
        startId: "bull-and-bear-spreads",
        endId: "bull-and-bear-butterflies-and-time-spreads",
      },
      {
        title: "Bull and Bear Butterflies",
        startId: "bull-and-bear-butterflies-and-time-spreads",
        endId: "*-11",
      },
    ],
  },
  {
    number: 11,
    title: "Option Arbitrage",
    concepts: [
      {
        title: "Synthetic Positions",
        startId: "option-arbitrage",
        endId: "conversions-and-reversals",
      },
      {
        title: "Conversions and Reversals",
        startId: "conversions-and-reversals",
        endId: "arbitrage-risk",
      },
      {
        title: "Arbitrage Risks",
        startId: "arbitrage-risk",
        endId: "boxes",
      },
      {
        title: "Boxes and Jelly Rolls",
        startId: "boxes",
        endId: "using-synthetics-in-volatility-spreads",
      },
      {
        title: "Using Synthetics in Volatility Spreads",
        startId: "using-synthetics-in-volatility-spreads",
        endId: "*12*",
      },
    ],
  },
  {
    number: 12,
    title: "Early Exercise of American Options",
    concepts: [
      {
        title: "Early Exercise of Futures Options",
        startId: "early-exercise-of-american-options",
        endId: "stock-options",
      },
      {
        title: "Early Exercise of Stock Options",
        startId: "stock-options",
        endId: "the-effect-of-early-exercise-on-trading-strategies",
      },
      {
        title: "Effects on Trading Strategies",
        startId: "the-effect-of-early-exercise-on-trading-strategies",
        endId: "*13-*",
      },
    ],
  },
  {
    number: 13,
    title: "Hedging with Options",
    concepts: [
      {
        title: "Protective Calls and Puts",
        startId: "hedging-with-options",
        endId: "fences",
      },
      {
        title: "Fences and Complex Hedging",
        startId: "fences",
        endId: "*14*",
      },
    ],
  },
  {
    number: 14,
    title: "Volatility Revisited",
    concepts: [
      {
        title: "Volatility Characteristics",
        startId: "volatility-revisited",
        endId: "volatility-forecasting",
      },
      {
        title: "Volatility Forecasting",
        startId: "volatility-forecasting",
        endId: "implied-versus-historical-volatility",
      },
      {
        title: "Implied vs Historical Volatility",
        startId: "implied-versus-historical-volatility",
        endId: "*15*",
      },
    ],
  },
  {
    number: 15,
    title: "Stock Index Futures and Options",
    concepts: [
      {
        title: "Index Basics",
        startId: "stock-index-futures-and-options",
        endId: "stock-index-futures",
      },
      {
        title: "Stock Index Futures",
        startId: "stock-index-futures",
        endId: "index-options",
      },
      {
        title: "Index Options",
        startId: "index-options",
        endId: "synthetic-relationships",
      },
      {
        title: "Synthetic Relationships and Biases",
        startId: "synthetic-relationships",
        endId: "*-16-*",
      },
    ],
  },
  {
    number: 16,
    title: "Intermarket Spreading",
    concepts: [
      {
        title: "Intermarket Hedging",
        startId: "intermarket-spreading",
        endId: "volatility-relationships",
      },
      {
        title: "Volatility Relationships",
        startId: "volatility-relationships",
        endId: "intermarket-volatility-spreads",
      },
      {
        title: "Intermarket Volatility Spreads",
        startId: "intermarket-volatility-spreads",
        endId: "*17%5C%25",
      },
    ],
  },
  {
    number: 17,
    title: "Position Analysis",
    concepts: [
      {
        title: "Simple Position Examples",
        startId: "position-analysis",
        endId: "graphing-a-position",
      },
      {
        title: "Graphing Positions",
        startId: "graphing-a-position",
        endId: "a-complex-position",
      },
      {
        title: "Complex Positions",
        startId: "a-complex-position",
        endId: "*18*",
      },
    ],
  },
  {
    number: 18,
    title: "Models and the Real World",
    concepts: [
      {
        title: "Model Assumptions",
        startId: "models-and-the-real-world",
        endId: "expiration-straddles",
      },
      {
        title: "Expiration Straddles",
        startId: "expiration-straddles",
        endId: "skewness-and-kurtosis",
      },
      {
        title: "Skewness, Kurtosis, and Volatility Skews",
        startId: "skewness-and-kurtosis",
        endId: "%5C%26-appendix-a",
      },
    ],
  },
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractHtmlContent(
  html: string,
  startId: string,
  endId: string
): string {
  const escapedStartId = escapeRegex(startId);
  const startPattern = new RegExp(`<h2[^>]*id="${escapedStartId}"[^>]*>`, "i");
  const startMatch = html.match(startPattern);

  if (!startMatch) {
    console.log(`  Warning: Start ID not found: "${startId}"`);
    return "";
  }

  const startIdx = html.indexOf(startMatch[0]);

  const escapedEndId = escapeRegex(endId);
  const endPattern = new RegExp(`<h2[^>]*id="${escapedEndId}"`, "i");
  const endMatch = html.substring(startIdx + 100).match(endPattern);

  let endIdx: number;
  if (!endMatch) {
    console.log(
      `  Warning: End ID not found: "${endId}", using next chapter marker`
    );
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

  let content = html.substring(startIdx, endIdx);

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
  return Math.round(baseTime + formulaTime + 5);
}

async function main() {
  console.log("=".repeat(70));
  console.log("MOTE BOOK INGESTION: Chapters 7-18");
  console.log("=".repeat(70));

  const html = fs.readFileSync(HTML_PATH, "utf-8");
  console.log(`\nLoaded HTML file: ${html.length} characters\n`);

  const book = await prisma.book.findFirst({
    where: { title: BOOK_TITLE },
  });

  if (!book) {
    console.error("Book not found! Run the original ingestion script first.");
    process.exit(1);
  }

  console.log(`Found book: ${book.title} (ID: ${book.id})\n`);

  let totalConcepts = 0;
  let shortCount = 0;
  let longCount = 0;

  for (const chapter of NEW_CHAPTERS) {
    console.log(`\nChapter ${chapter.number}: ${chapter.title}`);
    console.log("-".repeat(50));

    const existingBranch = await prisma.branch.findFirst({
      where: { bookId: book.id, chapterNumber: chapter.number },
    });

    if (existingBranch) {
      console.log(`  Skipping - chapter already exists`);
      continue;
    }

    const branch = await prisma.branch.create({
      data: {
        bookId: book.id,
        title: `Chapter ${chapter.number}: ${chapter.title}`,
        chapterNumber: chapter.number,
      },
    });

    for (let i = 0; i < chapter.concepts.length; i++) {
      const conceptDef = chapter.concepts[i];
      const content = extractHtmlContent(
        html,
        conceptDef.startId,
        conceptDef.endId
      );

      const textContent = content.replace(/<[^>]*>/g, " ");
      const wordCount = textContent
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
      const estimatedMinutes = calculateEstimatedMinutes(textContent);
      const imageCount = (content.match(/<img/g) || []).length;
      const tableCount = (content.match(/<table/g) || []).length;

      await prisma.concept.create({
        data: {
          bookId: book.id,
          branchId: branch.id,
          title: conceptDef.title,
          content,
          summary: "",
          orderInBranch: i,
          estimatedMinutes,
        },
      });

      let status = "";
      if (estimatedMinutes < 10) {
        status = " [SHORT]";
        shortCount++;
      } else if (estimatedMinutes > 25) {
        status = " [LONG]";
        longCount++;
      }
      const extras = [
        imageCount > 0 ? `${imageCount} img` : "",
        tableCount > 0 ? `${tableCount} tbl` : "",
      ]
        .filter(Boolean)
        .join(", ");
      console.log(
        `  • ${conceptDef.title}: ~${estimatedMinutes} min, ${wordCount} words${extras ? ` (${extras})` : ""}${status}`
      );
      totalConcepts++;
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`COMPLETE: Added ${totalConcepts} new concepts`);
  if (shortCount > 0) console.log(`  ⚠️  ${shortCount} concepts are SHORT (<10 min)`);
  if (longCount > 0) console.log(`  ⚠️  ${longCount} concepts are LONG (>25 min)`);
  console.log("=".repeat(70));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
