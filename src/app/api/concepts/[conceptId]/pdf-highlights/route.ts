import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all PDF highlights for a concept
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
      userId: userId,
    },
    orderBy: { createdAt: "asc" },
  });

  // Parse JSON fields
  const parsed = highlights.map((h) => ({
    id: h.id,
    pageNumber: h.pageNumber,
    text: h.text,
    color: h.color,
    rects: h.rects ? JSON.parse(h.rects) : [],
    note: h.note,
    createdAt: h.createdAt.toISOString(),
  }));

  return NextResponse.json(parsed);
}

// POST - Create a new PDF highlight
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

  const { pageNumber, text, color, rects, note } = body;

  const highlight = await prisma.pdfHighlight.create({
    data: {
      userId: userId,
      conceptId: params.conceptId,
      pageNumber: pageNumber || 1,
      text: text || "",
      color: color || "#fef08a",
      rects: JSON.stringify(rects || []),
      note: note || null,
    },
  });

  return NextResponse.json({
    id: highlight.id,
    pageNumber: highlight.pageNumber,
    text: highlight.text,
    color: highlight.color,
    rects: rects || [],
    note: highlight.note,
    createdAt: highlight.createdAt.toISOString(),
  });
}

// DELETE - Delete a PDF highlight
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
      userId: userId,
    },
  });

  return NextResponse.json({ success: true });
}
