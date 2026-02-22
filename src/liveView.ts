import type { DesignAnalysis, InspirationRecord } from './types.js';
import { nameColor, nameTypographySize } from './tokenNaming.js';
import { buildComponentGraph } from './componentGraph.js';
import { analyzeWritingStyle } from './writingStyle.js';

// ── ANSI codes ──────────────────────────────────────────────────────────

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const MAGENTA = '\x1b[35m';
const WHITE = '\x1b[97m';
const BG_RESET = '\x1b[49m';

// ── Spinner ─────────────────────────────────────────────────────────────

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const SPINNER_INTERVAL_MS = 80;

// ── FramedLine: dual-text pattern for accurate width calculation ────────

interface FramedLine {
  plain: string;    // for width calculation (no ANSI)
  rendered: string; // for display (with ANSI)
}

function fl(plain: string, rendered?: string): FramedLine {
  return { plain, rendered: rendered ?? plain };
}

const OUTER_INDENT = '  ';
const BOX_PAD = 1;

function framedBox(title: FramedLine, badge: FramedLine | null, content: FramedLine[], width: number): string[] {
  const innerWidth = width - 2 - (BOX_PAD * 2); // borders + padding
  const b = DIM; // border color

  // Top border with title and optional badge
  const titlePadded = ` ${title.plain} `;
  const titleRendered = ` ${title.rendered} `;
  const badgePadded = badge ? ` ${badge.plain} ` : '';
  const badgeRendered = badge ? ` ${badge.rendered} ` : '';
  const fillLen = Math.max(0, innerWidth + (BOX_PAD * 2) - titlePadded.length - badgePadded.length);
  const topBorder = `${OUTER_INDENT}${b}┌─${RESET}${titleRendered}${b}${'─'.repeat(fillLen)}${RESET}${badgeRendered}${b}─┐${RESET}`;

  const lines: string[] = [topBorder];
  const pad = ' '.repeat(BOX_PAD);

  for (const line of content) {
    const trailing = Math.max(0, innerWidth - line.plain.length);
    lines.push(`${OUTER_INDENT}${b}│${RESET}${pad}${line.rendered}${' '.repeat(trailing)}${pad}${b}│${RESET}`);
  }

  const bottomBorder = `${OUTER_INDENT}${b}└${'─'.repeat(innerWidth + (BOX_PAD * 2) + 2)}┘${RESET}`;
  lines.push(bottomBorder);
  return lines;
}

// ── Status helpers ──────────────────────────────────────────────────────

function statusBadgeFl(status: 'queued' | 'extracting' | 'done', spinnerFrame: number): FramedLine {
  switch (status) {
    case 'queued':
      return fl('○ queued', `${DIM}○ queued${RESET}`);
    case 'extracting':
      return fl('⠋ extracting', `${CYAN}${SPINNER_FRAMES[spinnerFrame % SPINNER_FRAMES.length]} extracting${RESET}`);
    case 'done':
      return fl('✓ done', `${GREEN}✓ done${RESET}`);
  }
}

// ── Color helpers ───────────────────────────────────────────────────────

function hexToTrueColor(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `\x1b[48;2;${r};${g};${b}m`;
}

function colorBlock(hex: string): string {
  return `${hexToTrueColor(hex)}  ${BG_RESET}`;
}

function scoreBar(filled: number, total: number, width: number): FramedLine {
  const ratio = total > 0 ? filled / total : 0;
  const filledCount = Math.round(ratio * width);
  const emptyCount = Math.max(0, width - filledCount);
  const plain = '█'.repeat(filledCount) + '░'.repeat(emptyCount);
  const rendered = `${GREEN}${'█'.repeat(filledCount)}${RESET}${DIM}${'░'.repeat(emptyCount)}${RESET}`;
  return fl(plain, rendered);
}

function frequencyBar(count: number, max: number, width = 10): string {
  const filled = Math.round((count / Math.max(max, 1)) * width);
  return CYAN + '█'.repeat(filled) + DIM + '░'.repeat(width - filled) + RESET;
}

// ── State types ─────────────────────────────────────────────────────────

interface ViewportState {
  label: string;
  status: 'queued' | 'extracting' | 'done';
  analysis: DesignAnalysis | null;
}

