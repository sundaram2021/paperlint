import type { ReviewPhase } from "@/components/review/types";

export type StreamEvent =
  | { type: "phase"; phase: ReviewPhase; message?: string }
  | { type: "activity"; label: string; detail?: string }
  | { type: "report"; markdown: string }
  | { type: "message"; content: string }
  | { type: "error"; message: string };

export async function readSse(
  res: Response,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  if (!res.ok) {
    let message = "The request could not be completed. Please try again.";
    const data = await res.json().catch(() => null);
    if (data && typeof data.error === "string" && data.error.trim()) message = data.error;
    throw new Error(message);
  }
  if (!res.body) throw new Error("The server closed the connection unexpectedly.");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      try {
        onEvent(JSON.parse(line.slice(5).trim()) as StreamEvent);
      } catch {
        // ignore malformed frames
      }
    }
  }
}
