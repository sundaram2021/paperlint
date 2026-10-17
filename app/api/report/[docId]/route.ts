import { friendlyError } from "@/lib/errors";
import { getReport } from "@/lib/graph";
import { docIdSchema } from "@/lib/schemas";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/report/[docId]">,
) {
  const { docId } = await ctx.params;
  const parsed = docIdSchema.safeParse(docId);
  if (!parsed.success) {
    return new Response("Invalid document id.", { status: 400 });
  }
  let report: string | null = null;
  try {
    report = await getReport(parsed.data);
  } catch (error) {
    const message = friendlyError(error, "Could not load the report.", "report");
    return new Response(message, { status: 500 });
  }
  if (!report) {
    return new Response("The report is not ready yet.", { status: 404 });
  }
  return new Response(report, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="paperlint-${parsed.data}.md"`,
    },
  });
}
