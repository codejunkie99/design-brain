import { aggregateColors, aggregateTypography, aggregateComponents, aggregateMotion } from './aggregate.js';
import { designAnalysisToScanTokens, computeScore, looksLikeUrl, normalizeToUrl, hueFromHex, saturationFromHex, lightnessFromHex } from './scan.js';
import { assignPersona } from './persona.js';
import { loadDatabase, ensureProject, saveTasteProfile, loadTasteProfile, saveDatabase } from './store.js';
import { captureDesignFromUrl } from './extractFromUrl.js';
import { enrichWithLlm } from './llm.js';
import { ingestInspiration } from './commands.js';
import { makeId, nowIso, slugify } from './util.js';
import type {
  ColorToken,
  ComponentToken,
  InspirationRecord,
  LlmConfig,
  MotionToken,
  TasteColorPreference,
  TasteComponentPreference,
  TasteConflict,
  TasteMotionPreference,
  TasteProfile,
  TasteSpacingPreference,
  TasteTypographyPreference,
  TypographyToken,
} from './types.js';
import type { ScanTokens } from './scan.js';

export interface TasteBuildOptions {
  rootDir: string;
  projectId: string;
  projectName?: string;
  urls: string[];
  headed?: boolean;
  llm?: LlmConfig;
}

// ── Derive functions ───────────────────────────────────────

function classifyHarmony(hues: number[]): string {
  if (hues.length <= 1) return 'monochromatic';

  const sorted = [...hues].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(sorted[i] - sorted[i - 1]);
  }
  gaps.push(360 - sorted[sorted.length - 1] + sorted[0]);

  const maxGap = Math.max(...gaps);
  const minGap = Math.min(...gaps);
  const avgGap = 360 / hues.length;
  const spread = maxGap - minGap;

  if (spread < 40) return 'analogous';
  if (hues.length === 2 && Math.abs(gaps[0] - 180) < 30) return 'complementary';
  if (hues.length === 3 && Math.abs(avgGap - 120) < 25) return 'triadic';
  if (maxGap > 200) return 'split-complementary';
  return 'analogous';
}

function deriveColorPreference(
  colors: ColorToken[],
  inspirations: InspirationRecord[],
): TasteColorPreference {
  const palette: TasteColorPreference['palette'] = [];
  const roles = ['primary', 'secondary', 'accent', 'background', 'text', 'surface'];

  for (let i = 0; i < Math.min(colors.length, roles.length); i++) {
    const color = colors[i];
    const source = inspirations.find((ins) =>
      ins.analysis.colors.some((c) => c.hex.toUpperCase() === color.hex.toUpperCase()),
    );
    palette.push({
      hex: color.hex,
      role: roles[i],
      source: source?.url ?? source?.name ?? 'unknown',
    });
  }

  const validHexes = colors
    .filter((c) => c.hex.length === 7)
    .slice(0, 12);

  const hues = [...new Set(validHexes.map((c) => Math.round(hueFromHex(c.hex) / 30) * 30))];
  const saturations = validHexes.map((c) => saturationFromHex(c.hex));
  const lightnesses = validHexes.map((c) => lightnessFromHex(c.hex));

  const avgSat = saturations.length > 0
    ? saturations.reduce((a, b) => a + b, 0) / saturations.length
    : 0.5;
  const avgLight = lightnesses.length > 0
    ? lightnesses.reduce((a, b) => a + b, 0) / lightnesses.length
    : 0.5;

  const allHues = validHexes.map((c) => hueFromHex(c.hex));
  const minHue = allHues.length > 0 ? Math.min(...allHues) : 0;
  const maxHue = allHues.length > 0 ? Math.max(...allHues) : 360;

  return {
    palette,
    harmony: classifyHarmony(hues),
    hueRange: { min: Math.round(minHue), max: Math.round(maxHue) },
    saturationBias: avgSat > 0.6 ? 'vibrant' : avgSat < 0.3 ? 'muted' : 'neutral',
    lightnessBias: avgLight > 0.65 ? 'light' : avgLight < 0.35 ? 'dark' : 'balanced',
  };
}

