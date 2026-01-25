import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const book = await prisma.book.findFirst({
    where: {
      id: params.id,
      userId,
    },
    include: {
      branches: {
        orderBy: { chapterNumber: "asc" },
      },
      concepts: {
        include: {
          dependencies: {
            select: { prerequisiteId: true },
          },
        },
        orderBy: [
          { branch: { chapterNumber: "asc" } },
          { orderInBranch: "asc" },
        ],
      },
      progress: {
        where: { oderId: userId },
        include: {
          conceptProgress: true,
        },
      },
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const userProgress = book.progress[0];
  const conceptProgressMap = new Map(
    userProgress?.conceptProgress.map((cp) => [cp.conceptId, cp.status]) || []
  );

  // Calculate progress
  const completedCount = userProgress?.conceptProgress.filter(
    (cp) => cp.status === "completed"
  ).length || 0;
  const progress =
    book.concepts.length > 0
      ? Math.round((completedCount / book.concepts.length) * 100)
      : 0;

  // Find next concept to continue
  let nextConceptId: string | null = null;
  let currentConceptId = userProgress?.currentConceptId || null;

  // If there's a current concept in progress, that's the next one
  if (currentConceptId) {
    const currentStatus = conceptProgressMap.get(currentConceptId);
    if (currentStatus && currentStatus !== "completed") {
      nextConceptId = currentConceptId;
    }
  }

  // Otherwise find the first non-completed concept
  if (!nextConceptId) {
    for (const concept of book.concepts) {
      const status = conceptProgressMap.get(concept.id) || "not_started";
      if (status !== "completed") {
        nextConceptId = concept.id;
        break;
      }
    }
  }

  const conceptsWithStatus = book.concepts.map((c) => ({
    id: c.id,
    title: c.title,
    branchId: c.branchId,
    orderInBranch: c.orderInBranch,
    estimatedMinutes: c.estimatedMinutes,
    startPage: c.startPage,
    endPage: c.endPage,
    status: conceptProgressMap.get(c.id) || "not_started",
    dependencies: c.dependencies.map((d) => d.prerequisiteId),
  }));

  return NextResponse.json({
    id: book.id,
    title: book.title,
    author: book.author,
    branches: book.branches.map((b) => ({
      id: b.id,
      title: b.title,
      chapterNumber: b.chapterNumber,
    })),
    concepts: conceptsWithStatus,
    progress,
    currentConceptId,
    nextConceptId,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const book = await prisma.book.findFirst({
    where: {
      id: params.id,
      userId,
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  await prisma.book.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
