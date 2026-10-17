import { z } from "zod";

const envSchema = z.object({
  AI_API_KEY: z.string().min(1, "AI_API_KEY is required"),
  AI_MODEL_NAME: z.string().min(1, "AI_MODEL_NAME is required"),
  ANTHROPIC_BASE_URL: z.string().url().optional().or(z.literal("")),
  FALKORDB_HOST: z.string().min(1, "FALKORDB_HOST is required"),
  FALKORDB_PORT: z.coerce.number().int().positive().default(6379),
  FALKORDB_USERNAME: z.string().optional().default(""),
  FALKORDB_PASSWORD: z.string().optional().default(""),
  FALKORDB_TLS: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Invalid environment configuration -> ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
