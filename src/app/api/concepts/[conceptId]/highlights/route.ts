import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all highlights for a concept
export async function GET(
  request: NextRequest,
  { params }: { params: { conceptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const highlights = await prisma.highlight.findMany({
    where: {
      conceptId: params.conceptId,
      userId: userId,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(highlights);
}

// POST - Create a new highlight
export async function POST(
  request: NextRequest,
  { params }: { params: { conceptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();

  const { text, startOffset, endOffset, color, note } = body;

  const highlight = await prisma.highlight.create({
    data: {
      userId,
      conceptId: params.conceptId,
      text,
      startOffset,
      endOffset,
      color: color || "yellow",
      note: note || null,
    },
  });

  return NextResponse.json(highlight);
}

// DELETE - Delete a highlight
export async function DELETE(
  request: NextRequest,
  { params }: { params: { conceptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const highlightId = searchParams.get("id");

  if (!highlightId) {
    return NextResponse.json({ error: "Highlight ID required" }, { status: 400 });
  }

  await prisma.highlight.deleteMany({
    where: {
      id: highlightId,
      conceptId: params.conceptId,
      userId: userId,
    },
  });

  return NextResponse.json({ success: true });
}
