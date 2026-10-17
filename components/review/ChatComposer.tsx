"use client";

import { Paperclip, Send } from "lucide-react";

export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled,
  loading,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
      className="flex items-center gap-3 border-t border-line px-4 py-3"
    >
      <Paperclip className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.6} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder="Ask PaperLint about this paper..."
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || loading || value.trim().length === 0}
        className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm text-paper transition-colors hover:bg-navy-soft disabled:opacity-50"
      >
        Send
        <Send className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
    </form>
  );
}
