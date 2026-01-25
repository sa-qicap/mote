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

  const book = await prisma.book.findFirst({
    where: {
      id: params.id,
      userId,
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // Reset status to processing
  await prisma.book.update({
    where: { id: params.id },
    data: {
      processingStatus: "processing",
      processingError: null,
    },
  });

  // Delete any existing concepts/branches from previous attempt
  await prisma.concept.deleteMany({ where: { bookId: params.id } });
  await prisma.branch.deleteMany({ where: { bookId: params.id } });

  // Trigger reprocessing
  processBookAsync(params.id);

  return NextResponse.json({ success: true });
}

async function processBookAsync(bookId: string) {
  setTimeout(async () => {
    try {
      const { processBook } = await import("@/lib/process-book");
      await processBook(bookId);
    } catch (error) {
      console.error("Processing error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await prisma.book.update({
        where: { id: bookId },
        data: {
          processingStatus: "failed",
          processingError: errorMessage,
        },
      });
    }
  }, 100);
}
