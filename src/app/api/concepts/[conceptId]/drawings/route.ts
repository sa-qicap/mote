import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { conceptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const drawing = await prisma.drawing.findUnique({
    where: {
      userId_conceptId: {
        userId,
        conceptId: params.conceptId,
      },
    },
  });

  if (!drawing) {
    return NextResponse.json({ strokes: [] });
  }

  return NextResponse.json({
    id: drawing.id,
    strokes: JSON.parse(drawing.strokes),
  });
}

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
  const { strokes } = body;

  if (!Array.isArray(strokes)) {
    return NextResponse.json({ error: "Invalid strokes data" }, { status: 400 });
  }

  const drawing = await prisma.drawing.upsert({
    where: {
      userId_conceptId: {
        userId,
        conceptId: params.conceptId,
      },
    },
    update: {
      strokes: JSON.stringify(strokes),
    },
    create: {
      userId,
      conceptId: params.conceptId,
      strokes: JSON.stringify(strokes),
    },
  });

  return NextResponse.json({
    id: drawing.id,
    strokes: JSON.parse(drawing.strokes),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { conceptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  await prisma.drawing.deleteMany({
    where: {
      userId,
      conceptId: params.conceptId,
    },
  });

  return NextResponse.json({ success: true });
}
