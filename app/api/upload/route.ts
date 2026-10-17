import { UserError, friendlyError } from "@/lib/errors";
import { createDocument } from "@/lib/graph";
import { parseFile } from "@/lib/parse";
import { uploadResponseSchema } from "@/lib/schemas";

export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: "That file is larger than the 25 MB limit." }, { status: 400 });
    }
    const parsed = await parseFile(file);
    const docId = crypto.randomUUID();
    await createDocument({
      docId,
      title: parsed.title,
      fileName: parsed.fileName,
      text: parsed.text,
      pages: parsed.pages,
    });
    const payload = uploadResponseSchema.parse({
      docId,
      fileName: parsed.fileName,
      title: parsed.title,
      pages: parsed.pages,
      characters: parsed.characters,
    });
    return Response.json(payload);
  } catch (error) {
    const message = friendlyError(
      error,
      "Upload failed. Please try a different PDF or DOCX file.",
      "upload",
    );
    const status = error instanceof UserError ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
