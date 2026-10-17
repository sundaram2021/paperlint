import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-navy">
        <span className="h-2 w-2 rounded-full bg-moss" />
      </span>
      <span className="font-display text-lg tracking-tight text-ink">PaperLint</span>
    </Link>
  );
}

export function SectionKicker({ children }: { children: React.ReactNode }) {
  return <p className="kicker">{children}</p>;
}
