"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, FileText, UploadIcon } from "lucide-react";
import type { DocMeta } from "@/components/review/types";

interface Props {
  meta: DocMeta | null;
  error: string | null;
  onFile: (file: File) => void;
  onStart: () => void;
  onRemove: () => void;
  uploading: boolean;
}

export function UploadScreen({ meta, error, onFile, onStart, onRemove, uploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <p className="kicker">Paper review / ai</p>
      <h1 className="mt-3 font-display text-3xl tracking-tight text-ink">
        Let&apos;s inspect your paper.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">
        Upload a PDF or DOCX to start an evidence-backed review. You can ask the agent anything about
        the findings once it is ready.
      </p>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {meta ? (
        <div className="mt-10 rounded-2xl border border-line bg-paper p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-paper-soft">
              <FileText className="h-4 w-4 text-ink" strokeWidth={1.6} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{meta.fileName}</p>
              <p className="text-xs text-muted">Ready for review</p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Remove
            </button>
          </div>
          <button
            type="button"
            onClick={onStart}
            disabled={uploading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm text-paper transition-colors hover:bg-navy-soft disabled:opacity-60"
          >
            Start analysing
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.6} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            pick(event.dataTransfer.files);
          }}
          className={`mt-10 flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center transition-colors ${
            dragging ? "border-navy bg-paper-soft" : "border-line bg-paper"
          }`}
        >
          <span className="grid h-10 w-10 place-items-center rounded-full border border-line bg-paper-soft">
            <UploadIcon className="h-4 w-4 text-ink" strokeWidth={1.6} />
          </span>
          <span className="text-sm font-medium text-ink">
            {uploading ? "Parsing your paper..." : "Drop your research paper here"}
          </span>
          <span className="text-xs text-muted">or click to browse - PDF or DOCX up to 50 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => pick(event.target.files)}
      />
    </div>
  );
}
