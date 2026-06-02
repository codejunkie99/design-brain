import type { ProjectRecord } from './types.js';
import {
  aggregateColors,
  aggregateTypography,
  aggregateComponents,
  aggregateMotion,
} from './aggregate.js';

export interface SystemDiffCategory<T> {
  shared: T[];
  onlyA: T[];
  onlyB: T[];
}

export interface TemporalDiffCategory<T> {
  persisted: T[];
  added: T[];
  removed: T[];
}

export interface SystemDiff {
  colors: SystemDiffCategory<string>;
  fonts: SystemDiffCategory<string>;
  componentKinds: SystemDiffCategory<string>;
  motionDurations: SystemDiffCategory<string>;
}

export interface TemporalDiff {
  colors: TemporalDiffCategory<string>;
  fonts: TemporalDiffCategory<string>;
  componentKinds: TemporalDiffCategory<string>;
  motionDurations: TemporalDiffCategory<string>;
  firstHalfCount: number;
  secondHalfCount: number;
}

function diffSets(setA: Set<string>, setB: Set<string>): { shared: string[]; onlyA: string[]; onlyB: string[] } {
  const shared = [...setA].filter((v) => setB.has(v));
  const onlyA = [...setA].filter((v) => !setB.has(v));
  const onlyB = [...setB].filter((v) => !setA.has(v));
  return { shared, onlyA, onlyB };
}

function extractColorSet(project: ProjectRecord): Set<string> {
  return new Set(aggregateColors(project.inspirations).map((c) => c.hex.toUpperCase()));
}

function extractFontSet(project: ProjectRecord): Set<string> {
  return new Set(
    aggregateTypography(project.inspirations).map((t) =>
      t.fontFamily.split(',')[0].trim().replace(/['"]/g, '').toLowerCase()
    )
  );
}

function extractComponentKindSet(project: ProjectRecord): Set<string> {
  return new Set(aggregateComponents(project.inspirations).map((c) => c.kind));
}

function extractMotionDurationSet(project: ProjectRecord): Set<string> {
  const durations = new Set<string>();
  for (const m of aggregateMotion(project.inspirations)) {
    for (const t of m.transitions ?? []) {
      if (t.duration && t.duration !== '0s') durations.add(t.duration);
    }
  }
  return durations;
}

export function diffProjects(projectA: ProjectRecord, projectB: ProjectRecord): SystemDiff {
  return {
    colors: diffSets(extractColorSet(projectA), extractColorSet(projectB)),
    fonts: diffSets(extractFontSet(projectA), extractFontSet(projectB)),
    componentKinds: diffSets(extractComponentKindSet(projectA), extractComponentKindSet(projectB)),
    motionDurations: diffSets(extractMotionDurationSet(projectA), extractMotionDurationSet(projectB)),
  };
}

export function diffTemporal(project: ProjectRecord): TemporalDiff {
  const sorted = [...project.inspirations].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const fakeA: ProjectRecord = { ...project, inspirations: firstHalf };
  const fakeB: ProjectRecord = { ...project, inspirations: secondHalf };

  const diff = diffProjects(fakeA, fakeB);

  return {
    colors: { persisted: diff.colors.shared, added: diff.colors.onlyB, removed: diff.colors.onlyA },
    fonts: { persisted: diff.fonts.shared, added: diff.fonts.onlyB, removed: diff.fonts.onlyA },
    componentKinds: { persisted: diff.componentKinds.shared, added: diff.componentKinds.onlyB, removed: diff.componentKinds.onlyA },
    motionDurations: { persisted: diff.motionDurations.shared, added: diff.motionDurations.onlyB, removed: diff.motionDurations.onlyA },
    firstHalfCount: firstHalf.length,
    secondHalfCount: secondHalf.length,
  };
}

function renderDiffSection(label: string, data: { shared: string[]; onlyA: string[]; onlyB: string[] }, labelA: string, labelB: string): string[] {
  const lines: string[] = [];
  lines.push(`## ${label}\n`);
  lines.push('| Status | Value |');
  lines.push('| --- | --- |');
  for (const v of data.shared) lines.push(`| Shared | ${v} |`);
  for (const v of data.onlyA) lines.push(`| Only in ${labelA} | ${v} |`);
  for (const v of data.onlyB) lines.push(`| Only in ${labelB} | ${v} |`);
  lines.push('');
  return lines;
}

export function renderSystemDiff(diff: SystemDiff | TemporalDiff, mode: 'cross-project' | 'temporal', labelA: string, labelB: string): string {
  const lines: string[] = [];
  lines.push(`# Design System Diff — ${labelA} vs ${labelB}\n`);
  lines.push(`Mode: ${mode}\n`);

  if (mode === 'temporal') {
    const td = diff as TemporalDiff;
    lines.push(`First half: ${td.firstHalfCount} captures | Second half: ${td.secondHalfCount} captures\n`);
    const adapt = (cat: TemporalDiffCategory<string>) => ({ shared: cat.persisted, onlyA: cat.removed, onlyB: cat.added });
    lines.push(...renderDiffSection('Colors', adapt(td.colors), 'Removed', 'Added'));
    lines.push(...renderDiffSection('Fonts', adapt(td.fonts), 'Removed', 'Added'));
    lines.push(...renderDiffSection('Component Kinds', adapt(td.componentKinds), 'Removed', 'Added'));
    lines.push(...renderDiffSection('Motion Durations', adapt(td.motionDurations), 'Removed', 'Added'));
  } else {
    const sd = diff as SystemDiff;
    lines.push(...renderDiffSection('Colors', sd.colors, labelA, labelB));
    lines.push(...renderDiffSection('Fonts', sd.fonts, labelA, labelB));
    lines.push(...renderDiffSection('Component Kinds', sd.componentKinds, labelA, labelB));
    lines.push(...renderDiffSection('Motion Durations', sd.motionDurations, labelA, labelB));
  }

  lines.push('## Summary\n');
  if (mode === 'temporal') {
    const td = diff as TemporalDiff;
    lines.push('| Category | Persisted | Added | Removed |');
    lines.push('| --- | --- | --- | --- |');
    lines.push(`| Colors | ${td.colors.persisted.length} | ${td.colors.added.length} | ${td.colors.removed.length} |`);
    lines.push(`| Fonts | ${td.fonts.persisted.length} | ${td.fonts.added.length} | ${td.fonts.removed.length} |`);
    lines.push(`| Components | ${td.componentKinds.persisted.length} | ${td.componentKinds.added.length} | ${td.componentKinds.removed.length} |`);
    lines.push(`| Motion | ${td.motionDurations.persisted.length} | ${td.motionDurations.added.length} | ${td.motionDurations.removed.length} |`);
  } else {
    const sd = diff as SystemDiff;
    lines.push(`| Category | Shared | Only ${labelA} | Only ${labelB} |`);
    lines.push('| --- | --- | --- | --- |');
    lines.push(`| Colors | ${sd.colors.shared.length} | ${sd.colors.onlyA.length} | ${sd.colors.onlyB.length} |`);
    lines.push(`| Fonts | ${sd.fonts.shared.length} | ${sd.fonts.onlyA.length} | ${sd.fonts.onlyB.length} |`);
    lines.push(`| Components | ${sd.componentKinds.shared.length} | ${sd.componentKinds.onlyA.length} | ${sd.componentKinds.onlyB.length} |`);
    lines.push(`| Motion | ${sd.motionDurations.shared.length} | ${sd.motionDurations.onlyA.length} | ${sd.motionDurations.onlyB.length} |`);
  }

  return lines.join('\n');
}
