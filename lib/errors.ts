export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

const DEFAULT_FALLBACK = "Something went wrong on our side. Please try again in a moment.";

export function friendlyError(
  error: unknown,
  fallback: string = DEFAULT_FALLBACK,
  scope = "app",
): string {
  if (error instanceof UserError) return error.message;
  console.error(`[paperlint:${scope}]`, error);
  return fallback;
}
