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

  // Fetch notes for this concept
  const notes = await prisma.note.findMany({
    where: {
      userId,
      bookId: params.id,
      conceptId: params.conceptId,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    notes.map((note) => ({
      id: note.id,
      content: note.content,
      phase: note.phase,
      highlightText: note.highlightText,
      createdAt: note.createdAt.toISOString(),
    }))
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; conceptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { noteId, content } = body;

  if (!noteId || !content?.trim()) {
    return NextResponse.json({ error: "Note ID and content required" }, { status: 400 });
  }

  // Verify the note belongs to this user
  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      userId,
      bookId: params.id,
      conceptId: params.conceptId,
    },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const updatedNote = await prisma.note.update({
    where: { id: noteId },
    data: { content: content.trim() },
  });

  return NextResponse.json({
    id: updatedNote.id,
    content: updatedNote.content,
    phase: updatedNote.phase,
    highlightText: updatedNote.highlightText,
    createdAt: updatedNote.createdAt.toISOString(),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; conceptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get("noteId");

  if (!noteId) {
    return NextResponse.json({ error: "Note ID required" }, { status: 400 });
  }

  // Verify the note belongs to this user
  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      userId,
      bookId: params.id,
      conceptId: params.conceptId,
    },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  await prisma.note.delete({
    where: { id: noteId },
  });

  return NextResponse.json({ success: true });
}
