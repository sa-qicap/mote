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

  // Get all concepts in order
  const concepts = await prisma.concept.findMany({
    where: {
      bookId: params.id,
      book: {
        OR: [
          { userId },
          { isPublic: true },
        ],
      },
    },
    orderBy: [
      { branch: { chapterNumber: "asc" } },
      { orderInBranch: "asc" },
    ],
    select: { id: true },
  });

  // Get user's progress
  const userProgress = await prisma.userProgress.findFirst({
    where: {
      oderId: userId,
      bookId: params.id,
    },
    include: {
      conceptProgress: {
        where: { status: "completed" },
        select: { conceptId: true },
      },
    },
  });

  const completedIds = new Set(
    userProgress?.conceptProgress.map((cp) => cp.conceptId) || []
  );

  // Find first non-completed concept
  const nextConcept = concepts.find((c) => !completedIds.has(c.id));

  if (nextConcept) {
    return NextResponse.json({ conceptId: nextConcept.id });
  }

  // All concepts completed
  return NextResponse.json({ conceptId: null, complete: true });
}
