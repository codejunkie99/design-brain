import path from 'node:path';
import fs from 'fs-extra';
import type { InspirationRecord } from './types.js';
import { brainRoot } from './store.js';

export interface TrendNote {
  title: string;
  signal: 'rising' | 'stable' | 'declining';
  domain: string;
  evidence: string[];
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
}

function determineSignal(captures: string[], allCaptures: string[]): 'rising' | 'stable' | 'declining' {
  if (captures.length < 3) return 'stable';
  const sorted = [...allCaptures].sort();
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = new Set(sorted.slice(0, mid));
  const secondHalf = new Set(sorted.slice(mid));
  const countFirst = captures.filter((c) => firstHalf.has(c)).length;
  const countSecond = captures.filter((c) => secondHalf.has(c)).length;
  if (countSecond > countFirst) return 'rising';
  if (countFirst > countSecond) return 'declining';
  return 'stable';
}

export function detectTrends(inspirations: InspirationRecord[]): TrendNote[] {
  if (inspirations.length < 3) return [];

  const sorted = [...inspirations].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const allIds = sorted.map((i) => i.id);
  const trends: TrendNote[] = [];

  // Color trends — colors appearing in 3+ captures
  const colorMap = new Map<string, string[]>();
  for (const inspo of sorted) {
    for (const color of inspo.analysis.colors) {
      const hex = color.hex.toUpperCase();
      const list = colorMap.get(hex) ?? [];
      list.push(inspo.id);
      colorMap.set(hex, list);
    }
  }
  for (const [hex, ids] of colorMap) {
    if (ids.length >= 3) {
      const captures = sorted.filter((i) => ids.includes(i.id));
      trends.push({
        title: `Color ${hex} appearing across ${ids.length} captures`,
        signal: determineSignal(ids, allIds),
        domain: 'color',
        evidence: ids.map((id) => `[[${id}]]`),
        firstSeen: captures[0].capturedAt.slice(0, 10),
        lastSeen: captures.at(-1)!.capturedAt.slice(0, 10),
        occurrences: ids.length,
      });
    }
  }

  // Typography trends — font families in 3+ captures
  const fontMap = new Map<string, string[]>();
  for (const inspo of sorted) {
    const families = new Set(inspo.analysis.typography.map((t) => t.fontFamily.split(',')[0].trim().replace(/['"]/g, '')));
    for (const family of families) {
      const list = fontMap.get(family) ?? [];
      list.push(inspo.id);
      fontMap.set(family, list);
    }
  }
  for (const [family, ids] of fontMap) {
    if (ids.length >= 3) {
      const captures = sorted.filter((i) => ids.includes(i.id));
      trends.push({
        title: `Font "${family}" used in ${ids.length} captures`,
        signal: determineSignal(ids, allIds),
        domain: 'typography',
        evidence: ids.map((id) => `[[${id}]]`),
        firstSeen: captures[0].capturedAt.slice(0, 10),
        lastSeen: captures.at(-1)!.capturedAt.slice(0, 10),
        occurrences: ids.length,
      });
    }
  }

  // Component kind trends
  const kindMap = new Map<string, string[]>();
  for (const inspo of sorted) {
    const kinds = new Set(inspo.analysis.components.map((c) => c.kind));
    for (const kind of kinds) {
      const list = kindMap.get(kind) ?? [];
      list.push(inspo.id);
      kindMap.set(kind, list);
    }
  }
  for (const [kind, ids] of kindMap) {
    if (ids.length >= 3) {
      const captures = sorted.filter((i) => ids.includes(i.id));
      trends.push({
        title: `Component kind "${kind}" in ${ids.length} captures`,
        signal: determineSignal(ids, allIds),
        domain: 'components',
        evidence: ids.map((id) => `[[${id}]]`),
        firstSeen: captures[0].capturedAt.slice(0, 10),
        lastSeen: captures.at(-1)!.capturedAt.slice(0, 10),
        occurrences: ids.length,
      });
    }
  }

  // Motion trends — easing curves in 3+ captures
  const easingMap = new Map<string, string[]>();
  for (const inspo of sorted) {
    const easings = new Set(inspo.analysis.motion.flatMap((m) => (m.transitions ?? []).map((t) => t.timingFunction)).filter(Boolean));
    for (const easing of easings) {
      const list = easingMap.get(easing) ?? [];
      list.push(inspo.id);
      easingMap.set(easing, list);
    }
  }
  for (const [easing, ids] of easingMap) {
    if (ids.length >= 3) {
      const captures = sorted.filter((i) => ids.includes(i.id));
      trends.push({
        title: `Easing "${easing}" in ${ids.length} captures`,
        signal: determineSignal(ids, allIds),
        domain: 'motion',
        evidence: ids.map((id) => `[[${id}]]`),
        firstSeen: captures[0].capturedAt.slice(0, 10),
        lastSeen: captures.at(-1)!.capturedAt.slice(0, 10),
        occurrences: ids.length,
      });
    }
  }

  return trends;
}

function renderTrendNote(trend: TrendNote, today: string): string {
  return `---
type: trend
title: "${trend.title}"
signal: ${trend.signal}
domain: ${trend.domain}
evidence: [${trend.evidence.map((e) => `"${e}"`).join(', ')}]
first_seen: ${trend.firstSeen}
last_seen: ${trend.lastSeen}
occurrences: ${trend.occurrences}
created: ${today}
updated: ${today}
---

# ${trend.title}

**Signal:** ${trend.signal}
**Domain:** ${trend.domain}
**Occurrences:** ${trend.occurrences}
**First seen:** ${trend.firstSeen}
**Last seen:** ${trend.lastSeen}

## Evidence

${trend.evidence.map((e) => `- ${e}`).join('\n')}
`;
}

function slugifyTrend(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export async function writeTrendNotes(rootDir: string, trends: TrendNote[]): Promise<number> {
  const root = brainRoot(rootDir);
  const trendDir = path.join(root, 'notes', 'trends');
  await fs.ensureDir(trendDir);

  const today = new Date().toISOString().slice(0, 10);
  let written = 0;

  for (const trend of trends) {
    const filename = `${slugifyTrend(trend.title)}.md`;
    const filepath = path.join(trendDir, filename);
    await fs.writeFile(filepath, renderTrendNote(trend, today));
    written++;
  }

  // Update trends MOC
  const mocPath = path.join(root, 'notes', 'mocs', 'trends.md');
  const mocLines = [
    '# Trends Map of Content\n',
    `Updated: ${today}\n`,
    `## Active Trends (${trends.length})\n`,
  ];
  for (const trend of trends) {
    mocLines.push(`- **${trend.signal}** ${trend.title} (${trend.occurrences} occurrences)`);
  }
  await fs.writeFile(mocPath, mocLines.join('\n') + '\n');

  return written;
}
