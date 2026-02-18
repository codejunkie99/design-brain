import type { InspirationRecord } from './types.js';

export interface WritingStyleToken {
  headings: HeadingPattern[];
  ctas: CtaPattern[];
  toneMarkers: string[];
  textHierarchy: TextLevel[];
  avgSentenceLength: number;
  avgWordLength: number;
}

export interface HeadingPattern {
  tag: string;
  text: string;
  wordCount: number;
  style: 'question' | 'statement' | 'action' | 'label';
}

export interface CtaPattern {
  text: string;
  selector: string;
  actionVerb: string;
}

export interface TextLevel {
  level: string;
  count: number;
  avgWords: number;
}

const ACTION_VERBS = new Set([
  'get', 'start', 'try', 'buy', 'sign', 'join', 'learn', 'discover',
  'explore', 'create', 'build', 'download', 'view', 'see', 'read',
  'watch', 'listen', 'subscribe', 'contact', 'request', 'book',
  'schedule', 'apply', 'claim', 'unlock', 'activate', 'upgrade',
  'shop', 'order', 'add', 'continue', 'submit', 'send', 'share',
]);

const TONE_MARKERS = {
  conversational: ['you', "you'll", "you're", "we'll", "we're", "let's", "don't", "it's", "that's"],
  formal: ['therefore', 'furthermore', 'consequently', 'regarding', 'herein', 'pursuant'],
  urgent: ['now', 'today', 'limited', 'hurry', 'last chance', 'don\'t miss', 'act now', 'ending soon'],
  friendly: ['hey', 'awesome', 'love', 'amazing', 'great', 'happy', 'enjoy', 'fun', 'easy'],
  technical: ['api', 'sdk', 'integration', 'deploy', 'configure', 'implement', 'infrastructure'],
  aspirational: ['transform', 'empower', 'revolutionize', 'reimagine', 'elevate', 'unlock potential'],
};

function classifyHeadingStyle(text: string): 'question' | 'statement' | 'action' | 'label' {
  const trimmed = text.trim();
  if (trimmed.endsWith('?')) return 'question';
  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase() ?? '';
  if (ACTION_VERBS.has(firstWord)) return 'action';
  if (trimmed.split(/\s+/).length <= 2) return 'label';
  return 'statement';
}

function extractActionVerb(text: string): string {
  const words = text.toLowerCase().trim().split(/\s+/);
  for (const word of words) {
    if (ACTION_VERBS.has(word)) return word;
  }
  return words[0] || '';
}

function detectTone(allText: string): string[] {
  const lower = allText.toLowerCase();
  const detected: string[] = [];

  for (const [tone, markers] of Object.entries(TONE_MARKERS)) {
    const hits = markers.filter((m) => lower.includes(m)).length;
    const threshold = Math.max(1, Math.floor(markers.length * 0.2));
    if (hits >= threshold) detected.push(tone);
  }

  return detected;
}

function avgWords(texts: string[]): number {
  if (texts.length === 0) return 0;
  const total = texts.reduce((sum, t) => sum + t.trim().split(/\s+/).filter(Boolean).length, 0);
  return Math.round(total / texts.length);
}

export function analyzeWritingStyle(inspo: InspirationRecord): WritingStyleToken {
  const components = inspo.analysis.components;

  // Headings
  const headingTags = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
  const headings: HeadingPattern[] = [];
  for (const comp of components) {
    if (headingTags.has(comp.tag.toLowerCase()) && comp.text.trim()) {
      headings.push({
        tag: comp.tag.toLowerCase(),
        text: comp.text.trim().slice(0, 120),
        wordCount: comp.text.trim().split(/\s+/).length,
        style: classifyHeadingStyle(comp.text),
      });
    }
  }

  // CTAs — buttons and links with action text
  const ctaTags = new Set(['button', 'a']);
  const ctas: CtaPattern[] = [];
  for (const comp of components) {
    if (!ctaTags.has(comp.tag.toLowerCase())) continue;
    const text = comp.text.trim();
    if (!text || text.length > 60) continue;
    const verb = extractActionVerb(text);
    if (verb) {
      ctas.push({
        text,
        selector: comp.selector,
        actionVerb: verb,
      });
    }
  }

  // Collect all visible text
  const allTexts = components.map((c) => c.text.trim()).filter((t) => t.length > 3);
  const allText = allTexts.join(' ');

  // Tone detection
  const toneMarkers = detectTone(allText);

  // Text hierarchy — group by tag and compute avg word count
  const tagTexts = new Map<string, string[]>();
  for (const comp of components) {
    const tag = comp.tag.toLowerCase();
    if (!comp.text.trim()) continue;
    const list = tagTexts.get(tag) ?? [];
    list.push(comp.text.trim());
    tagTexts.set(tag, list);
  }

  const textHierarchy: TextLevel[] = [];
  const hierarchyOrder = ['h1', 'h2', 'h3', 'p', 'span', 'a', 'button', 'li'];
  for (const tag of hierarchyOrder) {
    const texts = tagTexts.get(tag);
    if (texts && texts.length > 0) {
      textHierarchy.push({
        level: tag,
        count: texts.length,
        avgWords: avgWords(texts),
      });
    }
  }

  // Sentence stats
  const sentences = allText.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const avgSentenceLen = sentences.length > 0
    ? Math.round(sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length)
    : 0;

  const words = allText.split(/\s+/).filter(Boolean);
  const avgWordLen = words.length > 0
    ? Math.round((words.reduce((sum, w) => sum + w.length, 0) / words.length) * 10) / 10
    : 0;

  return {
    headings,
    ctas: ctas.slice(0, 20),
    toneMarkers,
    textHierarchy,
    avgSentenceLength: avgSentenceLen,
    avgWordLength: avgWordLen,
  };
}

