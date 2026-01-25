import { PrismaClient } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

const prisma = new PrismaClient();
const anthropic = new Anthropic();

const BOOK_ID = "cmkthxafa0001xd23bywd7zn3";

async function generateSummary(
  concept: { title: string; content: string },
  bookTitle: string,
  branchTitle: string
): Promise<string> {
  // Take first ~50k chars of content to stay within context limits
  const contentSlice = concept.content.slice(0, 50000);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `Write a ~500 word summary for this learning concept, structured like a research paper abstract.

Book: "${bookTitle}"
Chapter: "${branchTitle}"
Concept: "${concept.title}"

Content:
"""
${contentSlice}
"""

Requirements:
- Single flowing paragraph, approximately 500 words
- Start with context (what area this covers)
- Explain the key ideas and their relationships
- End with significance (why this matters)
- Use $...$ for any mathematical notation (LaTeX format)
- Match the terminology from the source content
- Prepare the reader without spoiling detailed explanations

Write ONLY the summary paragraph, no preamble or explanation.`,
      },
    ],
  });

  if (response.content[0].type === "text") {
    return response.content[0].text;
  }
  throw new Error("No text response from Claude");
}

async function main() {
  const book = await prisma.book.findUnique({
    where: { id: BOOK_ID },
  });

  if (!book) {
    console.error("Book not found");
    process.exit(1);
  }

  const concepts = await prisma.concept.findMany({
    where: { bookId: BOOK_ID },
    include: { branch: true },
    orderBy: [{ branch: { chapterNumber: "asc" } }, { orderInBranch: "asc" }],
  });

  console.log(`Found ${concepts.length} concepts to process\n`);

  for (let i = 0; i < concepts.length; i++) {
    const concept = concepts[i];
    console.log(
      `[${i + 1}/${concepts.length}] Generating summary for: ${concept.title}`
    );

    try {
      const summary = await generateSummary(
        { title: concept.title, content: concept.content },
        book.title,
        concept.branch.title
      );

      await prisma.concept.update({
        where: { id: concept.id },
        data: { summary },
      });

      console.log(`  ✓ Generated ${summary.split(" ").length} words\n`);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ✗ Failed: ${error}`);
    }
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
