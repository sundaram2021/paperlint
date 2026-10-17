import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@/lib/env";

let cached: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (cached) return cached;
  const env = getEnv();
  cached = new Anthropic({
    apiKey: env.AI_API_KEY,
    baseURL: env.ANTHROPIC_BASE_URL ? env.ANTHROPIC_BASE_URL : undefined,
    maxRetries: 0,
  });
  return cached;
}

export function getModel(): string {
  return getEnv().AI_MODEL_NAME;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof Anthropic.APIConnectionError) return true;
  if (error instanceof Anthropic.APIError) {
    const status = error.status ?? 0;
    return status === 408 || status === 409 || status === 429 || status >= 500;
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createMessage(
  params: Anthropic.MessageCreateParamsNonStreaming,
  attempts = 3,
): Promise<Anthropic.Message> {
  const client = getAnthropic();
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await client.messages.create(params);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === attempts - 1) throw error;
      await delay(500 * 2 ** attempt + Math.random() * 250);
    }
  }
  throw lastError;
}
