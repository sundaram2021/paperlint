import { z } from "zod";

export const docIdSchema = z
  .string()
  .min(6)
  .max(64)
  .regex(/^[a-zA-Z0-9-]+$/, "Invalid document id");

export const extractionSchema = z.object({
  title: z.string().min(1),
  sections: z
    .array(z.object({ name: z.string().min(1), text: z.string().min(1) }))
    .min(1),
  claims: z
    .array(
      z.object({
        text: z.string().min(1),
        section: z.string().min(1),
        type: z.enum(["hypothesis", "finding", "method", "background"]),
      }),
    )
    .default([]),
  statistics: z
    .array(z.object({ text: z.string().min(1), section: z.string().min(1) }))
    .default([]),
  citations: z
    .array(z.object({ text: z.string().min(1), section: z.string().min(1) }))
    .default([]),
});

export type Extraction = z.infer<typeof extractionSchema>;

export const analyzeRequestSchema = z.object({
  docId: docIdSchema,
  title: z.string().min(1).optional(),
});

export const chatRequestSchema = z.object({
  docId: docIdSchema,
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const uploadResponseSchema = z.object({
  docId: z.string(),
  fileName: z.string(),
  title: z.string(),
  pages: z.number(),
  characters: z.number(),
});

export const reportResponseSchema = z.object({
  docId: z.string(),
  markdown: z.string(),
});

export const reviewPhaseSchema = z.enum([
  "indexed",
  "claims_extracted",
  "evidence_review",
  "complete",
]);

export type ReviewPhase = z.infer<typeof reviewPhaseSchema>;

export const streamEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("phase"),
    phase: reviewPhaseSchema,
    message: z.string().optional(),
  }),
  z.object({
    type: z.literal("activity"),
    label: z.string(),
    detail: z.string().optional(),
  }),
  z.object({ type: z.literal("report"), markdown: z.string() }),
  z.object({ type: z.literal("message"), content: z.string() }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

export type StreamEvent = z.infer<typeof streamEventSchema>;
