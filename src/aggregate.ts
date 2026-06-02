import type {
  ColorToken,
  ComponentToken,
  InspirationRecord,
  MotionToken,
  TypographyToken,
} from './types.js';

export function aggregateColors(records: InspirationRecord[]): ColorToken[] {
  const map = new Map<string, ColorToken>();
  for (const record of records) {
    for (const color of record.analysis.colors) {
      const existing = map.get(color.hex) ?? { hex: color.hex, count: 0, samples: [] };
      existing.count += color.count;
      for (const sample of color.samples) {
        if (existing.samples.length < 6 && !existing.samples.includes(sample)) {
          existing.samples.push(sample);
        }
      }
      map.set(color.hex, existing);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 40);
}

export function aggregateTypography(records: InspirationRecord[]): TypographyToken[] {
  const map = new Map<string, TypographyToken>();
  for (const record of records) {
    for (const token of record.analysis.typography) {
      const key = `${token.fontFamily}|${token.fontSize}|${token.fontWeight}|${token.lineHeight}`;
      const existing = map.get(key) ?? { ...token, count: 0 };
      existing.count += token.count;
      map.set(key, existing);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 60);
}

export function aggregateComponents(records: InspirationRecord[]): Array<ComponentToken & { count: number }> {
  const map = new Map<string, ComponentToken & { count: number }>();
  for (const record of records) {
    for (const token of record.analysis.components) {
      const key = `${token.kind}|${token.tag}|${token.selector}`;
      const existing = map.get(key) ?? { ...token, count: 0 };
      existing.count += 1;
      map.set(key, existing);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 120);
}

export function aggregateMotion(records: InspirationRecord[]): Array<MotionToken & { count: number }> {
  const map = new Map<string, MotionToken & { count: number }>();
  for (const record of records) {
    for (const token of record.analysis.motion) {
      const key = `${token.selector}|${token.transition}|${token.animation}|${token.transform}`;
      const existing = map.get(key) ?? { ...token, count: 0 };
      existing.count += 1;
      map.set(key, existing);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 140);
}
