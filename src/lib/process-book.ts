import { prisma } from "./prisma";
import { readFile } from "fs/promises";

// Set to true to use mock data instead of Anthropic API
const USE_MOCK = false;

interface ExtractedConcept {
  title: string;
  content: string;
  summary: string;
  estimatedMinutes: number;
}

interface ExtractedChapter {
  title: string;
  chapterNumber: number;
  concepts: ExtractedConcept[];
}

interface ExtractedQuestion {
  type: "mcq" | "short" | "reflection";
  text: string;
  options?: string[];
  correctAnswer: string;
}

export async function processBook(bookId: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
  });

  if (!book) {
    throw new Error("Book not found");
  }

  try {
    // Read PDF file
    const pdfBuffer = await readFile(book.sourceFile);

    // Extract text from PDF
    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    // Extract chapters and concepts
    const chapters = USE_MOCK
      ? extractChaptersMock(text, book.title)
      : await extractChaptersLLM(text, book.title);

    // Create branches and concepts in database
    for (const chapter of chapters) {
      const branch = await prisma.branch.create({
        data: {
          bookId: book.id,
          title: chapter.title,
          chapterNumber: chapter.chapterNumber,
        },
      });

      for (let i = 0; i < chapter.concepts.length; i++) {
        const concept = chapter.concepts[i];

        const createdConcept = await prisma.concept.create({
          data: {
            bookId: book.id,
            branchId: branch.id,
            title: concept.title,
            summary: concept.summary,
            content: concept.content,
            orderInBranch: i + 1,
            estimatedMinutes: concept.estimatedMinutes,
          },
        });

        // Generate questions for the concept
        const questions = USE_MOCK
          ? generateQuestionsMock(concept)
          : await generateQuestionsLLM(concept);

        for (const q of questions) {
          await prisma.question.create({
            data: {
              conceptId: createdConcept.id,
              type: q.type,
              text: q.text,
              options: JSON.stringify(q.options || []),
              correctAnswer: q.correctAnswer,
            },
          });
        }
      }
    }

    // Determine concept dependencies
    await determineDependencies(bookId);

    // Mark book as completed
    await prisma.book.update({
      where: { id: bookId },
      data: { processingStatus: "completed" },
    });
  } catch (error) {
    console.error("Error processing book:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await prisma.book.update({
      where: { id: bookId },
      data: {
        processingStatus: "failed",
        processingError: errorMessage,
      },
    });
    throw error;
  }
}

// ============ MOCK FUNCTIONS ============

function extractChaptersMock(text: string, bookTitle: string): ExtractedChapter[] {
  // Split text into chunks to create mock chapters
  const words = text.split(/\s+/);
  const totalWords = words.length;
  const wordsPerConcept = 500; // ~2.5 min read
  const conceptsPerChapter = 3;
  const wordsPerChapter = wordsPerConcept * conceptsPerChapter;

  const numChapters = Math.min(Math.ceil(totalWords / wordsPerChapter), 5);
  const chapters: ExtractedChapter[] = [];

  for (let c = 0; c < numChapters; c++) {
    const chapterStart = c * wordsPerChapter;
    const chapterWords = words.slice(chapterStart, chapterStart + wordsPerChapter);

    const concepts: ExtractedConcept[] = [];

    for (let i = 0; i < conceptsPerChapter; i++) {
      const conceptStart = i * wordsPerConcept;
      const conceptWords = chapterWords.slice(conceptStart, conceptStart + wordsPerConcept);
      const conceptText = conceptWords.join(" ");

      if (conceptText.trim().length < 100) continue;

      concepts.push({
        title: `Section ${c + 1}.${i + 1}`,
        content: conceptText,
        summary: conceptText.slice(0, 500) + (conceptText.length > 500 ? "..." : ""),
        estimatedMinutes: Math.round(conceptWords.length / 200) + 5,
      });
    }

    if (concepts.length > 0) {
      chapters.push({
        title: `Chapter ${c + 1}`,
        chapterNumber: c + 1,
        concepts,
      });
    }
  }

  return chapters;
}

