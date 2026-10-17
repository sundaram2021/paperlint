import { runCypher } from "@/lib/falkordb";
import { buildPassageGraph } from "@/lib/passages";
import type { Extraction } from "@/lib/schemas";

export interface DocumentRecord {
  docId: string;
  title: string;
  fileName: string;
  text: string;
  pages: number;
}

export async function createDocument(record: DocumentRecord): Promise<void> {
  await runCypher(
    record.docId,
    `MERGE (d:Document {docId: $docId})
     SET d.title = $title, d.fileName = $fileName, d.text = $text, d.pages = $pages,
         d.createdAt = timestamp(), d.report = ''`,
    {
      docId: record.docId,
      title: record.title,
      fileName: record.fileName,
      text: record.text,
      pages: record.pages,
    },
  );
}

export async function getDocumentMeta(
  docId: string,
): Promise<{ title: string; text: string | null }> {
  const rows = await runCypher(
    docId,
    `MATCH (d:Document {docId: $docId}) RETURN d.title AS title, d.text AS text`,
    { docId },
  );
  const text = rows[0]?.text;
  return {
    title: String(rows[0]?.title ?? "Untitled"),
    text: typeof text === "string" && text.length > 0 ? text : null,
  };
}

export async function getDocumentText(docId: string): Promise<string | null> {
  const rows = await runCypher(
    docId,
    `MATCH (d:Document {docId: $docId}) RETURN d.text AS text`,
    { docId },
  );
  const text = rows[0]?.text;
  return typeof text === "string" && text.length > 0 ? text : null;
}

export async function saveReport(docId: string, markdown: string): Promise<void> {
  await runCypher(docId, `MATCH (d:Document {docId: $docId}) SET d.report = $report`, {
    docId,
    report: markdown,
  });
}

export async function getReport(docId: string): Promise<string | null> {
  const rows = await runCypher(
    docId,
    `MATCH (d:Document {docId: $docId}) RETURN d.report AS report`,
    { docId },
  );
  const report = rows[0]?.report;
  return typeof report === "string" && report.trim().length > 0 ? report : null;
}

export async function indexExtraction(
  docId: string,
  extraction: Extraction,
): Promise<{ passages: number; edges: number }> {
  await runCypher(docId, `MATCH (n) DETACH DELETE n`);
  await runCypher(docId, `MERGE (d:Document {docId: $docId}) SET d.title = $title`, {
    docId,
    title: extraction.title,
  });
  await runCypher(
    docId,
    `MATCH (d:Document {docId: $docId})
     UNWIND $sections AS s
     CREATE (sec:Section {name: s.name, ord: s.ord, text: s.text})
     CREATE (d)-[:HAS_SECTION]->(sec)`,
    { docId, sections: extraction.sections.map((s, ord) => ({ ...s, ord })) },
  );
  await runCypher(
    docId,
    `MATCH (d:Document {docId: $docId})-[:HAS_SECTION]->(sec:Section)
     UNWIND $claims AS c WITH sec, c WHERE sec.name = c.section
     CREATE (cl:Claim {text: c.text, type: c.type, section: c.section})
     CREATE (sec)-[:CONTAINS]->(cl)`,
    { docId, claims: extraction.claims },
  );
  await runCypher(
    docId,
    `MATCH (d:Document {docId: $docId})-[:HAS_SECTION]->(sec:Section)
     UNWIND $statistics AS s WITH sec, s WHERE sec.name = s.section
     CREATE (st:Statistic {text: s.text, section: s.section})
     CREATE (sec)-[:CONTAINS]->(st)`,
    { docId, statistics: extraction.statistics },
  );
  await runCypher(
    docId,
    `MATCH (d:Document {docId: $docId})-[:HAS_SECTION]->(sec:Section)
     UNWIND $citations AS c WITH sec, c WHERE sec.name = c.section
     CREATE (ci:Citation {text: c.text, section: c.section})
     CREATE (sec)-[:CONTAINS]->(ci)`,
    { docId, citations: extraction.citations },
  );
  await runCypher(
    docId,
    `MATCH (s1:Section)-[:CONTAINS]->(cl:Claim), (s2:Section)-[:CONTAINS]->(st:Statistic)
     WHERE s1.name = s2.name CREATE (cl)-[:SUPPORTED_BY]->(st)`,
  );
  await runCypher(
    docId,
    `MATCH (s1:Section)-[:CONTAINS]->(cl:Claim), (s2:Section)-[:CONTAINS]->(ci:Citation)
     WHERE s1.name = s2.name CREATE (cl)-[:CITES]->(ci)`,
  );

  const { passages, edges } = buildPassageGraph(extraction.sections);
  if (passages.length) {
    await runCypher(
      docId,
      `UNWIND $passages AS p CREATE (ps:Passage {pid: p.id, section: p.section, text: p.text})`,
      { passages },
    );
  }
  if (edges.length) {
    await runCypher(
      docId,
      `UNWIND $edges AS e
       MATCH (a:Passage {pid: e.from}), (b:Passage {pid: e.to})
       CREATE (a)-[:SIMILAR_TO {score: e.score}]->(b)`,
      { edges },
    );
  }
  return { passages: passages.length, edges: edges.length };
}
