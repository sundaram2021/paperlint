import { runAnalysis } from "@/lib/agent";
import { UserError } from "@/lib/errors";
import { getDocumentMeta } from "@/lib/graph";
import { analyzeRequestSchema } from "@/lib/schemas";
import { createEventStream } from "@/lib/sse";

export const maxDuration = 300;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const { docId, title } = parsed.data;

  return createEventStream(
    async (emit) => {
      const meta = await getDocumentMeta(docId);
      if (!meta.text) {
        throw new UserError("This review session has expired. Please upload the paper again.");
      }
      await runAnalysis(docId, title ?? meta.title, emit);
    },
    "The review could not be completed. Please try again.",
    "analyze",
  );
}
