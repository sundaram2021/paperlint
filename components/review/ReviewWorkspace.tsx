"use client";

import { Logo } from "@/components/brand";
import { ChatComposer } from "@/components/review/ChatComposer";
import { Conversation } from "@/components/review/Conversation";
import { ExitDialog } from "@/components/review/ExitDialog";
import { ReviewMap } from "@/components/review/ReviewMap";
import { UploadScreen } from "@/components/review/UploadScreen";
import { stepsForPhase } from "@/components/review/types";
import { useReview } from "@/components/review/useReview";

export function ReviewWorkspace() {
  const review = useReview();

  if (!review.inWorkspace) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center border-x border-line px-6">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-2xl">
            <UploadScreen
              meta={review.meta}
              error={review.error}
              uploading={review.uploading}
              onFile={review.handleFile}
              onStart={review.startAnalysis}
              onRemove={review.removeFile}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <aside className="flex w-64 shrink-0 flex-col border-r border-line px-5 py-6">
          <Logo />
          <p className="mt-2 truncate text-xs text-muted">
            {review.meta?.fileName ?? "Review"}
          </p>
          <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
            <ReviewMap
              steps={stepsForPhase(review.phase === "error" ? "evidence_review" : review.phase)}
            />
          </div>
          <button
            type="button"
            onClick={review.requestExit}
            className="mt-4 rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-paper-soft"
          >
            Exit review
          </button>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="border-b border-line px-8 py-5">
            <p className="kicker">Conversation</p>
            <h1 className="mt-1 font-display text-2xl text-ink">Ask about your paper.</h1>
          </div>

          <Conversation
            docId={review.meta?.docId ?? ""}
            messages={review.messages}
            loading={review.analyzing || review.sending}
          />

          {review.phase === "error" ? (
            <div className="flex items-center justify-between gap-4 border-t border-line bg-paper-soft px-8 py-4">
              <p className="text-sm text-muted">The review stopped before finishing.</p>
              <button
                type="button"
                onClick={review.startAnalysis}
                className="rounded-full bg-navy px-5 py-2 text-sm text-paper transition-opacity hover:opacity-90"
              >
                Retry review
              </button>
            </div>
          ) : (
            <ChatComposer
              value={review.input}
              onChange={review.setInput}
              onSend={review.send}
              disabled={review.phase !== "complete"}
              loading={review.sending}
            />
          )}
        </main>
      </div>

      <ExitDialog
        open={review.exitOpen}
        busy={review.deleting}
        onCancel={() => review.setExitOpen(false)}
        onDownload={review.downloadReport}
        onDelete={review.deleteAndExit}
      />
    </>
  );
}
