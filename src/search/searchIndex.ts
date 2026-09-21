import { TOOLS } from '../tools/registry';
import type { ToolMeta } from '../types';

export interface SearchResult {
  tool: ToolMeta;
  score: number;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function scoreTool(tool: ToolMeta, query: string, tokens: string[]): number {
  const name = normalize(tool.name);
  const description = normalize(tool.shortDescription);
  const keywords = tool.keywords.map(normalize);

  let score = 0;

  if (name === query) score += 100;
  else if (name.startsWith(query)) score += 60;
  else if (name.includes(query)) score += 40;

  for (const keyword of keywords) {
    if (keyword === query) score += 90;
    else if (keyword.includes(query) || query.includes(keyword)) score += 50;
  }

  if (description.includes(query)) score += 20;

  for (const token of tokens) {
    if (token.length < 2) continue;
    if (name.includes(token)) score += 12;
    if (keywords.some((keyword) => keyword.includes(token))) score += 10;
    if (description.includes(token)) score += 5;
  }

  return score;
}

export function searchTools(query: string, limit = 8): SearchResult[] {
  const normalized = normalize(query);
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/).filter(Boolean);

  const results = TOOLS.map((tool) => ({
    tool,
    score: scoreTool(tool, normalized, tokens),
  }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}
