import type { Metadata } from "next";
import { ReviewWorkspace } from "@/components/review/ReviewWorkspace";

export const metadata: Metadata = {
  title: "PaperLint - Review workspace",
  description: "Upload a research paper and review it with the PaperLint agent.",
};

export default function ChatPage() {
  return <ReviewWorkspace />;
}
