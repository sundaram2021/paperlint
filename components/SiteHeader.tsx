import Link from "next/link";
import { Logo } from "@/components/brand";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/#checks", label: "What we check" },
  { href: "/#approach", label: "Our approach" },
];

export function SiteNav({ className = "" }: { className?: string }) {
  return (
    <nav className={`items-center gap-8 text-sm text-muted ${className}`}>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="transition-colors hover:text-ink">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-line">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between border-x border-line px-6">
        <Logo />
        <SiteNav className="hidden md:flex" />
        <Link
          href="/chat"
          className="rounded-full bg-navy px-5 py-2 text-sm text-paper transition-colors hover:bg-navy-soft"
        >
          Create review
        </Link>
      </div>
    </header>
  );
}