function deriveTypographyPreference(
  typography: TypographyToken[],
): TasteTypographyPreference {
  const familyCount = new Map<string, number>();
  for (const t of typography) {
    const fam = t.fontFamily.toLowerCase();
    familyCount.set(fam, (familyCount.get(fam) ?? 0) + t.count);
  }

  const sorted = [...familyCount.entries()].sort((a, b) => b[1] - a[1]);
  const primaryFont = sorted[0]?.[0] ?? 'system-ui';
  const secondaryFont = sorted[1]?.[0] ?? null;

  const sizes = [...new Set(typography.map((t) => t.fontSize))];
  const numericSizes = sizes
    .map((s) => parseFloat(s))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  let scaleType = 'custom';
  if (numericSizes.length >= 3) {
    const ratios = [];
    for (let i = 1; i < numericSizes.length; i++) {
      ratios.push(numericSizes[i] / numericSizes[i - 1]);
    }
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    if (Math.abs(avgRatio - 1.25) < 0.1) scaleType = 'major-third';
    else if (Math.abs(avgRatio - 1.333) < 0.1) scaleType = 'perfect-fourth';
    else if (Math.abs(avgRatio - 1.5) < 0.1) scaleType = 'perfect-fifth';
    else if (Math.abs(avgRatio - 1.618) < 0.15) scaleType = 'golden-ratio';
    else scaleType = 'linear';
  }

  const weights = typography.map((t) => t.fontWeight).filter((w) => w !== 'unknown');
  const numericWeights = weights.map((w) => parseInt(w, 10)).filter((n) => !isNaN(n)).sort((a, b) => a - b);

  return {
    primaryFont,
    secondaryFont,
    scaleType,
    sizes: sizes.slice(0, 8),
    weightRange: {
      min: numericWeights[0]?.toString() ?? '400',
      max: numericWeights[numericWeights.length - 1]?.toString() ?? '700',
    },
  };
}

function deriveSpacingPreference(
  components: Array<ComponentToken & { count: number }>,
): TasteSpacingPreference {
  const spacingProps = [
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'gap', 'row-gap', 'column-gap',
  ];

  const values: number[] = [];
  for (const comp of components) {
    for (const prop of spacingProps) {
      const val = comp.styles[prop];
      if (!val) continue;
      const nums = val.match(/(\d+(?:\.\d+)?)/g);
      if (nums) {
        for (const n of nums) {
          const parsed = parseFloat(n);
          if (parsed > 0 && parsed < 200) values.push(parsed);
        }
      }
    }
  }

  if (values.length === 0) {
    return { baseUnit: 8, scale: [4, 8, 12, 16, 24, 32, 48, 64], gridAlignmentRatio: 0 };
  }

  const mod4 = values.filter((v) => v % 4 === 0).length;
  const mod8 = values.filter((v) => v % 8 === 0).length;
  const baseUnit = mod8 / values.length > 0.6 ? 8 : 4;

  const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
  const scale = uniqueValues
    .filter((v) => v % baseUnit === 0)
    .slice(0, 10);

  const gridAlignmentRatio = values.length > 0
    ? Math.round((mod4 / values.length) * 100) / 100
    : 0;

  return {
    baseUnit,
    scale: scale.length > 0 ? scale : [4, 8, 12, 16, 24, 32, 48, 64],
    gridAlignmentRatio,
  };
}

