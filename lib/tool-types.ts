import { z } from "zod";

export const scoredNodeSchema = z.object({ label: z.string(), score: z.number() });

export const clusterSchema = z.object({
  id: z.string(),
  size: z.number(),
  passages: z.array(z.string()),
});

export const severitySchema = z.enum(["low", "medium", "high"]);

export const categorySchema = z.enum([
  "overlap",
  "statistic",
  "contradiction",
  "citation",
  "structure",
]);

export const emptyInput = z.object({});

export const readOnlyForbidden =
  /\b(create|merge|delete|detach|set|remove|drop|load|foreach|apoc)\b/i;

export interface ToolContext {
  docId: string;
}

export interface ToolShape<I extends z.ZodType, O extends z.ZodType> {
  name: string;
  description: string;
  input: I;
  output: O;
  run(input: z.infer<I>, ctx: ToolContext): Promise<z.infer<O>>;
}

export interface RegisteredTool {
  name: string;
  description: string;
  input: z.ZodType;
  output: z.ZodType;
  run(input: unknown, ctx: ToolContext): Promise<unknown>;
}

export function defineTool<I extends z.ZodType, O extends z.ZodType>(
  tool: ToolShape<I, O>,
): ToolShape<I, O> {
  return tool;
}

export function toInputSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { io: "input" }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}
