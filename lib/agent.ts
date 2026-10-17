import type Anthropic from "@anthropic-ai/sdk";
import { createMessage, getModel } from "@/lib/anthropic";
import { UserError } from "@/lib/errors";
import { getDocumentText, getReport, indexExtraction } from "@/lib/graph";
import { ANALYSIS_SYSTEM, CHAT_SYSTEM, EXTRACTION_SYSTEM } from "@/lib/prompts";
import { extractionSchema, type Extraction, type StreamEvent } from "@/lib/schemas";
import { anthropicTools, executeTool, toInputSchema, type ToolContext } from "@/lib/tools";

const MAX_CHARS = 80_000;
const MAX_TOKENS = 8000;
const MAX_HISTORY_MESSAGES = 16;
const MAX_HISTORY_CHARS = 24_000;

export type Emit = (event: StreamEvent) => void;

const TOOL_LABELS: Record<string, string> = {
  pagerank_claims: "Ranking claims by influence (PageRank)",
  pagerank_citations: "Ranking references by influence (PageRank)",
  bridge_passages: "Finding bridge passages (Betweenness)",
  overlap_clusters: "Clustering recycled text (WCC + Label Propagation)",
  overlap_pairs: "Measuring passage-to-passage overlap",
  trace_claim: "Tracing a claim through its evidence (BFS)",
  passage_path: "Resolving the shortest path between passages",
  statistics: "Reading the extracted statistics",
  query_graph: "Running a read-only graph query",
  record_finding: "Recording a finding",
  compile_report: "Compiling the final report",
};

function detailOf(name: string, input: unknown): string | undefined {
  if (!input || typeof input !== "object") return undefined;
  const record = input as Record<string, unknown>;
  if (name === "query_graph" && typeof record.cypher === "string") {
    return record.cypher.slice(0, 140);
  }
  if (name === "record_finding" && typeof record.title === "string") return record.title;
  if (name === "trace_claim" && typeof record.seed === "string") return record.seed.slice(0, 100);
  if (name === "passage_path") return `pid ${record.from} -> pid ${record.to}`;
  return undefined;
}

function extractionTool() {
  return {
    name: "submit_extraction",
    description: "Submit the structured extraction of the research paper.",
    input_schema: toInputSchema(extractionSchema) as { type: "object" },
  };
}

async function extractDocument(text: string, title: string): Promise<Extraction> {
  const response = await createMessage({
    model: getModel(),
    max_tokens: MAX_TOKENS,
    system: EXTRACTION_SYSTEM,
    tool_choice: { type: "tool", name: "submit_extraction" },
    tools: [extractionTool()],
    messages: [
      {
        role: "user",
        content: `Title: ${title}\n\nDocument text:\n${text.slice(0, MAX_CHARS)}`,
      },
    ],
  });
  const block = response.content.find((item) => item.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("The extraction agent did not return structured output.");
  }
  const parsed = extractionSchema.safeParse(block.input);
  if (!parsed.success) {
    throw new Error(`Extraction failed validation: ${parsed.error.message}`);
  }
  return parsed.data;
}

function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

async function runLoop(
  system: string,
  messages: Anthropic.MessageParam[],
  ctx: ToolContext,
  maxSteps: number,
  emit: Emit,
): Promise<string> {
  const convo: Anthropic.MessageParam[] = [...messages];
  const tools = anthropicTools();
  let lastText = "";

  for (let step = 0; step < maxSteps; step += 1) {
    const response = await createMessage({
      model: getModel(),
      max_tokens: MAX_TOKENS,
      system,
      tools,
      messages: convo,
    });
    convo.push({ role: "assistant", content: response.content });
    lastText = textOf(response.content) || lastText;

    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    if (!toolUses.length) return lastText;

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      emit({
        type: "activity",
        label: TOOL_LABELS[toolUse.name] ?? `Calling ${toolUse.name}`,
        detail: detailOf(toolUse.name, toolUse.input),
      });
      const { output, isError } = await executeTool(toolUse.name, toolUse.input, ctx);
      emit({
        type: "activity",
        label: isError ? `${toolUse.name} failed` : `${toolUse.name} complete`,
      });
      results.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(output),
        is_error: isError,
      });
    }
    convo.push({ role: "user", content: results });
  }
  return lastText;
}

export async function runAnalysis(docId: string, title: string, emit: Emit): Promise<string> {
  const text = await getDocumentText(docId);
  if (!text) {
    throw new UserError("This review session has expired. Please upload the paper again.");
  }

  emit({ type: "phase", phase: "indexed", message: "Document parsed and stored." });
  const extraction = await extractDocument(text, title);
  const stats = await indexExtraction(docId, extraction);
  emit({
    type: "phase",
    phase: "claims_extracted",
    message: `${extraction.sections.length} sections, ${extraction.claims.length} claims, ${extraction.statistics.length} statistics, ${stats.edges} overlaps.`,
  });

  emit({ type: "phase", phase: "evidence_review", message: "Running graph algorithms." });
  const ctx: ToolContext = { docId };
  const narrative = await runLoop(
    ANALYSIS_SYSTEM,
    [
      {
        role: "user",
        content: `Review the paper "${extraction.title}". Sections: ${extraction.sections
          .map((section) => section.name)
          .join(", ")}. Run the algorithms, record findings, then compile the report.`,
      },
    ],
    ctx,
    14,
    emit,
  );

  const compiled = await getReport(docId);
  const finalReport = compiled ?? narrative;
  emit({ type: "phase", phase: "complete", message: "Review complete." });
  emit({ type: "report", markdown: finalReport });
  return finalReport;
}

function trimHistory(
  messages: { role: "user" | "assistant"; content: string }[],
): Anthropic.MessageParam[] {
  let recent = messages.slice(-MAX_HISTORY_MESSAGES);
  while (recent.length && recent[0].role !== "user") recent = recent.slice(1);
  if (!recent.length) recent = messages.slice(-1);
  return recent.map((message) => ({
    role: message.role,
    content: message.content.slice(0, MAX_HISTORY_CHARS),
  })) as Anthropic.MessageParam[];
}

export async function runChat(
  docId: string,
  messages: { role: "user" | "assistant"; content: string }[],
  emit: Emit,
): Promise<string> {
  const ctx: ToolContext = { docId };
  const reply = await runLoop(CHAT_SYSTEM, trimHistory(messages), ctx, 6, emit);
  const answer = reply || "I could not produce an answer to that. Please try rephrasing.";
  emit({ type: "message", content: answer });
  return answer;
}