function deriveMotionPreference(
  motion: Array<MotionToken & { count: number }>,
): TasteMotionPreference {
  if (motion.length === 0) {
    return { easing: 'ease', durations: [], intensity: 'none' };
  }

  const easingCount = new Map<string, number>();
  const durationCount = new Map<string, number>();

  for (const m of motion) {
    // Extract easing from raw string first (structured fields may have split cubic-bezier on commas)
    let easingFromRaw: string | null = null;
    if (m.transition && m.transition !== 'none' && m.transition !== 'all') {
      const cubicMatch = m.transition.match(/cubic-bezier\([^)]+\)/);
      if (cubicMatch) {
        easingFromRaw = cubicMatch[0];
      } else {
        const keyword = m.transition.match(/\b(ease-in-out|ease-in|ease-out|ease|linear)\b/);
        if (keyword) easingFromRaw = keyword[0];
      }
    }

    if (easingFromRaw) {
      easingCount.set(easingFromRaw, (easingCount.get(easingFromRaw) ?? 0) + m.count);
    } else {
      // Fall back to structured fields only if raw string didn't yield a result
      for (const t of m.transitions ?? []) {
        if (t.timingFunction && t.timingFunction.length > 3) {
          easingCount.set(t.timingFunction, (easingCount.get(t.timingFunction) ?? 0) + m.count);
        }
      }
      for (const a of m.animations ?? []) {
        if (a.timingFunction && a.timingFunction.length > 3) {
          easingCount.set(a.timingFunction, (easingCount.get(a.timingFunction) ?? 0) + m.count);
        }
      }
    }

    // Durations: prefer structured, fall back to raw
    let gotDuration = false;
    for (const t of m.transitions ?? []) {
      if (t.duration && t.duration !== '0s') {
        durationCount.set(t.duration, (durationCount.get(t.duration) ?? 0) + m.count);
        gotDuration = true;
      }
    }
    for (const a of m.animations ?? []) {
      if (a.duration && a.duration !== '0s') {
        durationCount.set(a.duration, (durationCount.get(a.duration) ?? 0) + m.count);
        gotDuration = true;
      }
    }
    if (!gotDuration && m.transition && m.transition !== 'none' && m.transition !== 'all') {
      const durMatch = m.transition.match(/([\d.]+)(m?s)\b/);
      if (durMatch) {
        durationCount.set(`${durMatch[1]}${durMatch[2]}`, (durationCount.get(`${durMatch[1]}${durMatch[2]}`) ?? 0) + m.count);
      }
    }
  }

  const topEasing = [...easingCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'ease';
  const durations = [...durationCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([d]) => d);

  const durationMs = durations.map((d) => {
    const match = d.match(/([\d.]+)(s|ms)/);
    if (!match) return 300;
    return match[2] === 's' ? parseFloat(match[1]) * 1000 : parseFloat(match[1]);
  });
  // Filter out animation loops (>10s) for intensity classification
  const uiDurationMs = durationMs.filter((ms) => ms <= 10_000);
  const avgDuration = uiDurationMs.length > 0
    ? uiDurationMs.reduce((a, b) => a + b, 0) / uiDurationMs.length
    : 0;

  let intensity: TasteMotionPreference['intensity'];
  if (motion.length <= 3 && avgDuration < 200) intensity = 'subtle';
  else if (motion.length <= 10 && avgDuration < 400) intensity = 'moderate';
  else intensity = 'expressive';

  return { easing: topEasing, durations, intensity };
}

