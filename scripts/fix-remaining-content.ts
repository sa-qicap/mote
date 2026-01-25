import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

const mmd = fs.readFileSync(
  "/Users/user/Downloads/Mcgraw-Hill - Option Pricing And Volatility - Advanced Strategies And Trading Techniques - Sheldon N.md",
  "utf-8"
);

function clean(text: string): string {
  return text
    .replace(/\\begin\{figure\}[\s\S]*?\\end\{figure\}/g, "")
    .replace(/\\begin\{table\}[\s\S]*?\\end\{table\}/g, "")
    .replace(/\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/g, "")
    .replace(/\\section\*\{[^}]*\}/g, "")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\[a-zA-Z]+\{[^}]*\}/g, "")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/\{|\}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

async function main() {
  const book = await prisma.book.findFirst({
    where: { title: "Option Volatility and Pricing", concepts: { some: {} } },
  });

  if (!book) {
    console.log("Book not found");
    return;
  }

  // Types of Volatility - from Future Volatility to Chapter 5
  const typesStart = mmd.indexOf("\\section*{Future Volatility}");
  const typesEnd = mmd.indexOf("\\section*{Using an Option's Theoretical Value}");
  if (typesStart !== -1 && typesEnd !== -1) {
    const typesContent = clean(mmd.substring(typesStart, typesEnd));
    const r1 = await prisma.concept.updateMany({
      where: { bookId: book.id, title: "Types of Volatility" },
      data: { content: typesContent },
    });
    console.log("Updated Types of Volatility:", r1.count, "record(s),", typesContent.length, "chars");
  } else {
    console.log("Types of Volatility section not found", typesStart, typesEnd);
  }

  // Delta Hedging - from Chapter 5 to Chapter 6
  const deltaStart = mmd.indexOf("\\section*{Using an Option's Theoretical Value}");
  const deltaEnd = mmd.indexOf("\\section*{* 6 *}");
  if (deltaStart !== -1 && deltaEnd !== -1) {
    const deltaContent = clean(mmd.substring(deltaStart, deltaEnd));
    const r2 = await prisma.concept.updateMany({
      where: { bookId: book.id, title: "Delta Hedging and Capturing Theoretical Edge" },
      data: { content: deltaContent },
    });
    console.log("Updated Delta Hedging:", r2.count, "record(s),", deltaContent.length, "chars");
  } else {
    console.log("Delta Hedging section not found", deltaStart, deltaEnd);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
