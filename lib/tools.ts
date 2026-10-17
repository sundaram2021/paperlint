import { algorithmTools } from "@/lib/algorithm-tools";
import { documentTools } from "@/lib/document-tools";
import { toInputSchema, type RegisteredTool, type ToolContext } from "@/lib/tool-types";

export { toInputSchema } from "@/lib/tool-types";
export type { ToolContext } from "@/lib/tool-types";

export const tools: RegisteredTool[] = [...algorithmTools, ...documentTools];

export function getTool(name: string): RegisteredTool | undefined {
  return tools.find((tool) => tool.name === name);
}

export function anthropicTools() {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: toInputSchema(tool.input) as { type: "object" },
  }));
}

export async function executeTool(
  name: string,
  rawInput: unknown,
  ctx: ToolContext,
): Promise<{ output: unknown; isError: boolean }> {
  const tool = getTool(name);
  if (!tool) return { output: `Unknown tool: ${name}`, isError: true };
  const parsedInput = tool.input.safeParse(rawInput ?? {});
  if (!parsedInput.success) {
    return { output: `Invalid input for ${name}: ${parsedInput.error.message}`, isError: true };
  }
  try {
    const result = await tool.run(parsedInput.data, ctx);
    const parsedOutput = tool.output.safeParse(result);
    if (!parsedOutput.success) {
      return { output: `Invalid tool output for ${name}`, isError: true };
    }
    return { output: parsedOutput.data, isError: false };
  } catch (error) {
    return {
      output: error instanceof Error ? error.message : `Tool ${name} failed`,
      isError: true,
    };
  }
}
