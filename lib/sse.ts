import { friendlyError } from "@/lib/errors";
import { streamEventSchema, type StreamEvent } from "@/lib/schemas";

const HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

export function createEventStream(
  run: (emit: (event: StreamEvent) => void) => Promise<void>,
  fallback: string,
  scope: string,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const emit = (event: StreamEvent) => {
        if (closed) return;
        const safe = streamEventSchema.safeParse(event);
        if (!safe.success) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(safe.data)}\n\n`));
        } catch {
          closed = true;
        }
      };
      try {
        await run(emit);
      } catch (error) {
        emit({ type: "error", message: friendlyError(error, fallback, scope) });
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          // stream already closed
        }
      }
    },
  });
  return new Response(stream, { headers: HEADERS });
}
