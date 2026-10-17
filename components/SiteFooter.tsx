import { Logo } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between border-x border-line px-6 py-8">
        <Logo />
        <p className="text-xs text-muted">2026 PaperLint. For better papers.</p>
      </div>
    </footer>
  );
}
