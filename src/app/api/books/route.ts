import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const books = await prisma.book.findMany({
    where: {
      OR: [
        { userId },
        { isPublic: true },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      concepts: {
        select: { id: true },
      },
      progress: {
        where: { oderId: userId },
        include: {
          conceptProgress: {
            where: { status: "completed" },
            select: { id: true },
          },
        },
      },
    },
  });

  const booksWithProgress = books.map((book) => {
    const totalConcepts = book.concepts.length;
    const completedConcepts = book.progress[0]?.conceptProgress.length || 0;
    const progress =
      totalConcepts > 0
        ? Math.round((completedConcepts / totalConcepts) * 100)
        : 0;

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      processingStatus: book.processingStatus,
      processingError: book.processingError,
      progress,
    };
  });

  return NextResponse.json(booksWithProgress);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string | null;

    if (!file || !title) {
      return NextResponse.json(
        { error: "File and title are required" },
        { status: 400 }
      );
    }

    // Save file to uploads directory
    const uploadsDir = join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Create book record
    const book = await prisma.book.create({
      data: {
        userId,
        title,
        author,
        sourceFile: filePath,
        processingStatus: "pending",
      },
    });

    // Create user progress record
    await prisma.userProgress.create({
      data: {
        oderId: userId,
        bookId: book.id,
      },
    });

    // Trigger processing (in a real app, this would be a background job)
    processBookAsync(book.id);

    return NextResponse.json({ id: book.id });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

async function processBookAsync(bookId: string) {
  // This would be a background job in production
  // For now, we'll just mark it as processing
  try {
    await prisma.book.update({
      where: { id: bookId },
      data: { processingStatus: "processing" },
    });

    // TODO: Implement actual PDF processing with LLM
    // For now, simulate processing delay
    setTimeout(async () => {
      try {
        // Import processing function dynamically to avoid loading heavy deps on every request
        const { processBook } = await import("@/lib/process-book");
        await processBook(bookId);
      } catch (error) {
        console.error("Processing error:", error);
        await prisma.book.update({
          where: { id: bookId },
          data: { processingStatus: "failed" },
        });
      }
    }, 1000);
  } catch (error) {
    console.error("Error starting processing:", error);
  }
}
