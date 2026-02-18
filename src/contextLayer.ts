import type { ProjectRecord } from './types.js';
import {
  aggregateColors,
  aggregateTypography,
  aggregateComponents,
  aggregateMotion,
} from './aggregate.js';
import { nameColor, nameTypographySize, nameMotionDuration } from './tokenNaming.js';
import { aggregateWritingStyles } from './writingStyle.js';

/**
 * Generates a compact, grep-friendly context document for a project.
 * This is the file you drop into .claude/ or .cursorrules so your
 * AI assistant knows your design system cold.
 */
export function generateDesignContext(project: ProjectRecord): string {
  const inspos = project.inspirations;
  const lines: string[] = [];

  lines.push(`# Design Context — ${project.name}`);
  lines.push('');
  lines.push(`> Auto-generated design brain context. Drop this into your AI tool's context.`);
  lines.push(`> Search with \`rg "keyword"\` to find any token instantly.`);
  lines.push('');

  if (project.description) {
    lines.push(`**Project:** ${project.description}`);
    lines.push('');
  }

  // ── Color Palette ──────────────────────────────────────────────────

  const colors = aggregateColors(inspos);
  if (colors.length > 0) {
    lines.push('## Color Palette');
    lines.push('');
    lines.push('Use these exact values. Do not invent colors.');
    lines.push('');
    for (const c of colors.slice(0, 20)) {
      const name = nameColor(c.hex);
      lines.push(`- \`${c.hex}\` — ${name} (used ${c.count}x)`);
    }
    lines.push('');

    // CSS variable mapping if available
    const allVars = new Map<string, string>();
    for (const inspo of inspos) {
      for (const [key, value] of Object.entries(inspo.analysis.cssVariables)) {
        if (value.startsWith('#') || value.startsWith('rgb')) {
          allVars.set(key, value);
        }
      }
    }
    if (allVars.size > 0) {
      lines.push('### CSS Variables (colors)');
      lines.push('');
      for (const [key, value] of [...allVars.entries()].slice(0, 30)) {
        lines.push(`- \`${key}: ${value}\``);
      }
      lines.push('');
    }
  }

  // ── Typography Scale ───────────────────────────────────────────────

  const typo = aggregateTypography(inspos);
  if (typo.length > 0) {
    lines.push('## Typography');
    lines.push('');

    // Deduplicate font families
    const families = new Map<string, number>();
    for (const t of typo) {
      const family = t.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
      families.set(family, (families.get(family) ?? 0) + t.count);
    }
    const sortedFamilies = [...families.entries()].sort((a, b) => b[1] - a[1]);
    lines.push(`**Font families:** ${sortedFamilies.map(([f]) => f).join(', ')}`);
    lines.push('');

    // Size scale
    const sizeMap = new Map<string, { scale: string; weight: string; count: number }>();
    for (const t of typo) {
      if (!sizeMap.has(t.fontSize)) {
        sizeMap.set(t.fontSize, {
          scale: nameTypographySize(t.fontSize),
          weight: t.fontWeight,
          count: t.count,
        });
      }
    }
    lines.push('**Type scale:**');
    lines.push('');
    for (const [size, info] of [...sizeMap.entries()].slice(0, 12)) {
      lines.push(`- \`${size}\` → ${info.scale} (weight: ${info.weight})`);
    }
    lines.push('');
  }

  // ── Component Inventory ────────────────────────────────────────────

  const components = aggregateComponents(inspos);
  if (components.length > 0) {
    lines.push('## Components');
    lines.push('');
    lines.push('These are the UI components found across captures.');
    lines.push('');

    const byKind = new Map<string, Array<{ selector: string; tag: string; text: string }>>();
    for (const comp of components) {
      const list = byKind.get(comp.kind) ?? [];
      list.push({ selector: comp.selector, tag: comp.tag, text: comp.text });
      byKind.set(comp.kind, list);
    }

    for (const [kind, items] of [...byKind.entries()].slice(0, 15)) {
      const uniqueSelectors = [...new Set(items.map((i) => i.selector))].slice(0, 5);
      const sampleTexts = items.map((i) => i.text).filter((t) => t.length > 0).slice(0, 3);
      lines.push(`### ${kind}`);
      lines.push('');
      lines.push(`- **Selectors:** ${uniqueSelectors.map((s) => `\`${s}\``).join(', ')}`);
      if (sampleTexts.length > 0) {
        lines.push(`- **Examples:** ${sampleTexts.map((t) => `"${t.slice(0, 50)}"`).join(', ')}`);
      }
      lines.push('');
    }
  }

  // ── Writing Style ──────────────────────────────────────────────────

  const writingAgg = aggregateWritingStyles(inspos);
  const hasTones = Object.keys(writingAgg.tones).length > 0;
  const hasCtas = writingAgg.topCtas.length > 0;
  const hasHeadingStyles = Object.keys(writingAgg.headingStyles).length > 0;

  if (hasTones || hasCtas || hasHeadingStyles) {
    lines.push('## Writing Style');
    lines.push('');
    lines.push('Follow these patterns when writing UI copy.');
    lines.push('');

    if (hasTones) {
      const toneEntries = Object.entries(writingAgg.tones).sort((a, b) => b[1] - a[1]);
      lines.push(`**Tone:** ${toneEntries.map(([t]) => t).join(', ')}`);
      lines.push('');
    }

    if (hasHeadingStyles) {
      const headingEntries = Object.entries(writingAgg.headingStyles).sort((a, b) => b[1] - a[1]);
      lines.push(`**Heading patterns:** ${headingEntries.map(([s, c]) => `${s} (${c})`).join(', ')}`);
      lines.push('');
    }

    if (hasCtas) {
      lines.push('**CTA patterns:**');
      lines.push('');
      for (const cta of writingAgg.topCtas.slice(0, 8)) {
        lines.push(`- "${cta.text}" (verb: ${cta.verb})`);
      }
      lines.push('');
    }

    if (writingAgg.avgSentenceLength > 0) {
      lines.push(`**Target sentence length:** ~${writingAgg.avgSentenceLength} words`);
      lines.push('');
    }
  }

  // ── Motion & Transitions ───────────────────────────────────────────

  const motion = aggregateMotion(inspos);
  if (motion.length > 0) {
    lines.push('## Motion');
    lines.push('');

    const durations = new Map<string, number>();
    for (const m of motion) {
      const dur = m.transition || '';
      if (dur) {
        const bucket = nameMotionDuration(dur);
        durations.set(bucket, (durations.get(bucket) ?? 0) + m.count);
      }
    }
    if (durations.size > 0) {
      lines.push('**Transition speed:**');
      lines.push('');
      for (const [bucket, count] of [...durations.entries()].sort(([, a], [, b]) => b - a)) {
        lines.push(`- ${bucket} (${count}x)`);
      }
      lines.push('');
    }

    // Raw transitions for grep
    const seen = new Set<string>();
    for (const m of motion.slice(0, 10)) {
      const key = m.transition || m.animation || '';
      if (key && !seen.has(key)) {
        seen.add(key);
      }
    }
    if (seen.size > 0) {
      lines.push('**Transition values:**');
      lines.push('');
      for (const t of seen) {
        lines.push(`- \`${t}\``);
      }
      lines.push('');
    }
  }

  // ── All CSS Variables ──────────────────────────────────────────────

  const allCssVars = new Map<string, string>();
  for (const inspo of inspos) {
    for (const [key, value] of Object.entries(inspo.analysis.cssVariables)) {
      if (!allCssVars.has(key)) allCssVars.set(key, value);
    }
  }
  // Filter out color vars already shown above
  const nonColorVars = [...allCssVars.entries()].filter(
    ([, v]) => !v.startsWith('#') && !v.startsWith('rgb')
  );
  if (nonColorVars.length > 0) {
    lines.push('## CSS Variables');
    lines.push('');
    for (const [key, value] of nonColorVars.slice(0, 30)) {
      lines.push(`- \`${key}: ${value}\``);
    }
    lines.push('');
  }

  // ── Source Captures ────────────────────────────────────────────────

  if (inspos.length > 0) {
    lines.push('## Sources');
    lines.push('');
    for (const inspo of inspos) {
      const source = inspo.url || inspo.originalImagePath || 'screenshot';
      lines.push(`- ${inspo.name} — ${source} (${inspo.capturedAt.slice(0, 10)})`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`*Generated by design-brain-memory on ${new Date().toISOString().slice(0, 10)}*`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generates a cross-project context document — a unified design brain
 * covering all projects for shared understanding.
 */
export function generateUnifiedContext(projects: ProjectRecord[]): string {
  const lines: string[] = [];

  lines.push('# Design Brain — Unified Context');
  lines.push('');
  lines.push(`> ${projects.length} projects. Search with \`rg "keyword"\` to find anything.`);
  lines.push('');

  for (const project of projects) {
    const inspos = project.inspirations;
    if (inspos.length === 0) continue;

    lines.push(`## ${project.name}`);
    lines.push('');

    // Colors — compact
    const colors = aggregateColors(inspos);
    if (colors.length > 0) {
      const colorList = colors.slice(0, 10).map((c) => `${c.hex} (${nameColor(c.hex)})`).join(', ');
      lines.push(`**Colors:** ${colorList}`);
      lines.push('');
    }

    // Typography — compact
    const typo = aggregateTypography(inspos);
    if (typo.length > 0) {
      const families = [...new Set(typo.map((t) => t.fontFamily.split(',')[0].trim().replace(/['"]/g, '')))];
      lines.push(`**Fonts:** ${families.slice(0, 5).join(', ')}`);
      lines.push('');
    }

    // Components — compact
    const components = aggregateComponents(inspos);
    if (components.length > 0) {
      const kinds = [...new Set(components.map((c) => c.kind))];
      lines.push(`**Components:** ${kinds.slice(0, 10).join(', ')}`);
      lines.push('');
    }

    // Writing tone — compact
    const writingAgg = aggregateWritingStyles(inspos);
    const tones = Object.keys(writingAgg.tones);
    if (tones.length > 0) {
      lines.push(`**Tone:** ${tones.join(', ')}`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  lines.push(`*Generated by design-brain-memory on ${new Date().toISOString().slice(0, 10)}*`);
  lines.push('');

  return lines.join('\n');
}
