import { runCypher } from "@/lib/falkordb";

export interface ScoredNode {
  label: string;
  score: number;
}

export interface Cluster {
  id: string;
  size: number;
  passages: string[];
}

export interface OverlapPair {
  from: string;
  to: string;
  score: number;
}

export interface PathStep {
  nodes: string[];
  weight: number;
}

export async function rankClaims(docId: string): Promise<ScoredNode[]> {
  const rows = await runCypher(
    docId,
    `CALL algo.pageRank('Claim', 'CITES') YIELD node, score
     RETURN node.text AS label, score ORDER BY score DESC LIMIT 12`,
  );
  return rows.map((row) => ({
    label: String(row.label ?? ""),
    score: Number(row.score ?? 0),
  }));
}

export async function rankCitations(docId: string): Promise<ScoredNode[]> {
  const rows = await runCypher(
    docId,
    `CALL algo.pageRank('Citation', 'CITES') YIELD node, score
     RETURN node.text AS label, score ORDER BY score DESC LIMIT 12`,
  );
  return rows.map((row) => ({
    label: String(row.label ?? ""),
    score: Number(row.score ?? 0),
  }));
}

export async function bridgePassages(docId: string): Promise<ScoredNode[]> {
  const rows = await runCypher(
    docId,
    `CALL algo.betweenness({nodeLabels: ['Passage'], relationshipTypes: ['SIMILAR_TO'], samplingSeed: 42})
     YIELD node, score
     RETURN node.text AS label, score ORDER BY score DESC LIMIT 10`,
  );
  return rows.map((row) => ({
    label: String(row.label ?? ""),
    score: Number(row.score ?? 0),
  }));
}

function toCluster(row: Record<string, unknown>, key: string): Cluster {
  const members = Array.isArray(row.passages) ? row.passages : [];
  return {
    id: String(row[key] ?? ""),
    size: Number(row.size ?? members.length),
    passages: members.map((item) => String(item)),
  };
}

export async function components(docId: string): Promise<Cluster[]> {
  const rows = await runCypher(
    docId,
    `CALL algo.wcc({nodeLabels: ['Passage'], relationshipTypes: ['SIMILAR_TO']})
     YIELD node, componentId
     WITH componentId, collect(node.text) AS passages, count(*) AS size
     WHERE size > 1
     RETURN componentId, passages, size ORDER BY size DESC LIMIT 10`,
  );
  return rows.map((row) => toCluster(row, "componentId"));
}

export async function communities(docId: string): Promise<Cluster[]> {
  const rows = await runCypher(
    docId,
    `CALL algo.labelPropagation({nodeLabels: ['Passage'], relationshipTypes: ['SIMILAR_TO'], maxIterations: 10})
     YIELD node, communityId
     WITH communityId, collect(node.text) AS passages, count(*) AS size
     WHERE size > 1
     RETURN communityId, passages, size ORDER BY size DESC LIMIT 10`,
  );
  return rows.map((row) => toCluster(row, "communityId"));
}

export async function overlapPairs(docId: string): Promise<OverlapPair[]> {
  const rows = await runCypher(
    docId,
    `MATCH (a:Passage)-[r:SIMILAR_TO]->(b:Passage)
     RETURN a.text AS source, b.text AS target, r.score AS score
     ORDER BY score DESC LIMIT 12`,
  );
  return rows.map((row) => ({
    from: String(row.source ?? ""),
    to: String(row.target ?? ""),
    score: Number(row.score ?? 0),
  }));
}

export async function traceFromClaim(
  docId: string,
  seed: string,
  depth = 2,
): Promise<string[]> {
  const rows = await runCypher(
    docId,
    `MATCH (c:Claim) WHERE c.text CONTAINS $seed
     WITH c LIMIT 1
     CALL algo.bfs(c, $depth, null) YIELD nodes
     UNWIND nodes AS n
     RETURN DISTINCT coalesce(n.text, n.name, labels(n)[0]) AS label LIMIT 20`,
    { seed, depth },
  );
  return rows.map((row) => String(row.label ?? "")).filter(Boolean);
}

export async function shortestPassagePath(
  docId: string,
  from: number,
  to: number,
): Promise<PathStep | null> {
  const rows = await runCypher(
    docId,
    `MATCH (a:Passage {pid: $from}), (b:Passage {pid: $to})
     CALL algo.SPpaths({sourceNode: a, targetNode: b, relTypes: ['SIMILAR_TO'],
                        weightProp: 'score', relDirection: 'both', pathCount: 1})
     YIELD path, pathWeight
     RETURN [n IN nodes(path) | n.text] AS nodes, pathWeight LIMIT 1`,
    { from, to },
  );
  if (!rows.length) return null;
  const nodes = Array.isArray(rows[0].nodes) ? rows[0].nodes : [];
  return {
    nodes: nodes.map((item) => String(item)),
    weight: Number(rows[0].pathWeight ?? 0),
  };
}

export async function statisticsDigest(docId: string): Promise<string[]> {
  const rows = await runCypher(
    docId,
    `MATCH (st:Statistic) RETURN st.text AS text, st.section AS section LIMIT 40`,
  );
  return rows.map((row) => `[${String(row.section)}] ${String(row.text)}`);
}
