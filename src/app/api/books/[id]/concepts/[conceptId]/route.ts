import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeMDX } from "@/lib/mdx";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; conceptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const concept = await prisma.concept.findFirst({
    where: {
      id: params.conceptId,
      bookId: params.id,
      book: {
        OR: [
          { userId },
          { isPublic: true },
        ],
      },
    },
    include: {
      book: true,
      branch: true,
      questions: true,
    },
  });

  if (!concept) {
    return NextResponse.json({ error: "Concept not found" }, { status: 404 });
  }

  // Get user's progress for this concept
  const userProgress = await prisma.userProgress.findFirst({
    where: {
      oderId: userId,
      bookId: params.id,
    },
    include: {
      conceptProgress: {
        where: { conceptId: params.conceptId },
        include: {
          questionAnswers: true,
        },
      },
    },
  });

  const conceptProgress = userProgress?.conceptProgress[0];

  // Get all concepts in order to find prev/next
  const allConcepts = await prisma.concept.findMany({
    where: { bookId: params.id },
    include: { branch: true },
    orderBy: [
      { branch: { chapterNumber: "asc" } },
      { orderInBranch: "asc" },
    ],
  });

  const currentIndex = allConcepts.findIndex((c) => c.id === params.conceptId);
  const prevConceptId = currentIndex > 0 ? allConcepts[currentIndex - 1].id : null;
  const nextConceptId = currentIndex < allConcepts.length - 1 ? allConcepts[currentIndex + 1].id : null;

  const parsedImages = (() => {
    try {
      const imgs = concept.images ? JSON.parse(concept.images) : [];
      console.log("API returning images:", imgs.length, "for concept:", concept.title);
      return imgs;
    } catch (e) {
      console.log("Error parsing images:", e);
      return [];
    }
  })();

  // Serialize MDX content if it exists
  let serializedContent = null;
  if (concept.content) {
    try {
      serializedContent = await serializeMDX(concept.content);
    } catch (e) {
      console.error("Error serializing MDX content:", e);
    }
  }

  // Derive PDF filename from sourceFile path
  const pdfFileName = concept.book.sourceFile.split("/").pop() || "";
  const pdfUrl = `/books/${pdfFileName}`;
  const pageOffset = concept.book.pageOffset || 0;

  return NextResponse.json({
    id: concept.id,
    title: concept.title,
    summary: concept.summary,
    content: concept.content,
    serializedContent,
    images: parsedImages,
    estimatedMinutes: concept.estimatedMinutes,
    startPage: concept.startPage,
    endPage: concept.endPage,
    branchTitle: concept.branch.title,
    pdfUrl,
    pageOffset,
    questions: concept.questions.map((q) => ({
      id: q.id,
      type: q.type,
      text: q.text,
      options: JSON.parse(q.options),
      correctAnswer: q.correctAnswer,
    })),
    status: conceptProgress?.status || "not_started",
    questionAnswers:
      conceptProgress?.questionAnswers.map((a) => ({
        questionId: a.questionId,
        answer: a.answer,
        isCorrect: a.isCorrect,
      })) || [],
    prevConceptId,
    nextConceptId,
  });
}