interface LiveState {
  url: string;
  phase: string | null;
  phasesCompleted: number;
  totalPhases: number;
  viewports: ViewportState[];
  interactiveStates: number | null;
  interactiveStatus: 'queued' | 'done';
  journeyMaxSteps: number;
  journeySteps: Array<{ step: number; url: string }>;
  journeyStatus: 'queued' | 'in_progress' | 'done';
  merged: DesignAnalysis | null;
  record: InspirationRecord | null;
  complete: boolean;
  spinnerFrame: number;
}

// ── Render helpers (pure functions returning FramedLine[]) ──────────────

function renderProgressHeader(state: LiveState, width: number): string[] {
  const barWidth = Math.max(10, width - 16);
  const bar = scoreBar(state.phasesCompleted, state.totalPhases, barWidth);
  const phaseText = `${state.phasesCompleted}/${state.totalPhases} phases`;

  const urlShort = state.url.length > (width - 14)
    ? state.url.slice(0, width - 17) + '...'
    : state.url;

  const content: FramedLine[] = [
    fl(`⟐ Capturing ${urlShort}`, `${MAGENTA}⟐${RESET} Capturing ${DIM}${urlShort}${RESET}`),
    fl(''),
    fl(`${bar.plain}  ${phaseText}`, `${bar.rendered}  ${phaseText}`),
  ];

  const badge = state.complete
    ? fl('✓ complete', `${GREEN}✓ complete${RESET}`)
    : fl('⠋ capturing', `${CYAN}${SPINNER_FRAMES[state.spinnerFrame % SPINNER_FRAMES.length]} capturing${RESET}`);

  return framedBox(
    fl('design-brain', `${BOLD}design-brain${RESET}`),
    badge,
    content,
    width,
  );
}

function renderViewportContent(analysis: DesignAnalysis, innerWidth: number): FramedLine[] {
  const lines: FramedLine[] = [];

  // Colors
  if (analysis.colors.length > 0) {
    const maxCount = analysis.colors[0]?.count ?? 1;
    lines.push(fl(
      `Colors (${analysis.colors.length})`,
      `${WHITE}Colors${RESET} ${DIM}(${analysis.colors.length})${RESET}`,
    ));
    for (const c of analysis.colors.slice(0, 6)) {
      const name = nameColor(c.hex);
      const bar = frequencyBar(c.count, maxCount, 8);
      lines.push(fl(
        `  ██ ${c.hex} ${name} ${'█'.repeat(Math.round((c.count / maxCount) * 8))}${'░'.repeat(8 - Math.round((c.count / maxCount) * 8))} ${c.count}x`,
        `  ${colorBlock(c.hex)} ${WHITE}${c.hex}${RESET} ${name} ${bar} ${DIM}${c.count}x${RESET}`,
      ));
    }
    if (analysis.colors.length > 6) {
      lines.push(fl(
        `  +${analysis.colors.length - 6} more`,
        `  ${DIM}+${analysis.colors.length - 6} more${RESET}`,
      ));
    }
  }

  // Typography
  if (analysis.typography.length > 0) {
    lines.push(fl(
      `Typography (${analysis.typography.length})`,
      `${WHITE}Typography${RESET} ${DIM}(${analysis.typography.length})${RESET}`,
    ));
    for (const t of analysis.typography.slice(0, 4)) {
      const family = t.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
      const scale = nameTypographySize(t.fontSize);
      lines.push(fl(
        `  ${family} ${t.fontSize}/${t.fontWeight} → ${scale}`,
        `  ${CYAN}${family}${RESET} ${t.fontSize}/${t.fontWeight} → ${GREEN}${scale}${RESET}`,
      ));
    }
    if (analysis.typography.length > 4) {
      lines.push(fl(
        `  +${analysis.typography.length - 4} more`,
        `  ${DIM}+${analysis.typography.length - 4} more${RESET}`,
      ));
    }
  }

  // Components — compact chip flow
  if (analysis.components.length > 0) {
    const kindCounts = new Map<string, number>();
    for (const c of analysis.components) {
      kindCounts.set(c.kind, (kindCounts.get(c.kind) ?? 0) + 1);
    }
    const sorted = [...kindCounts.entries()].sort((a, b) => b[1] - a[1]);
    lines.push(fl(
      `Components (${analysis.components.length})`,
      `${WHITE}Components${RESET} ${DIM}(${analysis.components.length})${RESET}`,
    ));

    // Pack chips into lines
    let plainLine = '  ';
    let renderedLine = '  ';
    let plainLen = 2;
    for (const [kind, count] of sorted.slice(0, 10)) {
      const chip = `${kind} ×${count}`;
      if (plainLen + chip.length + 2 > innerWidth && plainLen > 2) {
        lines.push(fl(plainLine, renderedLine));
        plainLine = '  ';
        renderedLine = '  ';
        plainLen = 2;
      }
      plainLine += chip + '  ';
      renderedLine += `${GREEN}${kind}${RESET} ×${count}  `;
      plainLen += chip.length + 2;
    }
    if (plainLen > 2) lines.push(fl(plainLine, renderedLine));
    if (sorted.length > 10) {
      lines.push(fl(
        `  +${sorted.length - 10} more kinds`,
        `  ${DIM}+${sorted.length - 10} more kinds${RESET}`,
      ));
    }
  }

  // Motion
  if (analysis.motion.length > 0) {
    const meaningful = analysis.motion.filter(m => {
      const val = m.transition !== 'all 0s ease 0s' ? m.transition : m.animation;
      return val && val !== 'none 0s ease 0s normal none running';
    });
    if (meaningful.length > 0) {
      lines.push(fl(
        `Motion (${meaningful.length})`,
        `${WHITE}Motion${RESET} ${DIM}(${meaningful.length})${RESET}`,
      ));
      for (const m of meaningful.slice(0, 3)) {
        const value = (m.transition !== 'all 0s ease 0s' ? m.transition : m.animation) ?? '';
        const truncated = value.slice(0, 45);
        lines.push(fl(
          `  ${m.selector} → ${truncated}`,
          `  ${MAGENTA}${m.selector}${RESET} → ${DIM}${truncated}${RESET}`,
        ));
      }
      if (meaningful.length > 3) {
        lines.push(fl(
          `  +${meaningful.length - 3} more`,
          `  ${DIM}+${meaningful.length - 3} more${RESET}`,
        ));
      }
    }
  }

  return lines;
}