function deriveComponentPreference(
  components: Array<ComponentToken & { count: number }>,
  inspirations: InspirationRecord[],
): TasteComponentPreference {
  const radiusValues: string[] = [];
  const shadowValues: string[] = [];

  for (const comp of components) {
    const br = comp.styles['border-radius'];
    if (br && br !== '0px') radiusValues.push(br);
    const bs = comp.styles['box-shadow'];
    if (bs && bs !== 'none') shadowValues.push(bs);
  }

  const radiusCounts = new Map<string, number>();
  for (const r of radiusValues) {
    radiusCounts.set(r, (radiusCounts.get(r) ?? 0) + 1);
  }
  const topRadius = [...radiusCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '0px';

  let shadowStyle: TasteComponentPreference['shadowStyle'] = 'none';
  if (shadowValues.length > 0) {
    const hasBigShadow = shadowValues.some((s) => {
      const nums = s.match(/(\d+)px/g);
      return nums && nums.some((n) => parseInt(n) > 20);
    });
    if (hasBigShadow) shadowStyle = 'dramatic';
    else if (shadowValues.length > components.length * 0.3) shadowStyle = 'elevated';
    else shadowStyle = 'subtle';
  }

  return {
    cherryPicks: [],
    borderRadius: topRadius,
    shadowStyle,
  };
}

// ── Conflict detection ─────────────────────────────────────

function detectConflicts(inspirations: InspirationRecord[]): TasteConflict[] {
  const conflicts: TasteConflict[] = [];

  // Font conflict: different primaries across sources
  const fontsBySource = new Map<string, string>();
  for (const ins of inspirations) {
    const topFont = ins.analysis.typography
      .sort((a, b) => b.count - a.count)[0]?.fontFamily;
    if (topFont) fontsBySource.set(ins.name, topFont);
  }
  const uniqueFonts = [...new Set(fontsBySource.values())];
  if (uniqueFonts.length > 2) {
    conflicts.push({
      dimension: 'typography',
      description: `Sources use ${uniqueFonts.length} different primary fonts: ${uniqueFonts.slice(0, 4).join(', ')}`,
      options: uniqueFonts.slice(0, 4),
      resolved: false,
    });
  }

  // Color temperature conflict
  const huesBySource: number[][] = [];
  for (const ins of inspirations) {
    const hues = ins.analysis.colors
      .filter((c) => c.hex.length === 7)
      .slice(0, 5)
      .map((c) => hueFromHex(c.hex));
    if (hues.length > 0) huesBySource.push(hues);
  }
  if (huesBySource.length >= 2) {
    const avgHues = huesBySource.map((hs) => hs.reduce((a, b) => a + b, 0) / hs.length);
    const hueSpread = Math.max(...avgHues) - Math.min(...avgHues);
    if (hueSpread > 120) {
      conflicts.push({
        dimension: 'color',
        description: `Color palettes span ${Math.round(hueSpread)}° of hue — sources have different color temperatures`,
        options: ['warm bias', 'cool bias', 'mixed palette'],
        resolved: false,
      });
    }
  }

  return conflicts;
}

// ── Main builder ───────────────────────────────────────────

export async function buildTasteProfile(options: TasteBuildOptions): Promise<TasteProfile> {
  const { rootDir, projectId, projectName, urls, llm } = options;
  const db = await loadDatabase(rootDir);
  const project = ensureProject(db, { projectId, projectName });

  // Step 1-2: Scan + ingest each URL
  for (const rawUrl of urls) {
    const url = looksLikeUrl(rawUrl) ? normalizeToUrl(rawUrl) : rawUrl;

    await ingestInspiration({
      rootDir,
      project: project.id,
      projectName: project.name,
      url,
      tags: ['taste-source'],
      skipVisuals: true,
      llm,
    });
  }

  // Step 3: Reload to get all inspirations
  const freshDb = await loadDatabase(rootDir);
  const freshProject = freshDb.projects.find((p) => p.id === project.id);
  if (!freshProject) throw new Error(`Project not found after ingest: ${project.id}`);

  const inspirations = freshProject.inspirations;
  if (inspirations.length === 0) {
    throw new Error('No inspirations found — nothing to build taste from');
  }

  // Step 4: Aggregate
  const colors = aggregateColors(inspirations);
  const typography = aggregateTypography(inspirations);
  const components = aggregateComponents(inspirations);
  const motion = aggregateMotion(inspirations);

  // Step 5: Derive preferences
  const colorPref = deriveColorPreference(colors, inspirations);
  const typographyPref = deriveTypographyPreference(typography);
  const spacingPref = deriveSpacingPreference(components);
  const motionPref = deriveMotionPreference(motion);
  const componentPref = deriveComponentPreference(components, inspirations);

  // Step 6: Score + persona
  const mergedAnalysis = {
    colors,
    typography,
    components: components.map(({ count, ...rest }) => rest),
    motion: motion.map(({ count, ...rest }) => rest),
    layout: inspirations.flatMap((i) => i.analysis.layout).slice(0, 50),
    cssVariables: {},
  };
  const tokens = designAnalysisToScanTokens(mergedAnalysis);
  const score = computeScore(tokens);
  const persona = assignPersona(score);

  // Step 7: Detect conflicts
  const conflicts = detectConflicts(inspirations);

  // Step 8: LLM narrative
  let narrative: string | undefined;
  let principles: string[] | undefined;
  if (llm) {
    try {
      const enrichment = await enrichWithLlm({
        llm,
        sourceName: `Taste profile for ${project.name}`,
        analysis: mergedAnalysis,
      });
      narrative = enrichment.summary;
      principles = enrichment.designPrinciples;
    } catch {
      // LLM enrichment is optional
    }
  }

  // Step 9: Build + save
  const existing = await loadTasteProfile(rootDir, project.id);
  const version = existing ? existing.version + 1 : 1;

  const profile: TasteProfile = {
    id: project.id,
    name: project.name,
    version,
    sourceInspirationIds: inspirations.map((i) => i.id),
    sourceUrls: inspirations.filter((i) => i.url).map((i) => i.url!),
    persona,
    aggregateScore: score,
    color: colorPref,
    typography: typographyPref,
    spacing: spacingPref,
    motion: motionPref,
    components: componentPref,
    decisions: existing?.decisions ?? [],
    conflicts,
    narrative,
    principles,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };

  await saveTasteProfile(rootDir, profile);

  // Step 10: Return
  return profile;
}
