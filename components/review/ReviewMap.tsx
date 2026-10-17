import { Check, Circle, Loader2 } from "lucide-react";
import type { ReviewStep } from "@/components/review/types";

export function ReviewMap({ steps }: { steps: ReviewStep[] }) {
  return (
    <div>
      <p className="kicker">Review map</p>
      <ul className="mt-5 space-y-4">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-3">
            <span className="grid h-4 w-4 place-items-center">
              {step.status === "done" ? (
                <Check className="h-4 w-4 text-moss" strokeWidth={2} />
              ) : step.status === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin text-lav" strokeWidth={2} />
              ) : (
                <Circle className="h-3.5 w-3.5 text-line" strokeWidth={1.5} />
              )}
            </span>
            <span
              className={step.status === "idle" ? "text-sm text-muted" : "text-sm text-ink"}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