function renderMergedContent(analysis: DesignAnalysis): FramedLine[] {
  const pairs: [string, number][] = [
    ['Colors', analysis.colors.length],
    ['Typography', analysis.typography.length],
    ['Components', analysis.components.length],
    ['Motion', analysis.motion.length],
    ['Layout', analysis.layout.length],
    ['CSS Vars', Object.keys(analysis.cssVariables).length],
    ['Keyframes', analysis.keyframes?.length ?? 0],
  ];
  return pairs.map(([label, count]) => fl(
    `${label.padEnd(12)} ${count}`,
    `${WHITE}${label.padEnd(12)}${RESET} ${count}`,
  ));
}

function renderRelationships(record: InspirationRecord): FramedLine[] {
  const graph = buildComponentGraph([record]);
  const lines: FramedLine[] = [];
  if (graph.edges.length > 0) {
    for (const edge of graph.edges.slice(0, 8)) {
      lines.push(fl(
        `${edge.parent} contains ${edge.child} (${edge.count}x)`,
        `${GREEN}${edge.parent}${RESET} ${DIM}contains${RESET} ${CYAN}${edge.child}${RESET} ${DIM}(${edge.count}x)${RESET}`,
      ));
    }
    if (graph.coOccurrences.length > 0) {
      lines.push(fl('Co-occurrences:', `${DIM}Co-occurrences:${RESET}`));
      for (const co of graph.coOccurrences.slice(0, 4)) {
        lines.push(fl(
          `  ${co.kindA} ↔ ${co.kindB} (${co.count}x)`,
          `  ${co.kindA} ${DIM}↔${RESET} ${co.kindB} ${DIM}(${co.count}x)${RESET}`,
        ));
      }
    }
  }
  return lines;
}

