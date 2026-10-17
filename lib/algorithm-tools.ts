import { z } from "zod";
import {
  bridgePassages,
  communities,
  components,
  overlapPairs,
  rankCitations,
  rankClaims,
  shortestPassagePath,
  traceFromClaim,
} from "@/lib/algorithms";
import { clusterSchema, defineTool, emptyInput, scoredNodeSchema } from "@/lib/tool-types";

export const algorithmTools = [
  defineTool({
    name: "pagerank_claims",
    description:
      "Rank claims by influence in the citation graph (FalkorDB algo.pageRank). High scores mark the most load-bearing claims.",
    input: emptyInput,
    output: z.object({ ranking: z.array(scoredNodeSchema) }),
    run: async (_input, ctx) => ({ ranking: await rankClaims(ctx.docId) }),
  }),
  defineTool({
    name: "pagerank_citations",
    description:
      "Rank references by influence using FalkorDB algo.pageRank over CITES. Reveals the most load-bearing citations.",
    input: emptyInput,
    output: z.object({ ranking: z.array(scoredNodeSchema) }),
    run: async (_input, ctx) => ({ ranking: await rankCitations(ctx.docId) }),
  }),
  defineTool({
    name: "bridge_passages",
    description:
      "Find connector passages with FalkorDB algo.betweenness over SIMILAR_TO. Bridges tie unrelated parts of the paper together.",
    input: emptyInput,
    output: z.object({ bridges: z.array(scoredNodeSchema) }),
    run: async (_input, ctx) => ({ bridges: await bridgePassages(ctx.docId) }),
  }),
  defineTool({
    name: "overlap_clusters",
    description:
      "Cluster near-duplicate passages with FalkorDB algo.wcc and algo.labelPropagation over SIMILAR_TO. Detects recycled text.",
    input: emptyInput,
    output: z.object({
      components: z.array(clusterSchema),
      communities: z.array(clusterSchema),
    }),
    run: async (_input, ctx) => ({
      components: await components(ctx.docId),
      communities: await communities(ctx.docId),
    }),
  }),
  defineTool({
    name: "overlap_pairs",
    description:
      "List the strongest passage-to-passage overlap pairs with their similarity score.",
    input: emptyInput,
    output: z.object({
      pairs: z.array(z.object({ from: z.string(), to: z.string(), score: z.number() })),
    }),
    run: async (_input, ctx) => ({ pairs: await overlapPairs(ctx.docId) }),
  }),
  defineTool({
    name: "trace_claim",
    description:
      "Breadth-first trace (FalkorDB algo.bfs) from a claim matching the seed text through its evidence and citation neighbourhood.",
    input: z.object({
      seed: z.string().min(2),
      depth: z.number().int().min(1).max(4).default(2),
    }),
    output: z.object({ nodes: z.array(z.string()) }),
    run: async (input, ctx) => ({
      nodes: await traceFromClaim(ctx.docId, input.seed, input.depth),
    }),
  }),
  defineTool({
    name: "passage_path",
    description:
      "Shortest weighted path between two passages by pid (FalkorDB algo.SPpaths), explaining how two passages relate.",
    input: z.object({ from: z.number().int().min(0), to: z.number().int().min(0) }),
    output: z.object({ path: z.array(z.string()).nullable(), weight: z.number() }),
    run: async (input, ctx) => {
      const result = await shortestPassagePath(ctx.docId, input.from, input.to);
      return { path: result ? result.nodes : null, weight: result ? result.weight : 0 };
    },
  }),
];
