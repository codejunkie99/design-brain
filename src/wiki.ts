import type { DesignBrainDatabase, ProjectRecord, InspirationRecord } from './types.js';
import {
  aggregateColors,
  aggregateTypography,
  aggregateComponents,
  aggregateMotion,
} from './aggregate.js';
import { nameColor, nameTypographySize } from './tokenNaming.js';
import { aggregateWritingStyles } from './writingStyle.js';

// ── Per-project wiki page ─────────────────────────────────────────────

function renderProjectWiki(project: ProjectRecord, allProjectIds: string[]): string {
  const lines: string[] = [];
  const inspos = project.inspirations;

  lines.push(`# ${project.name}`);
  lines.push('');
  if (project.description) {
    lines.push(`> ${project.description}`);
    lines.push('');
  }
  lines.push(`**ID:** ${project.id}`);
  lines.push(`**Created:** ${project.createdAt.slice(0, 10)}`);
  lines.push(`**Updated:** ${project.updatedAt.slice(0, 10)}`);
  lines.push(`**Captures:** ${inspos.length}`);
  lines.push(`**Outcomes:** ${project.outcomes.length}`);
  lines.push('');

  // Colors
  const colors = aggregateColors(inspos);
  if (colors.length > 0) {
    lines.push('## Colors');
    lines.push('');
    lines.push('| Hex | Name | Count | Samples |');
    lines.push('| --- | --- | --- | --- |');
    for (const c of colors.slice(0, 30)) {
      const name = nameColor(c.hex);
      lines.push(`| ${c.hex} | ${name} | ${c.count} | ${c.samples.slice(0, 3).join(', ') || '—'} |`);
    }
    lines.push('');
  }

  // Typography
  const typo = aggregateTypography(inspos);
  if (typo.length > 0) {
    lines.push('## Typography');
    lines.push('');
    lines.push('| Font Family | Size | Weight | Scale | Count |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const t of typo.slice(0, 30)) {
      const scale = nameTypographySize(t.fontSize);
      lines.push(`| ${t.fontFamily} | ${t.fontSize} | ${t.fontWeight} | ${scale} | ${t.count} |`);
    }
    lines.push('');
  }

  // Components
  const components = aggregateComponents(inspos);
  if (components.length > 0) {
    lines.push('## Components');
    lines.push('');
    const byKind = new Map<string, Array<typeof components[0]>>();
    for (const comp of components) {
      const list = byKind.get(comp.kind) ?? [];
      list.push(comp);
      byKind.set(comp.kind, list);
    }
    for (const [kind, items] of [...byKind.entries()].slice(0, 20)) {
      lines.push(`### ${kind}`);
      lines.push('');
      for (const item of items.slice(0, 5)) {
        lines.push(`- \`${item.selector}\` (${item.tag}) — ${item.text.slice(0, 60) || 'no text'}`);
      }
      lines.push('');
    }
  }

  // Writing Style
  const writingAgg = aggregateWritingStyles(inspos);
  const hasTones = Object.keys(writingAgg.tones).length > 0;
  const hasCtas = writingAgg.topCtas.length > 0;
  const hasHeadingStyles = Object.keys(writingAgg.headingStyles).length > 0;
  if (hasTones || hasCtas || hasHeadingStyles) {
    lines.push('## Writing Style');
    lines.push('');
    if (hasTones) {
      const toneEntries = Object.entries(writingAgg.tones).sort((a, b) => b[1] - a[1]);
      lines.push(`**Tone:** ${toneEntries.map(([t, c]) => `${t} (${c})`).join(', ')}`);
      lines.push('');
    }
    if (hasHeadingStyles) {
      const headingEntries = Object.entries(writingAgg.headingStyles).sort((a, b) => b[1] - a[1]);
      lines.push(`**Heading styles:** ${headingEntries.map(([s, c]) => `${s} (${c})`).join(', ')}`);
      lines.push('');
    }
    if (hasCtas) {
      lines.push('**Top CTAs:**');
      lines.push('');
      for (const cta of writingAgg.topCtas.slice(0, 10)) {
        lines.push(`- "${cta.text}" — verb: *${cta.verb}* (${cta.count}x)`);
      }
      lines.push('');
    }
    if (writingAgg.avgSentenceLength > 0) {
      lines.push(`**Avg sentence length:** ${writingAgg.avgSentenceLength} words`);
      lines.push('');
    }
  }

  // Motion
  const motion = aggregateMotion(inspos);
  if (motion.length > 0) {
    lines.push('## Motion');
    lines.push('');
    lines.push('| Selector | Transition | Animation | Count |');
    lines.push('| --- | --- | --- | --- |');
    for (const m of motion.slice(0, 20)) {
      lines.push(`| ${m.selector} | ${m.transition || '—'} | ${m.animation || '—'} | ${m.count} |`);
    }
    lines.push('');
  }

  // CSS Variables
  const allVars = new Map<string, string>();
  for (const inspo of inspos) {
    for (const [key, value] of Object.entries(inspo.analysis.cssVariables)) {
      if (!allVars.has(key)) allVars.set(key, value);
    }
  }
  if (allVars.size > 0) {
    lines.push('## CSS Variables');
    lines.push('');
    lines.push('| Variable | Value |');
    lines.push('| --- | --- |');
    for (const [key, value] of [...allVars.entries()].slice(0, 40)) {
      lines.push(`| \`${key}\` | \`${value}\` |`);
    }
    lines.push('');
  }

  // Inspirations
  if (inspos.length > 0) {
    lines.push('## Inspirations');
    lines.push('');
    for (const inspo of inspos) {
      lines.push(`### ${inspo.name}`);
      lines.push('');
      lines.push(`- **ID:** ${inspo.id}`);
      lines.push(`- **Source:** ${inspo.url || inspo.originalImagePath || 'screenshot'}`);
      lines.push(`- **Captured:** ${inspo.capturedAt.slice(0, 10)}`);
      if (inspo.tags.length > 0) lines.push(`- **Tags:** ${inspo.tags.join(', ')}`);
      if (inspo.notes) lines.push(`- **Notes:** ${inspo.notes}`);
      if (inspo.inspirationSummary) lines.push(`- **Summary:** ${inspo.inspirationSummary}`);
      lines.push(`- **Colors:** ${inspo.analysis.colors.length} | **Typography:** ${inspo.analysis.typography.length} | **Components:** ${inspo.analysis.components.length}`);
      lines.push('');
    }
  }

  // Outcomes
  if (project.outcomes.length > 0) {
    lines.push('## Outcomes');
    lines.push('');
    for (const outcome of project.outcomes) {
      lines.push(`### ${outcome.title}`);
      lines.push('');
      lines.push(outcome.description);
      if (outcome.artifactUrl) lines.push(`- **Artifact:** ${outcome.artifactUrl}`);
      if (outcome.inspiredBy.length > 0) lines.push(`- **Inspired by:** ${outcome.inspiredBy.map((id) => `[[${id}]]`).join(', ')}`);
      if (outcome.tags.length > 0) lines.push(`- **Tags:** ${outcome.tags.join(', ')}`);
      lines.push('');
    }
  }

  // Cross-references
  const otherProjects = allProjectIds.filter((id) => id !== project.id);
  if (otherProjects.length > 0) {
    lines.push('## See Also');
    lines.push('');
    for (const id of otherProjects) {
      lines.push(`- [[${id}]]`);
    }
    lines.push('- [[shared-context]]');
    lines.push('');
  }

  return lines.join('\n');
}

