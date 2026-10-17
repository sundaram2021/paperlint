import { friendlyError } from "@/lib/errors";
import { dropGraph } from "@/lib/falkordb";
import { docIdSchema } from "@/lib/schemas";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/graph/[docId]">,
) {
  const { docId } = await ctx.params;
  const parsed = docIdSchema.safeParse(docId);
  if (!parsed.success) {
    return Response.json({ error: "Invalid document id." }, { status: 400 });
  }
  try {
    await dropGraph(parsed.data);
    return Response.json({ deleted: true });
  } catch (error) {
    const message = friendlyError(error, "Cleanup failed. Please try again.", "graph");
    return Response.json({ error: message }, { status: 500 });
  }
}