function renderWritingStyleContent(record: InspirationRecord): FramedLine[] {
  const style = analyzeWritingStyle(record);
  const lines: FramedLine[] = [];
  if (style.toneMarkers.length > 0) {
    const tone = style.toneMarkers.join(', ');
    lines.push(fl(`Tone:     ${tone}`, `${WHITE}Tone:${RESET}     ${tone}`));
  }
  if (style.headings.length > 0) {
    const styleCounts = new Map<string, number>();
    for (const h of style.headings) {
      styleCounts.set(h.style, (styleCounts.get(h.style) ?? 0) + 1);
    }
    const patterns = [...styleCounts.entries()].map(([s, c]) => `${s}(${c})`).join(', ');
    lines.push(fl(`Headings: ${patterns}`, `${WHITE}Headings:${RESET} ${patterns}`));
  }
  if (style.ctas.length > 0) {
    const ctaText = style.ctas.slice(0, 6).map(c => `"${c.text}"`).join(', ');
    lines.push(fl(`CTAs:     ${ctaText}`, `${WHITE}CTAs:${RESET}     ${ctaText}`));
  }
  if (style.avgSentenceLength > 0) {
    lines.push(fl(
      `Avg sent: ~${style.avgSentenceLength} words`,
      `${WHITE}Avg sent:${RESET} ~${style.avgSentenceLength} words`,
    ));
  }
  return lines;
}

// ── Summary box (react-doctor style) ────────────────────────────────────

function renderSummaryBox(record: InspirationRecord, width: number): string[] {
  const analysis = record.analysis;
  const colorCount = analysis.colors.length;
  const typoCount = analysis.typography.length;
  const compCount = analysis.components.length;
  const motionCount = analysis.motion.length;
  const totalTokens = colorCount + typoCount + compCount + motionCount;

  const barWidth = Math.max(10, width - 10);
  const bar = scoreBar(totalTokens, Math.max(totalTokens, 1), barWidth);

  const content: FramedLine[] = [
    fl(
      'design-brain (github.com/user/design-brain)',
      `${BOLD}design-brain${RESET} ${DIM}(github.com/user/design-brain)${RESET}`,
    ),
    fl(''),
    fl(
      `${totalTokens} tokens  Captured`,
      `${BOLD}${totalTokens} tokens${RESET}  ${GREEN}Captured${RESET}`,
    ),
    fl(''),
    fl(bar.plain, bar.rendered),
    fl(''),
    fl(
      `✓ ${colorCount} colors  ✓ ${typoCount} type  ✓ ${compCount} comp  ✓ ${motionCount} motion`,
      `${GREEN}✓${RESET} ${colorCount} colors  ${GREEN}✓${RESET} ${typoCount} type  ${GREEN}✓${RESET} ${compCount} comp  ${GREEN}✓${RESET} ${motionCount} motion`,
    ),
  ];

  return framedBox(
    fl('✓ Capture Complete', `${GREEN}✓ Capture Complete${RESET}`),
    null,
    content,
    width,
  );
}

// ── Build full document from state ──────────────────────────────────────

