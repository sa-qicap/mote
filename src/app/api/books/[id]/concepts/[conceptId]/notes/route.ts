import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; conceptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const [notes, bookmarks] = await Promise.all([
    prisma.note.findMany({
      where: {
        userId,
        bookId: params.id,
        conceptId: params.conceptId,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bookmark.findMany({
      where: {
        oderId: userId,
        bookId: params.id,
        conceptId: params.conceptId,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    notes: notes.map((n) => ({
      id: n.id,
      content: n.content,
      highlightText: n.highlightText,
      createdAt: n.createdAt.toISOString(),
    })),
    bookmarks: bookmarks.map((b) => ({
      id: b.id,
      highlightedText: b.highlightedText,
      annotation: b.annotation,
      createdAt: b.createdAt.toISOString(),
    })),
  });
}
