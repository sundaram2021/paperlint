"use client";

import { useState } from "react";
import { Check, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ReportView({ docId, markdown }: { docId: string; markdown: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
        <p className="kicker">Review report</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-ink transition-colors hover:bg-paper-soft"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-moss" strokeWidth={1.8} />
            ) : null}
            {copied ? "Copied" : "Copy"}
          </button>
          <a
            href={`/api/report/${docId}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-xs text-paper transition-colors hover:bg-navy-soft"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
            Download
          </a>
        </div>
      </div>
      <div className="markdown text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}
