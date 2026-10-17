"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { readSse, type StreamEvent } from "@/components/review/stream";
import { activity, type ChatMessage, type DocMeta, type ReviewPhase } from "@/components/review/types";

type Phase = ReviewPhase | "idle" | "ready" | "analyzing";

export function useReview() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [meta, setMeta] = useState<DocMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const flags = useRef({ output: false, analysis: false });

  const inWorkspace = phase !== "idle" && phase !== "ready";
  const analyzing = ["analyzing", "indexed", "claims_extracted", "evidence_review"].includes(phase);

  useEffect(() => {
    if (!meta) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [meta]);

  const push = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const fail = useCallback(
    (message: string) => {
      setError(message);
      push({ role: "assistant", content: message });
    },
    [push],
  );

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = (await res.json().catch(() => null)) as
        | (DocMeta & { error?: string })
        | null;
      if (!res.ok || !data?.docId) {
        throw new Error(data?.error || "Upload failed. Please try a different file.");
      }
      setMeta(data);
      setPhase("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleEvent = useCallback(
    (event: StreamEvent) => {
      if (event.type === "phase") {
        setPhase(event.phase);
        if (event.message) push(activity(event.message));
      } else if (event.type === "activity") {
        push(activity(event.label, event.detail));
      } else if (event.type === "report") {
        flags.current.output = true;
        push({ role: "assistant", content: event.markdown, isReport: true });
      } else if (event.type === "message") {
        flags.current.output = true;
        push({ role: "assistant", content: event.content });
      } else if (event.type === "error") {
        flags.current.output = true;
        if (flags.current.analysis) setPhase("error");
        fail(event.message);
      }
    },
    [push, fail],
  );

  const startAnalysis = async () => {
    if (!meta) return;
    setError(null);
    setMessages([]);
    setPhase("analyzing");
    flags.current = { output: false, analysis: true };
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: meta.docId, title: meta.title }),
      });
      await readSse(res, handleEvent);
      if (!flags.current.output) {
        setPhase("error");
        fail("The review did not return a report. Please try again.");
      }
    } catch (caught) {
      fail(caught instanceof Error ? caught.message : "Analysis failed. Please try again.");
      if (!flags.current.output) setPhase("error");
    } finally {
      flags.current.analysis = false;
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !meta) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    flags.current = { output: false, analysis: false };
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: meta.docId,
          messages: next
            .filter((message) => message.role !== "activity")
            .map((message) => ({ role: message.role, content: message.content })),
        }),
      });
      await readSse(res, handleEvent);
      if (!flags.current.output) fail("The assistant did not reply. Please try again.");
    } catch (caught) {
      fail(caught instanceof Error ? caught.message : "Chat failed. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const downloadReport = () => {
    if (!meta) return;
    const anchor = document.createElement("a");
    anchor.href = `/api/report/${meta.docId}`;
    anchor.download = `paperlint-${meta.docId}.md`;
    anchor.click();
  };

  const requestExit = () => {
    if (meta && inWorkspace) setExitOpen(true);
    else router.push("/");
  };

  const deleteAndExit = async () => {
    if (!meta) return;
    setDeleting(true);
    try {
      await fetch(`/api/graph/${meta.docId}`, { method: "DELETE" });
    } catch {
      // ignore: the graph will expire with the session regardless
    } finally {
      router.push("/");
    }
  };

  const removeFile = () => {
    setMeta(null);
    setPhase("idle");
  };

  return {
    phase,
    meta,
    error,
    uploading,
    messages,
    input,
    setInput,
    sending,
    exitOpen,
    setExitOpen,
    deleting,
    inWorkspace,
    analyzing,
    handleFile,
    startAnalysis,
    send,
    downloadReport,
    requestExit,
    deleteAndExit,
    removeFile,
  };
}
