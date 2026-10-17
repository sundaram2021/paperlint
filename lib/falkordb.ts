import { FalkorDB, type Graph } from "falkordb";
import { getEnv } from "@/lib/env";

let cached: Promise<FalkorDB> | null = null;

async function connect(): Promise<FalkorDB> {
  const env = getEnv();
  const hasEmbeddedPort = env.FALKORDB_HOST.includes(":");
  const [host, embeddedPort] = hasEmbeddedPort
    ? env.FALKORDB_HOST.split(":")
    : [env.FALKORDB_HOST, undefined];
  const port = embeddedPort ? Number(embeddedPort) : env.FALKORDB_PORT;
  return FalkorDB.connect({
    socket: {
      host,
      port: Number.isFinite(port) ? port : env.FALKORDB_PORT,
      tls: env.FALKORDB_TLS,
    },
    username: env.FALKORDB_USERNAME || undefined,
    password: env.FALKORDB_PASSWORD || undefined,
  });
}

export function getClient(): Promise<FalkorDB> {
  if (!cached) {
    cached = connect().catch((error) => {
      cached = null;
      throw error;
    });
  }
  return cached;
}

export function graphName(docId: string): string {
  const safe = docId.replace(/[^a-zA-Z0-9]/g, "");
  return `paperlint_${safe}`;
}

export async function getGraph(docId: string): Promise<Graph> {
  const client = await getClient();
  return client.selectGraph(graphName(docId));
}

export async function dropGraph(docId: string): Promise<void> {
  const graph = await getGraph(docId);
  await graph.delete();
}

export type Row = Record<string, unknown>;

type GraphQueryOptions = NonNullable<Parameters<Graph["query"]>[1]>;

export async function runCypher(
  docId: string,
  cypher: string,
  params: Record<string, unknown> = {},
): Promise<Row[]> {
  const graph = await getGraph(docId);
  const result = await graph.query(cypher, { params } as GraphQueryOptions);
  return (result.data ?? []) as Row[];
}