export function aggregateWritingStyles(inspirations: InspirationRecord[]): {
  headingStyles: Record<string, number>;
  topCtas: Array<{ text: string; verb: string; count: number }>;
  tones: Record<string, number>;
  avgSentenceLength: number;
  textLevels: TextLevel[];
} {
  const headingStyleCounts: Record<string, number> = {};
  const ctaMap = new Map<string, { text: string; verb: string; count: number }>();
  const toneCounts: Record<string, number> = {};
  let sentLenSum = 0;
  let sentLenCount = 0;
  const levelMap = new Map<string, { total: number; wordSum: number }>();

  for (const inspo of inspirations) {
    const style = analyzeWritingStyle(inspo);

    for (const h of style.headings) {
      headingStyleCounts[h.style] = (headingStyleCounts[h.style] ?? 0) + 1;
    }

    for (const cta of style.ctas) {
      const key = cta.text.toLowerCase();
      const existing = ctaMap.get(key) ?? { text: cta.text, verb: cta.actionVerb, count: 0 };
      existing.count += 1;
      ctaMap.set(key, existing);
    }

    for (const tone of style.toneMarkers) {
      toneCounts[tone] = (toneCounts[tone] ?? 0) + 1;
    }

    if (style.avgSentenceLength > 0) {
      sentLenSum += style.avgSentenceLength;
      sentLenCount += 1;
    }

    for (const level of style.textHierarchy) {
      const existing = levelMap.get(level.level) ?? { total: 0, wordSum: 0 };
      existing.total += level.count;
      existing.wordSum += level.avgWords * level.count;
      levelMap.set(level.level, existing);
    }
  }

  const topCtas = [...ctaMap.values()].sort((a, b) => b.count - a.count).slice(0, 15);

  const textLevels: TextLevel[] = [];
  for (const [level, data] of levelMap) {
    textLevels.push({ level, count: data.total, avgWords: data.total > 0 ? Math.round(data.wordSum / data.total) : 0 });
  }

  return {
    headingStyles: headingStyleCounts,
    topCtas,
    tones: toneCounts,
    avgSentenceLength: sentLenCount > 0 ? Math.round(sentLenSum / sentLenCount) : 0,
    textLevels,
  };
}

export function renderWritingStyleMd(styles: ReturnType<typeof aggregateWritingStyles>, projectId: string): string {
  const lines: string[] = [];
  lines.push(`# Writing Style Analysis — ${projectId}\n`);

  // Tone
  const toneEntries = Object.entries(styles.tones).sort((a, b) => b[1] - a[1]);
  if (toneEntries.length > 0) {
    lines.push('## Tone\n');
    for (const [tone, count] of toneEntries) {
      lines.push(`- **${tone}** (${count} captures)`);
    }
    lines.push('');
  }

  // Heading styles
  const headingEntries = Object.entries(styles.headingStyles).sort((a, b) => b[1] - a[1]);
  if (headingEntries.length > 0) {
    lines.push('## Heading Patterns\n');
    lines.push('| Style | Count |');
    lines.push('| --- | --- |');
    for (const [style, count] of headingEntries) {
      lines.push(`| ${style} | ${count} |`);
    }
    lines.push('');
  }

  // CTAs
  if (styles.topCtas.length > 0) {
    lines.push('## CTA Patterns\n');
    lines.push('| Text | Action Verb | Occurrences |');
    lines.push('| --- | --- | --- |');
    for (const cta of styles.topCtas) {
      lines.push(`| ${cta.text} | ${cta.verb} | ${cta.count} |`);
    }
    lines.push('');
  }

  // Text hierarchy
  if (styles.textLevels.length > 0) {
    lines.push('## Text Hierarchy\n');
    lines.push('| Element | Count | Avg Words |');
    lines.push('| --- | --- | --- |');
    for (const level of styles.textLevels) {
      lines.push(`| ${level.level} | ${level.count} | ${level.avgWords} |`);
    }
    lines.push('');
  }

  // Readability
  lines.push('## Readability\n');
  lines.push(`- **Avg sentence length:** ${styles.avgSentenceLength} words`);
  lines.push('');

  return lines.join('\n');
}
