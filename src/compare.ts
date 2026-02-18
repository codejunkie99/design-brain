import type {
  ColorToken,
  InspirationRecord,
  MotionToken,
  TypographyToken,
} from './types.js';

export interface ComparisonReport {
  nameA: string;
  nameB: string;
  idA: string;
  idB: string;
  colors: {
    added: ColorToken[];
    removed: ColorToken[];
    shared: Array<{ hex: string; countA: number; countB: number }>;
  };
  typography: {
    added: TypographyToken[];
    removed: TypographyToken[];
    shared: TypographyToken[];
  };
  components: {
    addedKinds: string[];
    removedKinds: string[];
    sharedKinds: string[];
  };
  motion: {
    addedCount: number;
    removedCount: number;
    sharedCount: number;
  };
}

export function compareInspirations(a: InspirationRecord, b: InspirationRecord): ComparisonReport {
  // Colors
  const colorsA = new Map(a.analysis.colors.map((c) => [c.hex.toUpperCase(), c]));
  const colorsB = new Map(b.analysis.colors.map((c) => [c.hex.toUpperCase(), c]));
  const addedColors = [...colorsB.values()].filter((c) => !colorsA.has(c.hex.toUpperCase()));
  const removedColors = [...colorsA.values()].filter((c) => !colorsB.has(c.hex.toUpperCase()));
  const sharedColors = [...colorsA.entries()]
    .filter(([hex]) => colorsB.has(hex))
    .map(([hex, ca]) => ({ hex, countA: ca.count, countB: colorsB.get(hex)!.count }));

  // Typography
  const typoKey = (t: TypographyToken) => `${t.fontFamily}|${t.fontSize}|${t.fontWeight}`;
  const typoA = new Map(a.analysis.typography.map((t) => [typoKey(t), t]));
  const typoB = new Map(b.analysis.typography.map((t) => [typoKey(t), t]));
  const addedTypo = [...typoB.values()].filter((t) => !typoA.has(typoKey(t)));
  const removedTypo = [...typoA.values()].filter((t) => !typoB.has(typoKey(t)));
  const sharedTypo = [...typoA.values()].filter((t) => typoB.has(typoKey(t)));

  // Components
  const kindsA = new Set(a.analysis.components.map((c) => c.kind));
  const kindsB = new Set(b.analysis.components.map((c) => c.kind));
  const addedKinds = [...kindsB].filter((k) => !kindsA.has(k));
  const removedKinds = [...kindsA].filter((k) => !kindsB.has(k));
  const sharedKinds = [...kindsA].filter((k) => kindsB.has(k));

  // Motion
  const motionKeyFn = (m: MotionToken) => `${m.selector}|${m.transition}|${m.animation}`;
  const motionA = new Set(a.analysis.motion.map(motionKeyFn));
  const motionB = new Set(b.analysis.motion.map(motionKeyFn));
  const addedMotion = [...motionB].filter((k) => !motionA.has(k)).length;
  const removedMotion = [...motionA].filter((k) => !motionB.has(k)).length;
  const sharedMotion = [...motionA].filter((k) => motionB.has(k)).length;

  return {
    nameA: a.name, nameB: b.name,
    idA: a.id, idB: b.id,
    colors: { added: addedColors, removed: removedColors, shared: sharedColors },
    typography: { added: addedTypo, removed: removedTypo, shared: sharedTypo },
    components: { addedKinds, removedKinds, sharedKinds },
    motion: { addedCount: addedMotion, removedCount: removedMotion, sharedCount: sharedMotion },
  };
}

export function renderComparison(report: ComparisonReport): string {
  const lines: string[] = [];
  lines.push(`# Compare: ${report.nameA} vs ${report.nameB}\n`);

  // Colors
  lines.push('## Colors\n');
  lines.push('| Status | Hex | Detail |');
  lines.push('| --- | --- | --- |');
  for (const c of report.colors.added) lines.push(`| + Added | ${c.hex} | count: ${c.count} |`);
  for (const c of report.colors.removed) lines.push(`| - Removed | ${c.hex} | count: ${c.count} |`);
  for (const c of report.colors.shared) lines.push(`| = Shared | ${c.hex} | ${c.countA} → ${c.countB} |`);
  lines.push('');

  // Typography
  lines.push('## Typography\n');
  lines.push('| Status | Font | Size | Weight |');
  lines.push('| --- | --- | --- | --- |');
  for (const t of report.typography.added) lines.push(`| + Added | ${t.fontFamily} | ${t.fontSize} | ${t.fontWeight} |`);
  for (const t of report.typography.removed) lines.push(`| - Removed | ${t.fontFamily} | ${t.fontSize} | ${t.fontWeight} |`);
  for (const t of report.typography.shared) lines.push(`| = Shared | ${t.fontFamily} | ${t.fontSize} | ${t.fontWeight} |`);
  lines.push('');

  // Components
  lines.push('## Components\n');
  if (report.components.addedKinds.length > 0) lines.push(`Added: ${report.components.addedKinds.join(', ')}`);
  if (report.components.removedKinds.length > 0) lines.push(`Removed: ${report.components.removedKinds.join(', ')}`);
  lines.push(`Shared: ${report.components.sharedKinds.length} kinds`);
  lines.push('');

  // Motion
  lines.push('## Motion\n');
  lines.push(`Added: ${report.motion.addedCount} | Removed: ${report.motion.removedCount} | Shared: ${report.motion.sharedCount}`);
  lines.push('');

  // Summary
  const ca = report.colors.added.length, cr = report.colors.removed.length, cs = report.colors.shared.length;
  const ta = report.typography.added.length, tr = report.typography.removed.length, ts = report.typography.shared.length;
  lines.push('## Summary\n');
  lines.push(`Colors: +${ca} -${cr} =${cs} | Typography: +${ta} -${tr} =${ts} | Components: +${report.components.addedKinds.length} -${report.components.removedKinds.length} =${report.components.sharedKinds.length}`);

  return lines.join('\n');
}