function buildLines(state: LiveState, width: number): string[] {
  const lines: string[] = [];
  const innerWidth = width - 2 - (BOX_PAD * 2);

  // Progress header
  lines.push(...renderProgressHeader(state, width));
  lines.push('');

  // Viewport boxes
  for (const vp of state.viewports) {
    const badge = statusBadgeFl(vp.status, state.spinnerFrame);
    if (vp.analysis) {
      const content = renderViewportContent(vp.analysis, innerWidth);
      lines.push(...framedBox(
        fl(`Viewport: ${vp.label}`),
        badge,
        content,
        width,
      ));
    } else {
      lines.push(...framedBox(
        fl(`Viewport: ${vp.label}`),
        badge,
        [fl('waiting...', `${DIM}waiting...${RESET}`)],
        width,
      ));
    }
    lines.push('');
  }

  // Interactive states
  {
    const intBadge = state.interactiveStatus === 'done'
      ? fl(`✓ ${state.interactiveStates ?? 0} states`, `${GREEN}✓ ${state.interactiveStates ?? 0} states${RESET}`)
      : statusBadgeFl('queued', state.spinnerFrame);
    const intContent = state.interactiveStates !== null
      ? [fl(
          `${state.interactiveStates} interactive state styles captured (hover/focus)`,
        )]
      : [fl('waiting...', `${DIM}waiting...${RESET}`)];
    lines.push(...framedBox(fl('Interactive States'), intBadge, intContent, width));
    lines.push('');
  }

  // Journey
  {
    let journeyBadge: FramedLine;
    if (state.journeyStatus === 'done') {
      journeyBadge = fl(`✓ ${state.journeySteps.length} steps`, `${GREEN}✓ ${state.journeySteps.length} steps${RESET}`);
    } else if (state.journeyStatus === 'in_progress') {
      journeyBadge = statusBadgeFl('extracting', state.spinnerFrame);
    } else {
      journeyBadge = statusBadgeFl('queued', state.spinnerFrame);
    }
    const journeyContent: FramedLine[] = [];
    if (state.journeyMaxSteps <= 0) {
      journeyContent.push(fl('none configured', `${DIM}none configured${RESET}`));
    } else if (state.journeySteps.length > 0) {
      for (const s of state.journeySteps) {
        const short = s.url.length > 50 ? s.url.slice(0, 47) + '...' : s.url;
        journeyContent.push(fl(
          `→ Step ${s.step}: ${short}`,
          `${CYAN}→${RESET} Step ${s.step}: ${DIM}${short}${RESET}`,
        ));
      }
    } else {
      journeyContent.push(fl(
        `waiting... (${state.journeyMaxSteps} steps planned)`,
        `${DIM}waiting... (${state.journeyMaxSteps} steps planned)${RESET}`,
      ));
    }
    lines.push(...framedBox(fl('User Journey'), journeyBadge, journeyContent, width));
    lines.push('');
  }

  // Merged results
  if (state.merged) {
    lines.push(...framedBox(
      fl('Merged Results'),
      fl('✓ done', `${GREEN}✓ done${RESET}`),
      renderMergedContent(state.merged),
      width,
    ));
    lines.push('');
  }

  // Relationships
  if (state.record) {
    const relLines = renderRelationships(state.record);
    if (relLines.length > 0) {
      lines.push(...framedBox(
        fl('Relationships'),
        fl('✓', `${GREEN}✓${RESET}`),
        relLines,
        width,
      ));
      lines.push('');
    }

    // Writing style
    const styleLines = renderWritingStyleContent(state.record);
    if (styleLines.length > 0) {
      lines.push(...framedBox(
        fl('Writing Style'),
        fl('✓', `${GREEN}✓${RESET}`),
        styleLines,
        width,
      ));
      lines.push('');
    }
  }

  // Final summary box (react-doctor style)
  if (state.complete && state.record) {
    lines.push(...renderSummaryBox(state.record, width));
  }

  return lines;
}

// ── Render engine ───────────────────────────────────────────────────────

function createRenderer() {
  let previousLineCount = 0;

  return {
    render(state: LiveState) {
      const width = Math.min(process.stdout.columns ?? 60, 80);
      const lines = buildLines(state, width);

      if (previousLineCount > 0) {
        process.stdout.write(`\x1b[${previousLineCount}A\x1b[J`);
      }

      process.stdout.write(lines.join('\n') + '\n');
      previousLineCount = lines.length;
    },
  };
}

// ── Sequential fallback for non-TTY ─────────────────────────────────────

function createSequentialFallback(): LiveViewCallbacks {
  return {
    onPhaseStart(phase: string) {
      console.log(`\n${BOLD}${MAGENTA}⟐ ${phase}${RESET}`);
    },
    onViewportExtracted(label: string, analysis: DesignAnalysis) {
      console.log(`${GREEN}✔${RESET} Viewport: ${label}. ${DIM}${analysis.colors.length} colors, ${analysis.typography.length} type, ${analysis.components.length} components.${RESET}`);
    },
    onInteractiveStates(count: number) {
      if (count > 0) {
        console.log(`${GREEN}✔${RESET} ${count} interactive state styles captured.`);
      }
    },
    onJourneyStep(step: number, url: string) {
      const short = url.length > 60 ? url.slice(0, 57) + '...' : url;
      console.log(`${GREEN}✔${RESET} Journey step ${step}: ${DIM}${short}${RESET}`);
    },
    onMerged(analysis: DesignAnalysis) {
      console.log(`${GREEN}✔${RESET} Merged. ${DIM}${analysis.colors.length} colors, ${analysis.components.length} components.${RESET}`);
    },
    onAnalysisComplete(record: InspirationRecord) {
      const a = record.analysis;
      const total = a.colors.length + a.typography.length + a.components.length + a.motion.length;
      console.log(`\n${BOLD}${GREEN}✔ Capture complete${RESET} — ${total} tokens from ${record.name}`);
    },
  };
}

