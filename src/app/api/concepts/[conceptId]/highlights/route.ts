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

  const highlights = await prisma.pdfHighlight.findMany({
    where: {
      conceptId: params.conceptId,
      oderId: userId,
    },
    orderBy: { createdAt: "asc" },
  });

  // Parse JSON fields
  const parsedHighlights = highlights.map((h) => ({
    id: h.id,
    position: JSON.parse(h.position),
    content: JSON.parse(h.content),
    comment: h.comment ? JSON.parse(h.comment) : { text: "" },
    color: h.color,
  }));

  return NextResponse.json(parsedHighlights);
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

  const { id, position, content, comment, color } = body;

  const highlight = await prisma.pdfHighlight.create({
    data: {
      id,
      oderId: userId,
      conceptId: params.conceptId,
      position: JSON.stringify(position),
      content: JSON.stringify(content),
      comment: comment ? JSON.stringify(comment) : null,
      color: color || "yellow",
    },
  });

  return NextResponse.json({
    id: highlight.id,
    position: JSON.parse(highlight.position),
    content: JSON.parse(highlight.content),
    comment: highlight.comment ? JSON.parse(highlight.comment) : { text: "" },
    color: highlight.color,
  });
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

  await prisma.pdfHighlight.deleteMany({
    where: {
      id: highlightId,
      conceptId: params.conceptId,
      oderId: userId,
    },
  });

  return NextResponse.json({ success: true });
}
