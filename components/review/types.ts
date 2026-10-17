export type ReviewPhase =
  | "indexed"
  | "claims_extracted"
  | "evidence_review"
  | "complete"
  | "error";

export interface DocMeta {
  docId: string;
  fileName: string;
  title: string;
  pages: number;
  characters: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "activity";
  content: string;
  detail?: string;
  isReport?: boolean;
}

export function activity(label: string, detail?: string): ChatMessage {
  return { role: "activity", content: label, detail };
}

export type StepStatus = "idle" | "active" | "done";

export interface ReviewStep {
  id: string;
  label: string;
  status: StepStatus;
}

export const STEP_LABELS = [
  "Document indexed",
  "Claims extracted",
  "Evidence review active",
  "Discuss findings",
];

export function stepsForPhase(phase: ReviewPhase | "idle" | "ready" | "analyzing"): ReviewStep[] {
  const progress: Record<string, number> = {
    idle: 0,
    ready: 0,
    analyzing: 0,
    indexed: 1,
    claims_extracted: 2,
    evidence_review: 3,
    complete: 4,
    error: 0,
  };
  const reached = progress[phase] ?? 0;
  const settled = phase === "idle" || phase === "ready" || phase === "error";
  return STEP_LABELS.map((label, index) => {
    if (phase === "complete") return { id: label, label, status: "done" as const };
    if (index < reached) return { id: label, label, status: "done" as const };
    if (index === reached && !settled) {
      return { id: label, label, status: "active" as const };
    }
    return { id: label, label, status: "idle" as const };
  });
}
