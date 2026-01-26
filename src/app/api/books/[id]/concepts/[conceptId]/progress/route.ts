import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; conceptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { status, questionAnswers } = body;

  // Get or create user progress
  let userProgress = await prisma.userProgress.findFirst({
    where: {
      oderId: userId,
      bookId: params.id,
    },
  });

  if (!userProgress) {
    userProgress = await prisma.userProgress.create({
      data: {
        oderId: userId,
        bookId: params.id,
      },
    });
  }

  // Update current concept
  await prisma.userProgress.update({
    where: { id: userProgress.id },
    data: {
      currentConceptId: params.conceptId,
      lastStudyDate: new Date(),
    },
  });

  // Get or create concept progress
  let conceptProgress = await prisma.conceptProgress.findFirst({
    where: {
      userProgressId: userProgress.id,
      conceptId: params.conceptId,
    },
  });

  // Don't allow progress changes once completed (user must reset via DELETE)
  if (conceptProgress?.status === "completed" && status !== "completed") {
    return NextResponse.json({ success: true, alreadyCompleted: true });
  }

  const now = new Date();
  const updateData: any = { status };

  // Set timestamp based on status
  switch (status) {
    case "primed":
      updateData.primedAt = now;
      break;
    case "learning":
      updateData.learningStartedAt = now;
      break;
    case "testing":
      updateData.testingStartedAt = now;
      break;
    case "completed":
      updateData.completedAt = now;
      break;
  }

  if (conceptProgress) {
    await prisma.conceptProgress.update({
      where: { id: conceptProgress.id },
      data: updateData,
    });
  } else {
    conceptProgress = await prisma.conceptProgress.create({
      data: {
        userProgressId: userProgress.id,
        conceptId: params.conceptId,
        ...updateData,
      },
    });
  }

  // Save question answers if provided
  if (questionAnswers && Array.isArray(questionAnswers)) {
    for (const answer of questionAnswers) {
      await prisma.questionAnswer.upsert({
        where: {
          conceptProgressId_questionId: {
            conceptProgressId: conceptProgress.id,
            questionId: answer.questionId,
          },
        },
        update: {
          answer: answer.answer,
          isCorrect: answer.isCorrect,
        },
        create: {
          conceptProgressId: conceptProgress.id,
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect: answer.isCorrect,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
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

  // Find user progress
  const userProgress = await prisma.userProgress.findFirst({
    where: {
      oderId: userId,
      bookId: params.id,
    },
  });

  if (!userProgress) {
    return NextResponse.json({ success: true });
  }

  // Find and delete concept progress
  const conceptProgress = await prisma.conceptProgress.findFirst({
    where: {
      userProgressId: userProgress.id,
      conceptId: params.conceptId,
    },
  });

  if (conceptProgress) {
    // Delete question answers first (due to foreign key)
    await prisma.questionAnswer.deleteMany({
      where: { conceptProgressId: conceptProgress.id },
    });

    // Delete concept progress
    await prisma.conceptProgress.delete({
      where: { id: conceptProgress.id },
    });
  }

  return NextResponse.json({ success: true });
}
