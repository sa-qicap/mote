import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ExtractedData {
  start_page: number;
  end_page: number;
  content: string;
  figures: { figure_num: string; caption: string; page: number }[];
  figure_images: { book_page: number; path: string }[];
}

async function importFromExtraction(
  bookTitle: string,
  conceptTitle: string,
  extractionDir: string,
  startPage: number,
  endPage: number
) {
  const book = await prisma.book.findFirst({
    where: { title: bookTitle },
    include: { concepts: true },
  });

  if (!book) {
    console.log(`Book not found: ${bookTitle}`);
    return;
  }

  const concept = book.concepts.find((c) => c.title === conceptTitle);
  if (!concept) {
    console.log(`Concept not found: ${conceptTitle}`);
    return;
  }

  // Read extracted JSON
  const jsonPath = path.join(extractionDir, `pages_${startPage}-${endPage}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.log(`Extraction file not found: ${jsonPath}`);
    return;
  }

  const data: ExtractedData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  // Build images array from figure_images
  const images = data.figure_images.map((fi, idx) => ({
    url: `/images/esl/pages_${startPage}-${endPage}/${fi.path}`,
    caption: data.figures.find(f => f.page === fi.book_page)?.caption || `Figure from page ${fi.book_page}`,
    afterParagraph: idx * 3, // Distribute images through content
  }));

  await prisma.concept.update({
    where: { id: concept.id },
    data: {
      content: data.content,
      images: JSON.stringify(images),
      startPage,
      endPage,
    },
  });

  console.log(`Updated: ${conceptTitle}`);
  console.log(`  - Content: ${data.content.length} chars`);
  console.log(`  - Images: ${images.length}`);
}

async function main() {
  // Import "From Least Squares to Nearest Neighbors" from pages 16-22 extraction
  await importFromExtraction(
    "The Elements of Statistical Learning",
    "From Least Squares to Nearest Neighbors",
    "./public/images/esl/pages_16-22",
    16,
    22
  );

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
