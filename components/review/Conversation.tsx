"use client";

import { useEffect, useRef } from "react";
import { ChevronRight, Loader2, Terminal, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ReportView } from "@/components/review/ReportView";
import type { ChatMessage } from "@/components/review/types";

type Block = { kind: "activities"; items: ChatMessage[] } | { kind: "message"; message: ChatMessage };

function groupMessages(messages: ChatMessage[]): Block[] {
  const blocks: Block[] = [];
  let buffer: ChatMessage[] = [];
  const flush = () => {
    if (buffer.length) {
      blocks.push({ kind: "activities", items: buffer });
      buffer = [];
    }
  };
  for (const message of messages) {
    if (message.role === "activity") buffer.push(message);
    else {
      flush();
      blocks.push({ kind: "message", message });
    }
  }
  flush();
  return blocks;
}

function ActivityLine({ message }: { message: ChatMessage }) {
  return (
    <div className="flex items-start gap-2 font-mono text-[11px] leading-5 text-muted">
      <Terminal className="mt-0.5 h-3 w-3 shrink-0 text-lav" strokeWidth={1.6} />
      <span className="min-w-0">
        {message.content}
        {message.detail ? <span className="text-ink/50"> - {message.detail}</span> : null}
      </span>
    </div>
  );
}

function LiveReasoning({ items }: { items: ChatMessage[] }) {
  return (
    <div className="rounded-xl border border-line bg-paper-soft/60 px-4 py-3">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        <Loader2 className="h-3 w-3 animate-spin text-lav" strokeWidth={2} />
        Agent reasoning
      </div>
      <div className="mt-3 space-y-1.5">
        {items.map((item, index) => (
          <ActivityLine key={index} message={item} />
        ))}
      </div>
    </div>
  );
}

function CollapsedReasoning({ items }: { items: ChatMessage[] }) {
  return (
    <details className="group rounded-xl border border-line bg-paper-soft/60 px-4 py-2">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" strokeWidth={2} />
        Agent reasoning - {items.length} steps
      </summary>
      <div className="mt-3 space-y-1.5">
        {items.map((item, index) => (
          <ActivityLine key={index} message={item} />
        ))}
      </div>
    </details>
  );
}

export function Conversation({
  docId,
  messages,
  loading,
}: {
  docId: string;
  messages: ChatMessage[];
  loading: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  const blocks = groupMessages(messages);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
      <div className="flex flex-col gap-4">
        {blocks.map((block, index) => {
          if (block.kind === "activities") {
            const isLive = index === blocks.length - 1;
            return isLive ? (
              <LiveReasoning key={index} items={block.items} />
            ) : (
              <CollapsedReasoning key={index} items={block.items} />
            );
          }
          const message = block.message;
          if (message.role === "assistant") {
            return message.isReport ? (
              <ReportView key={index} docId={docId} markdown={message.content} />
            ) : (
              <div
                key={index}
                className="max-w-[92%] rounded-2xl rounded-tl-sm border border-line bg-paper-soft px-4 py-3"
              >
                <div className="markdown text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              </div>
            );
          }
          return (
            <div key={index} className="flex items-start justify-end gap-3">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-navy px-4 py-3 text-sm leading-6 text-paper">
                {message.content}
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-paper">
                <User className="h-4 w-4" strokeWidth={1.8} />
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
