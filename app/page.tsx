import Link from "next/link";
import { BarChart3, GitCompare, Link2, Shuffle } from "lucide-react";
import { SectionKicker } from "@/components/brand";
import { FeatureCard } from "@/components/FeatureCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const features = [
  {
    icon: Shuffle,
    title: "Test overlap",
    description: "Flags near-duplicate statements",
  },
  {
    icon: BarChart3,
    title: "Statistical consistency",
    description: "Checks against known baselines",
  },
  {
    icon: GitCompare,
    title: "Contradictions",
    description: "Conflicting claims in one paper",
  },
  {
    icon: Link2,
    title: "Citations & structure",
    description: "Missing, mismatched or orphaned",
  },
];

const steps = [
  {
    n: "01",
    title: "Algorithms find the conditions",
    body: "We analyse your paper's structure, compositional statistics and overlap signals with FalkorDB graph algorithms.",
  },
  {
    n: "02",
    title: "AI adds the context",
    body: "Our agent adds the surrounding evidence and reasoning, so you can see exactly what does not add up.",
  },
  {
    n: "03",
    title: "You stay in control",
    body: "Every finding is yours to review, edit or dismiss. PaperLint never issues a final verdict on your work.",
  },
];

const promises = ["Confidential by design", "Evidence-backed findings", "No account required"];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-line">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-48 right-[-120px] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(140,155,232,0.28),rgba(226,180,200,0.14)_45%,transparent_72%)] blur-2xl"
          />
          <div className="relative mx-auto max-w-6xl border-x border-line px-6 pb-16 pt-20">
            <span className="kicker inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1">
              #1 for research paper integrity
            </span>
            <h1 className="mt-8 max-w-3xl font-display text-5xl leading-[1.04] tracking-tight text-ink sm:text-6xl">
              Find the weak <span className="italic text-lav">signals</span> before reviewers do.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted">
              PaperLint reads your research paper for anomalies, contradictions and red flags - then
              shows you exactly what to fix.
            </p>
            <Link
              href="/chat"
              className="mt-8 inline-flex rounded-full bg-navy px-6 py-3 text-sm text-paper transition-colors hover:bg-navy-soft"
            >
              Upload your paper
            </Link>

            <div id="checks" className="mt-20 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-16 border-x border-line px-6 py-20 lg:grid-cols-2">
            <div>
              <SectionKicker>a second pair of eyes</SectionKicker>
              <h2 className="mt-4 max-w-sm font-display text-4xl leading-tight tracking-tight text-ink">
                Rigor, without the verdict.
              </h2>
            </div>
            <div className="divide-y divide-line border-t border-line">
              {steps.map((step) => (
                <div key={step.n} className="grid grid-cols-[3rem_1fr] gap-4 py-6">
                  <span className="kicker pt-1">{step.n}</span>
                  <div>
                    <p className="text-sm font-medium text-ink">{step.title}</p>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="approach" className="border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-10 border-x border-line px-6 py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionKicker>built for careful work</SectionKicker>
              <h2 className="mt-4 max-w-sm font-display text-4xl leading-tight tracking-tight text-ink">
                Your manuscript stays yours.
              </h2>
            </div>
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {promises.map((promise) => (
                  <span
                    key={promise}
                    className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-muted"
                  >
                    {promise}
                  </span>
                ))}
              </div>
              <Link
                href="/chat"
                className="inline-flex rounded-full border border-line px-5 py-2 text-sm text-ink transition-colors hover:bg-paper-soft"
              >
                Read our privacy
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
