"use client";

import { Download } from "lucide-react";

export function ExitDialog({
  open,
  busy,
  onCancel,
  onDownload,
  onDelete,
}: {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-6">
        <p className="kicker">Leave review</p>
        <h2 className="mt-2 font-display text-xl text-ink">Your review data will be deleted.</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          This paper and its findings live only in this session. Download the report first if you
          want to keep it - leaving now permanently deletes the document graph.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-paper-soft disabled:opacity-50"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-paper-soft disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
            Download report
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="rounded-full bg-navy px-4 py-2 text-sm text-paper transition-colors hover:bg-navy-soft disabled:opacity-50"
          >
            Delete and exit
          </button>
        </div>
      </div>
    </div>
  );
}
