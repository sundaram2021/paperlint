import { runChat } from "@/lib/agent";
import { chatRequestSchema } from "@/lib/schemas";
import { createEventStream } from "@/lib/sse";

export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid chat request." }, { status: 400 });
  }
  const { docId, messages } = parsed.data;

  return createEventStream(
    async (emit) => {
      await runChat(docId, messages, emit);
    },
    "Your message could not be sent. Please try again.",
    "chat",
  );
}
