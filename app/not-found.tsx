import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="kicker">PaperLint</p>
      <h1 className="font-display text-3xl text-ink">Page not found</h1>
      <p className="max-w-md text-sm text-muted">
        The page you were looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded-full bg-navy px-5 py-2 text-sm text-paper transition-opacity hover:opacity-90"
      >
        Back to home
      </Link>
    </main>
  );
}
