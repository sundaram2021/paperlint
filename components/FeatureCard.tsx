import type { LucideIcon } from "lucide-react";

export function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-8 rounded-xl border border-line bg-paper p-5">
      <Icon className="h-4 w-4 text-ink" strokeWidth={1.6} />
      <div className="space-y-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </div>
  );
}
