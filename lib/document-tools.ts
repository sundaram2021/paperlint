import { z } from "zod";
import { statisticsDigest } from "@/lib/algorithms";
import { runCypher } from "@/lib/falkordb";
import { saveReport } from "@/lib/graph";
import {
  categorySchema,
  defineTool,
  emptyInput,
  readOnlyForbidden,
  severitySchema,
} from "@/lib/tool-types";

export const documentTools = [
  defineTool({
    name: "statistics",
    description:
      "Dump every extracted numeric statistic tagged with its section for consistency review.",
    input: emptyInput,
    output: z.object({ items: z.array(z.string()) }),
    run: async (_input, ctx) => ({ items: await statisticsDigest(ctx.docId) }),
  }),
  defineTool({
    name: "query_graph",
    description:
      "Run a read-only OpenCypher query against the document graph. Only MATCH/RETURN/WITH/UNWIND/CALL algo are allowed.",
    input: z.object({ cypher: z.string().min(4) }),
    output: z.object({ rows: z.array(z.record(z.string(), z.unknown())) }),
    run: async (input, ctx) => {
      if (readOnlyForbidden.test(input.cypher)) {
        throw new Error("Only read-only OpenCypher is permitted in query_graph.");
      }
      const rows = await runCypher(ctx.docId, input.cypher);
      return { rows: rows.slice(0, 50) };
    },
  }),
  defineTool({
    name: "record_finding",
    description:
      "Persist a single finding to the graph as a Finding node attached to the document.",
    input: z.object({
      category: categorySchema,
      severity: severitySchema,
      title: z.string().min(3),
      detail: z.string().min(3),
    }),
    output: z.object({ recorded: z.boolean() }),
    run: async (input, ctx) => {
      await runCypher(
        ctx.docId,
        `MATCH (d:Document {docId: $docId})
         CREATE (f:Finding {category: $category, severity: $severity, title: $title, detail: $detail})
         CREATE (d)-[:HAS_FINDING]->(f)`,
        { docId: ctx.docId, ...input },
      );
      return { recorded: true };
    },
  }),
  defineTool({
    name: "compile_report",
    description:
      "Store the final markdown report on the document. Call this once, last, with the complete report in GitHub-flavoured markdown.",
    input: z.object({ markdown: z.string().min(40) }),
    output: z.object({ saved: z.boolean() }),
    run: async (input, ctx) => {
      await saveReport(ctx.docId, input.markdown);
      return { saved: true };
    },
  }),
];
