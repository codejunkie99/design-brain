import type { TasteProfile } from './types.js';

const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const WHITE = '\x1b[37m';

function hexToAnsi256(hex: string): string {
  const raw = hex.replace('#', '');
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

function box(title: string, lines: string[], minWidth = 50): string {
  const contentWidth = Math.max(
    minWidth - 2,
    title.length + 4,
    ...lines.map((l) => stripAnsi(l).length),
  );
  const width = contentWidth + 2;

  const top = `  ${CYAN}┌─ ${title} ${'─'.repeat(Math.max(0, width - title.length - 4))}┐${RESET}`;
  const bottom = `  ${CYAN}└${'─'.repeat(width)}┘${RESET}`;

  const body = lines.map((line) => {
    const visible = stripAnsi(line).length;
    const pad = Math.max(0, contentWidth - visible);
    return `  ${CYAN}│${RESET} ${line}${' '.repeat(pad)}${CYAN}│${RESET}`;
  });

  return [top, ...body, bottom].join('\n');
}

function checkLine(text: string): string {
  return `  ${GREEN}✔${RESET} ${text}`;
}

function warnLine(text: string): string {
  return `  ${YELLOW}⚠${RESET} ${text}`;
}

export function renderTasteProfile(profile: TasteProfile): string {
  const sections: string[] = [];

  // Header box
  const sourceCount = profile.sourceUrls.length || profile.sourceInspirationIds.length;
  sections.push(box('Taste Profile', [
    '',
    `${BOLD}design-brain${RESET}  Taste Engine`,
    `Project: ${profile.name} (${sourceCount} sources)`,
    '',
  ]));

  // Summary checks
  const sourceList = profile.sourceUrls.length > 0
    ? profile.sourceUrls.map((u) => {
        try { return new URL(u).hostname; } catch { return u; }
      }).join(', ')
    : profile.sourceInspirationIds.slice(0, 3).join(', ');

  sections.push('');
  sections.push(checkLine(`Analyzed ${sourceList}`));
  sections.push(checkLine(`Persona: ${profile.persona.label} — ${DIM}${profile.persona.description}${RESET}`));
  sections.push(checkLine(`Aggregate score: ${profile.aggregateScore.overall}/100`));

  // Color palette
  const colorLines: string[] = [];
  for (const entry of profile.color.palette.slice(0, 6)) {
    const swatch = `${hexToAnsi256(entry.hex)}■${RESET}`;
    let source = entry.source;
    try { source = new URL(source).hostname; } catch { /* keep as-is */ }
    colorLines.push(`${swatch} ${entry.hex}  ${DIM}${entry.role} (${source})${RESET}`);
  }
  colorLines.push('');
  colorLines.push(`Harmony: ${profile.color.harmony} · ${capitalize(profile.color.saturationBias)} · ${capitalize(profile.color.lightnessBias)}`);
  sections.push('');
  sections.push(box('Color Palette', colorLines));

  // Typography
  const typoLines: string[] = [];
  typoLines.push(`Primary: ${BOLD}${truncateText(profile.typography.primaryFont, 36)}${RESET}`);
  if (profile.typography.secondaryFont) {
    typoLines.push(`Secondary: ${truncateText(profile.typography.secondaryFont, 36)}`);
  }
  const scaleStr = profile.typography.sizes.join(', ');
  typoLines.push(`Scale: ${truncateText(scaleStr, 40)}`);
  sections.push('');
  sections.push(box('Typography', typoLines));

  // Spacing
  const spacingLines: string[] = [];
  spacingLines.push(`Base: ${profile.spacing.baseUnit}px grid · ${Math.round(profile.spacing.gridAlignmentRatio * 100)}% aligned`);
  spacingLines.push(`Scale: ${profile.spacing.scale.join(' ')}`);
  sections.push('');
  sections.push(box('Spacing', spacingLines));

  // Motion
  const motionLines: string[] = [];
  motionLines.push(`Intensity: ${profile.motion.intensity}`);
  const uiDurations = profile.motion.durations.filter((d) => {
    const match = d.match(/([\d.]+)(s|ms)/);
    if (!match) return true;
    const ms = match[2] === 's' ? parseFloat(match[1]) * 1000 : parseFloat(match[1]);
    return ms <= 10_000;
  });
  if (uiDurations.length > 0) {
    motionLines.push(`Durations: ${uiDurations.join(', ')}`);
  }
  motionLines.push(`Easing: ${truncateText(profile.motion.easing, 42)}`);
  sections.push('');
  sections.push(box('Motion', motionLines));

  // Conflicts
  if (profile.conflicts.length > 0) {
    const unresolved = profile.conflicts.filter((c) => !c.resolved);
    if (unresolved.length > 0) {
      sections.push('');
      sections.push(warnLine(`${unresolved.length} conflict${unresolved.length === 1 ? '' : 's'} detected. Run: ${BOLD}taste ask --project ${profile.id}${RESET}`));
    }
  }

  // Narrative
  if (profile.narrative) {
    sections.push('');
    sections.push(`  ${DIM}${profile.narrative}${RESET}`);
  }

  sections.push('');
  return sections.join('\n');
}

export function renderTasteProfileCompact(profile: TasteProfile): string {
  const sourceCount = profile.sourceUrls.length || profile.sourceInspirationIds.length;
  const conflictStr = profile.conflicts.filter((c) => !c.resolved).length;
  const conflictNote = conflictStr > 0 ? ` ${YELLOW}⚠ ${conflictStr} conflicts${RESET}` : '';

  return `${BOLD}${profile.name}${RESET} · ${profile.persona.label} · ${profile.aggregateScore.overall}/100 · ${sourceCount} sources${conflictNote}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}
