"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="kicker">PaperLint</p>
      <h1 className="font-display text-3xl text-ink">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted">
        The page hit an unexpected problem. You can try again, or head back home.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-navy px-5 py-2 text-sm text-paper transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-line px-5 py-2 text-sm text-ink transition-colors hover:bg-paper-soft"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
