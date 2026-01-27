import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { conceptId, phase, content, highlightText, highlightStart, highlightEnd } = body;

  // Verify user can access the book (owner or public)
  const book = await prisma.book.findFirst({
    where: {
      id: params.id,
      OR: [
        { userId },
        { isPublic: true },
      ],
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const note = await prisma.note.create({
    data: {
      userId,
      bookId: params.id,
      conceptId: conceptId || null,
      phase: phase || null,
      content,
      highlightText: highlightText || null,
      highlightStart: highlightStart || null,
      highlightEnd: highlightEnd || null,
    },
  });

  return NextResponse.json({
    id: note.id,
    content: note.content,
    highlightText: note.highlightText,
    createdAt: note.createdAt.toISOString(),
  });
}