// ── Public API ──────────────────────────────────────────────────────────

export interface LiveViewCallbacks {
  onPhaseStart: (phase: string) => void;
  onViewportExtracted: (label: string, analysis: DesignAnalysis) => void;
  onInteractiveStates: (count: number) => void;
  onJourneyStep: (step: number, url: string) => void;
  onMerged: (analysis: DesignAnalysis) => void;
  onAnalysisComplete: (record: InspirationRecord) => void;
}

export interface LiveViewConfig {
  enabled: boolean;
  viewportLabels?: string[];
  journeySteps?: number;
}

export function createLiveView(config: LiveViewConfig): LiveViewCallbacks {
  if (!config.enabled) {
    return {
      onPhaseStart: () => {},
      onViewportExtracted: () => {},
      onInteractiveStates: () => {},
      onJourneyStep: () => {},
      onMerged: () => {},
      onAnalysisComplete: () => {},
    };
  }

  // Non-TTY fallback — react-doctor style sequential checkmarks
  if (!process.stdout.isTTY) {
    return createSequentialFallback();
  }

  const viewportLabels = config.viewportLabels ?? ['desktop', 'tablet', 'mobile'];
  const journeyMaxSteps = config.journeySteps ?? 3;

  // Total phases: viewports + interactive + journey + merge + analysis
  const totalPhases = viewportLabels.length + 4;

  const state: LiveState = {
    url: '',
    phase: null,
    phasesCompleted: 0,
    totalPhases,
    viewports: viewportLabels.map(label => ({
      label,
      status: 'queued' as const,
      analysis: null,
    })),
    interactiveStates: null,
    interactiveStatus: 'queued',
    journeyMaxSteps,
    journeySteps: [],
    journeyStatus: 'queued',
    merged: null,
    record: null,
    complete: false,
    spinnerFrame: 0,
  };

  const renderer = createRenderer();

  // Mark first viewport as extracting
  if (state.viewports.length > 0) {
    state.viewports[0].status = 'extracting';
  }

  // Spinner animation
  const spinnerTimer = setInterval(() => {
    state.spinnerFrame = (state.spinnerFrame + 1) % SPINNER_FRAMES.length;
    if (!state.complete) {
      renderer.render(state);
    }
  }, SPINNER_INTERVAL_MS);

  // Initial skeleton render
  renderer.render(state);

  return {
    onPhaseStart(phase: string) {
      state.phase = phase;
      const match = phase.match(/Capturing\s+(https?:\/\/\S+)/);
      if (match) {
        state.url = match[1];
      }
      renderer.render(state);
    },

    onViewportExtracted(label: string, analysis: DesignAnalysis) {
      const vp = state.viewports.find(v => v.label === label);
      if (vp) {
        vp.status = 'done';
        vp.analysis = analysis;
      } else {
        state.viewports.push({ label, status: 'done', analysis });
      }
      state.phasesCompleted++;

      // Advance next queued viewport to extracting
      const nextQueued = state.viewports.find(v => v.status === 'queued');
      if (nextQueued) {
        nextQueued.status = 'extracting';
      }

      renderer.render(state);
    },

    onInteractiveStates(count: number) {
      state.interactiveStates = count;
      state.interactiveStatus = 'done';
      state.phasesCompleted++;
      state.journeyStatus = 'in_progress';
      renderer.render(state);
    },

    onJourneyStep(step: number, url: string) {
      state.journeySteps.push({ step, url });
      state.journeyStatus = 'in_progress';
      renderer.render(state);
    },

    onMerged(analysis: DesignAnalysis) {
      state.merged = analysis;
      state.journeyStatus = 'done';
      state.phasesCompleted += 2; // journey + merge
      renderer.render(state);
    },

    onAnalysisComplete(record: InspirationRecord) {
      state.record = record;
      state.phasesCompleted = state.totalPhases;
      state.complete = true;
      clearInterval(spinnerTimer);
      renderer.render(state);
    },
  };
}