function generateQuestionsMock(concept: ExtractedConcept): ExtractedQuestion[] {
  return [
    {
      type: "mcq",
      text: `What is a key concept discussed in "${concept.title}"?`,
      options: [
        "The main topic covered",
        "An unrelated concept",
        "Something not mentioned",
        "None of the above",
      ],
      correctAnswer: "The main topic covered",
    },
    {
      type: "mcq",
      text: `Which best describes the content of "${concept.title}"?`,
      options: [
        "Theoretical concepts",
        "Practical applications",
        "Both theory and practice",
        "Neither",
      ],
      correctAnswer: "Both theory and practice",
    },
    {
      type: "short",
      text: `Summarize the main idea of "${concept.title}" in your own words.`,
      correctAnswer: "A clear summary that captures the key points discussed in this section.",
    },
    {
      type: "reflection",
      text: `How might you apply what you learned in "${concept.title}" to a real-world scenario?`,
      correctAnswer: "Thoughtful reflection connecting the concepts to practical applications.",
    },
  ];
}

// ============ LLM FUNCTIONS ============

async function extractChaptersLLM(
  text: string,
  bookTitle: string
): Promise<ExtractedChapter[]> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic();

  const maxChars = 100000;
  const truncatedText = text.length > maxChars ? text.slice(0, maxChars) : text;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: `You are analyzing the book "${bookTitle}" to break it down into learning concepts.

Here is the text content of the book:

<book_content>
${truncatedText}
</book_content>

Please extract the chapter structure and break down each chapter into small, self-contained learning concepts.

Requirements for each concept:
- Should take 10-25 minutes to learn (target: 15-20 min)
- Has ONE central idea or skill
- Is self-contained and understandable on its own
- Has enough content for 3-5 comprehension questions

Return your response as JSON in this exact format:
{
  "chapters": [
    {
      "title": "Chapter title",
      "chapterNumber": 1,
      "concepts": [
        {
          "title": "Concept title",
          "content": "The full content for this concept",
          "summary": "A 2-3 paragraph summary",
          "estimatedMinutes": 15
        }
      ]
    }
  ]
}

Only return valid JSON, no other text.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  const parsed = JSON.parse(content.text);
  return parsed.chapters;
}

async function generateQuestionsLLM(
  concept: ExtractedConcept
): Promise<ExtractedQuestion[]> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Generate 4 comprehension questions for this learning concept:

Title: ${concept.title}

Content:
${concept.content}

Create a mix of question types:
- 2 MCQ (multiple choice with 4 options)
- 1 short answer
- 1 reflection question

Return as JSON array:
[
  {
    "type": "mcq",
    "text": "Question text?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "The correct option text"
  }
]

Only return valid JSON array, no other text.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  return JSON.parse(content.text);
}

// ============ DEPENDENCIES ============

async function determineDependencies(bookId: string) {
  const concepts = await prisma.concept.findMany({
    where: { bookId },
    include: { branch: true },
    orderBy: [{ branch: { chapterNumber: "asc" } }, { orderInBranch: "asc" }],
  });

  if (concepts.length < 2) return;

  let previousConcept: (typeof concepts)[0] | null = null;
  let lastConceptOfPreviousBranch: (typeof concepts)[0] | null = null;
  let currentBranchId: string | null = null;

  for (const concept of concepts) {
    if (currentBranchId !== concept.branchId) {
      if (previousConcept) {
        lastConceptOfPreviousBranch = previousConcept;
      }
      currentBranchId = concept.branchId;

      if (lastConceptOfPreviousBranch) {
        await prisma.conceptDependency.create({
          data: {
            conceptId: concept.id,
            prerequisiteId: lastConceptOfPreviousBranch.id,
          },
        });
      }
    } else if (previousConcept) {
      await prisma.conceptDependency.create({
        data: {
          conceptId: concept.id,
          prerequisiteId: previousConcept.id,
        },
      });
    }

    previousConcept = concept;
  }
}
