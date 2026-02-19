import type {
  ComponentToken,
  DesignAnalysis,
  ScanScore,
} from './types.js';

export interface ScanTokens {
  colorCount: number;
  uniqueHues: number;
  typographyFamilies: string[];
  typographySizes: string[];
  componentKinds: string[];
  motionCount: number;
  hasTransitions: boolean;
  hasAnimations: boolean;
  spacingValues: number[];
  gridAligned: number;
  gridTotal: number;
}

const URL_RE = /^https?:\/\//i;
const BARE_DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/i;

export function looksLikeUrl(input: string): boolean {
  const trimmed = input.trim();
  return URL_RE.test(trimmed) || BARE_DOMAIN_RE.test(trimmed);
}

export function normalizeToUrl(input: string): string {
  const trimmed = input.trim();
  if (URL_RE.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function hueFromHex(hex: string): number {
  const raw = hex.replace('#', '');
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) return 0;

  let h: number;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return h;
}

function saturationFromHex(hex: string): number {
  const raw = hex.replace('#', '');
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return 0;
  const delta = max - min;
  return l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
}

function lightnessFromHex(hex: string): number {
  const raw = hex.replace('#', '');
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;

  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
}

export { hueFromHex, saturationFromHex, lightnessFromHex };

function extractSpacingValues(components: ComponentToken[]): number[] {
  const values: number[] = [];
  const spacingProps = [
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'gap', 'row-gap', 'column-gap',
  ];

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
  return values;
}

export function designAnalysisToScanTokens(analysis: DesignAnalysis): ScanTokens {
  const hues = new Set<number>();
  for (const color of analysis.colors.slice(0, 20)) {
    if (color.hex.length === 7) {
      hues.add(Math.round(hueFromHex(color.hex) / 30) * 30);
    }
  }

  const families = new Set<string>();
  const sizes = new Set<string>();
  for (const t of analysis.typography) {
    families.add(t.fontFamily.toLowerCase());
    sizes.add(t.fontSize);
  }

  const kinds = new Set<string>();
  for (const c of analysis.components) {
    kinds.add(c.kind);
  }

  const hasTransitions = analysis.motion.some((m) => m.transition && m.transition !== 'none');
  const hasAnimations = analysis.motion.some((m) => m.animation && m.animation !== 'none');
  const spacingValues = extractSpacingValues(analysis.components);

  let gridAligned = 0;
  for (const v of spacingValues) {
    if (v % 4 === 0) gridAligned++;
  }

  return {
    colorCount: analysis.colors.length,
    uniqueHues: hues.size,
    typographyFamilies: [...families],
    typographySizes: [...sizes],
    componentKinds: [...kinds],
    motionCount: analysis.motion.length,
    hasTransitions,
    hasAnimations,
    spacingValues,
    gridAligned,
    gridTotal: spacingValues.length,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeScore(tokens: ScanTokens): ScanScore {
  const colorRaw = tokens.colorCount === 0
    ? 0
    : tokens.uniqueHues >= 3 && tokens.uniqueHues <= 8
      ? 80 + Math.min(20, tokens.colorCount)
      : tokens.uniqueHues < 3
        ? 40 + tokens.uniqueHues * 10
        : Math.max(30, 100 - (tokens.uniqueHues - 8) * 8);

  const familyScore = tokens.typographyFamilies.length >= 1 && tokens.typographyFamilies.length <= 3
    ? 70 : tokens.typographyFamilies.length === 0 ? 0 : 40;
  const sizeScore = tokens.typographySizes.length >= 3 ? 30 : tokens.typographySizes.length * 10;
  const typographyRaw = familyScore + sizeScore;

  const spacingRaw = tokens.gridTotal === 0
    ? 50
    : Math.round((tokens.gridAligned / tokens.gridTotal) * 100);

  const motionRaw = tokens.motionCount === 0
    ? 30
    : tokens.hasTransitions && tokens.hasAnimations
      ? Math.min(100, 70 + tokens.motionCount)
      : tokens.hasTransitions
        ? Math.min(90, 60 + tokens.motionCount * 2)
        : 50;

  const color = clamp(Math.round(colorRaw), 0, 100);
  const typography = clamp(Math.round(typographyRaw), 0, 100);
  const spacing = clamp(Math.round(spacingRaw), 0, 100);
  const motion = clamp(Math.round(motionRaw), 0, 100);
  const overall = clamp(Math.round((color + typography + spacing + motion) / 4), 0, 100);

  return { overall, color, typography, spacing, motion };
}