// ── Shared context space ──────────────────────────────────────────────

interface SharedToken {
  value: string;
  projects: string[];
}

function findSharedColors(projects: ProjectRecord[]): SharedToken[] {
  const colorProjects = new Map<string, Set<string>>();
  for (const project of projects) {
    const colors = aggregateColors(project.inspirations);
    for (const c of colors) {
      const hex = c.hex.toUpperCase();
      const set = colorProjects.get(hex) ?? new Set();
      set.add(project.id);
      colorProjects.set(hex, set);
    }
  }
  return [...colorProjects.entries()]
    .filter(([, pids]) => pids.size > 1)
    .map(([hex, pids]) => ({ value: hex, projects: [...pids].sort() }))
    .sort((a, b) => b.projects.length - a.projects.length);
}

function findSharedFonts(projects: ProjectRecord[]): SharedToken[] {
  const fontProjects = new Map<string, Set<string>>();
  for (const project of projects) {
    const typo = aggregateTypography(project.inspirations);
    const families = new Set(typo.map((t) => t.fontFamily.split(',')[0].trim().replace(/['"]/g, '')));
    for (const family of families) {
      const set = fontProjects.get(family) ?? new Set();
      set.add(project.id);
      fontProjects.set(family, set);
    }
  }
  return [...fontProjects.entries()]
    .filter(([, pids]) => pids.size > 1)
    .map(([font, pids]) => ({ value: font, projects: [...pids].sort() }))
    .sort((a, b) => b.projects.length - a.projects.length);
}

function findSharedComponents(projects: ProjectRecord[]): SharedToken[] {
  const kindProjects = new Map<string, Set<string>>();
  for (const project of projects) {
    const kinds = new Set(project.inspirations.flatMap((i) => i.analysis.components.map((c) => c.kind)));
    for (const kind of kinds) {
      const set = kindProjects.get(kind) ?? new Set();
      set.add(project.id);
      kindProjects.set(kind, set);
    }
  }
  return [...kindProjects.entries()]
    .filter(([, pids]) => pids.size > 1)
    .map(([kind, pids]) => ({ value: kind, projects: [...pids].sort() }))
    .sort((a, b) => b.projects.length - a.projects.length);
}

function findSharedMotion(projects: ProjectRecord[]): SharedToken[] {
  const durationProjects = new Map<string, Set<string>>();
  for (const project of projects) {
    const motion = aggregateMotion(project.inspirations);
    for (const m of motion) {
      for (const t of m.transitions ?? []) {
        if (t.duration && t.duration !== '0s') {
          const set = durationProjects.get(t.duration) ?? new Set();
          set.add(project.id);
          durationProjects.set(t.duration, set);
        }
      }
    }
  }
  return [...durationProjects.entries()]
    .filter(([, pids]) => pids.size > 1)
    .map(([dur, pids]) => ({ value: dur, projects: [...pids].sort() }))
    .sort((a, b) => b.projects.length - a.projects.length);
}

function renderSharedSection(title: string, tokens: SharedToken[]): string[] {
  if (tokens.length === 0) return [];
  const lines: string[] = [];
  lines.push(`## ${title}`);
  lines.push('');
  lines.push('| Value | Shared By |');
  lines.push('| --- | --- |');
  for (const token of tokens) {
    const links = token.projects.map((id) => `[[${id}]]`).join(', ');
    lines.push(`| ${token.value} | ${links} |`);
  }
  lines.push('');
  return lines;
}

function renderSharedContextWiki(projects: ProjectRecord[]): string {
  const lines: string[] = [];
  lines.push('# Shared Design Context');
  lines.push('');
  lines.push('Cross-project design tokens and patterns that appear in multiple projects.');
  lines.push(`Ripgrep this file to find what\'s shared across your design system.`);
  lines.push('');
  lines.push(`**Projects analyzed:** ${projects.length}`);
  lines.push(`**Generated:** ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');

  const sharedColors = findSharedColors(projects);
  const sharedFonts = findSharedFonts(projects);
  const sharedComponents = findSharedComponents(projects);
  const sharedMotion = findSharedMotion(projects);

  const total = sharedColors.length + sharedFonts.length + sharedComponents.length + sharedMotion.length;

  lines.push('## Summary');
  lines.push('');
  lines.push(`| Category | Shared Tokens |`);
  lines.push(`| --- | --- |`);
  lines.push(`| Colors | ${sharedColors.length} |`);
  lines.push(`| Fonts | ${sharedFonts.length} |`);
  lines.push(`| Components | ${sharedComponents.length} |`);
  lines.push(`| Motion | ${sharedMotion.length} |`);
  lines.push(`| **Total** | **${total}** |`);
  lines.push('');

  lines.push(...renderSharedSection('Shared Colors', sharedColors));
  lines.push(...renderSharedSection('Shared Fonts', sharedFonts));
  lines.push(...renderSharedSection('Shared Components', sharedComponents));
  lines.push(...renderSharedSection('Shared Motion Durations', sharedMotion));

  // Project index
  lines.push('## Projects');
  lines.push('');
  for (const project of projects) {
    lines.push(`- [[${project.id}]] — ${project.name} (${project.inspirations.length} captures)`);
  }
  lines.push('');

  return lines.join('\n');
}

// ── Wiki index page ───────────────────────────────────────────────────

function renderWikiIndex(projects: ProjectRecord[], sharedTokenCount: number): string {
  const lines: string[] = [];
  lines.push('# Design Wiki');
  lines.push('');
  lines.push('Your design knowledge base. Each project has its own wiki page.');
  lines.push('Use `rg` to search across all projects at once.');
  lines.push('');
  lines.push('## Projects');
  lines.push('');
  lines.push('| Project | Captures | Outcomes | Updated |');
  lines.push('| --- | --- | --- | --- |');
  for (const p of projects) {
    lines.push(`| [[${p.id}]] ${p.name} | ${p.inspirations.length} | ${p.outcomes.length} | ${p.updatedAt.slice(0, 10)} |`);
  }
  lines.push('');
  lines.push('## Cross-Project');
  lines.push('');
  lines.push(`- [[shared-context]] — ${sharedTokenCount} shared tokens across projects`);
  lines.push('');
  lines.push('## Quick Search');
  lines.push('');
  lines.push('```bash');
  lines.push('# Search a color across all projects');
  lines.push('rg "#533AFD" .design-brain/wiki/');
  lines.push('');
  lines.push('# Find which projects use a component');
  lines.push('rg "button" .design-brain/wiki/');
  lines.push('');
  lines.push('# Find shared tokens');
  lines.push('rg "Shared By" .design-brain/wiki/shared/');
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

// ── Public API ────────────────────────────────────────────────────────

export interface WikiResult {
  projectPages: number;
  sharedTokens: number;
  wikiDir: string;
}

export function generateProjectWiki(project: ProjectRecord, allProjectIds: string[]): string {
  return renderProjectWiki(project, allProjectIds);
}

export function generateSharedContextWiki(projects: ProjectRecord[]): string {
  return renderSharedContextWiki(projects);
}

export function generateWikiIndex(projects: ProjectRecord[], sharedTokenCount: number): string {
  return renderWikiIndex(projects, sharedTokenCount);
}

export function countSharedTokens(projects: ProjectRecord[]): number {
  return (
    findSharedColors(projects).length +
    findSharedFonts(projects).length +
    findSharedComponents(projects).length +
    findSharedMotion(projects).length
  );
}
