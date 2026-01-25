import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; conceptId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const messages = await prisma.chatMessage.findMany({
    where: {
      oderId: userId,
      conceptId: params.conceptId,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });
}

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
  const { message, phase, relatedHighlight } = body;

  // Get concept and book info
  const concept = await prisma.concept.findFirst({
    where: {
      id: params.conceptId,
      bookId: params.id,
      book: { userId },
    },
    include: {
      book: true,
    },
  });

  if (!concept) {
    return NextResponse.json({ error: "Concept not found" }, { status: 404 });
  }

  // Get previous messages for context
  const previousMessages = await prisma.chatMessage.findMany({
    where: {
      oderId: userId,
      conceptId: params.conceptId,
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  // Build system prompt based on phase
  let systemPrompt = `You are a helpful tutor assisting with learning "${concept.title}" from "${concept.book.title}".

The concept content is:
${concept.content.slice(0, 3000)}

Be concise and friendly. Keep responses short (2-3 paragraphs max).`;

  if (phase === "test") {
    systemPrompt += `

IMPORTANT: The user is currently being tested. Do NOT give direct answers. Instead:
- Ask guiding questions
- Give hints that lead them to think
- Help them reason through the problem
- Break down the problem into smaller parts`;
  }

  // Build messages for Claude
  const claudeMessages: { role: "user" | "assistant"; content: string }[] = [];

  for (const msg of previousMessages) {
    claudeMessages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  claudeMessages.push({
    role: "user",
    content: relatedHighlight
      ? `About this text: "${relatedHighlight}"\n\n${message}`
      : message,
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const assistantMessage =
      response.content[0].type === "text"
        ? response.content[0].text
        : "I couldn't generate a response.";

    // Save messages to database
    await prisma.chatMessage.create({
      data: {
        oderId: userId,
        conceptId: params.conceptId,
        role: "user",
        content: message,
        phase,
        relatedHighlight,
      },
    });

    await prisma.chatMessage.create({
      data: {
        oderId: userId,
        conceptId: params.conceptId,
        role: "assistant",
        content: assistantMessage,
        phase,
      },
    });

    return NextResponse.json({ response: assistantMessage });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
