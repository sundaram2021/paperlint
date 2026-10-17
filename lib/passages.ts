export interface PassageItem {
  id: number;
  section: string;
  text: string;
}

export interface PassageEdge {
  from: number;
  to: number;
  score: number;
}

function chunkSection(text: string, maxWords = 45): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).length;
    if (current.join(" ").split(/\s+/).length + words > maxWords && current.length) {
      chunks.push(current.join(" "));
      current = [];
    }
    current.push(sentence);
  }
  if (current.length) chunks.push(current.join(" "));
  return chunks;
}

function shingles(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
  const set = new Set<string>();
  for (let i = 0; i < words.length; i += 1) {
    set.add(words.slice(i, i + 3).join(" "));
  }
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

export function buildPassageGraph(
  sections: { name: string; text: string }[],
  threshold = 0.32,
  maxPassages = 180,
): { passages: PassageItem[]; edges: PassageEdge[] } {
  const passages: PassageItem[] = [];
  for (const section of sections) {
    for (const chunk of chunkSection(section.text)) {
      if (passages.length >= maxPassages) break;
      passages.push({ id: passages.length, section: section.name, text: chunk });
    }
  }
  const shingleSets = passages.map((passage) => shingles(passage.text));
  const edges: PassageEdge[] = [];
  for (let i = 0; i < passages.length; i += 1) {
    for (let j = i + 1; j < passages.length; j += 1) {
      const score = jaccard(shingleSets[i], shingleSets[j]);
      if (score >= threshold) {
        edges.push({ from: i, to: j, score: Number(score.toFixed(3)) });
      }
    }
  }
  return { passages, edges };
}
