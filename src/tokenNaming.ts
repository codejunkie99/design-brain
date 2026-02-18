import type { ProjectRecord } from './types.js';
import {
  aggregateColors,
  aggregateTypography,
  aggregateMotion,
} from './aggregate.js';

const CSS_NAMED_COLORS: Array<[string, number, number, number]> = [
  ['black', 0, 0, 0],
  ['white', 255, 255, 255],
  ['red', 255, 0, 0],
  ['lime', 0, 255, 0],
  ['blue', 0, 0, 255],
  ['yellow', 255, 255, 0],
  ['cyan', 0, 255, 255],
  ['magenta', 255, 0, 255],
  ['silver', 192, 192, 192],
  ['gray', 128, 128, 128],
  ['maroon', 128, 0, 0],
  ['olive', 128, 128, 0],
  ['green', 0, 128, 0],
  ['purple', 128, 0, 128],
  ['teal', 0, 128, 128],
  ['navy', 0, 0, 128],
  ['orange', 255, 165, 0],
  ['pink', 255, 192, 203],
  ['coral', 255, 127, 80],
  ['salmon', 250, 128, 114],
  ['tomato', 255, 99, 71],
  ['crimson', 220, 20, 60],
  ['firebrick', 178, 34, 34],
  ['darkred', 139, 0, 0],
  ['indianred', 205, 92, 92],
  ['lightcoral', 240, 128, 128],
  ['orangered', 255, 69, 0],
  ['darkorange', 255, 140, 0],
  ['gold', 255, 215, 0],
  ['khaki', 240, 230, 140],
  ['darkkhaki', 189, 183, 107],
  ['peachpuff', 255, 218, 185],
  ['moccasin', 255, 228, 181],
  ['papayawhip', 245, 222, 179],
  ['lemonchiffon', 255, 250, 205],
  ['lightyellow', 255, 255, 224],
  ['wheat', 245, 222, 179],
  ['tan', 210, 180, 140],
  ['chocolate', 210, 105, 30],
  ['saddlebrown', 139, 69, 19],
  ['sienna', 160, 82, 45],
  ['brown', 165, 42, 42],
  ['peru', 205, 133, 63],
  ['sandybrown', 244, 164, 96],
  ['rosybrown', 188, 143, 143],
  ['burlywood', 222, 184, 135],
  ['bisque', 255, 228, 196],
  ['blanchedalmond', 255, 235, 205],
  ['antiquewhite', 250, 235, 215],
  ['linen', 250, 240, 230],
  ['lavenderblush', 255, 240, 245],
  ['mistyrose', 255, 228, 225],
  ['snow', 255, 250, 250],
  ['seashell', 255, 245, 238],
  ['floralwhite', 255, 250, 240],
  ['ivory', 255, 255, 240],
  ['honeydew', 240, 255, 240],
  ['mintcream', 245, 255, 250],
  ['azure', 240, 255, 255],
  ['aliceblue', 240, 248, 255],
  ['ghostwhite', 248, 248, 255],
  ['whitesmoke', 245, 245, 245],
  ['gainsboro', 220, 220, 220],
  ['lightgray', 211, 211, 211],
  ['darkgray', 169, 169, 169],
  ['dimgray', 105, 105, 105],
  ['lightslategray', 119, 136, 153],
  ['slategray', 112, 128, 144],
  ['darkslategray', 47, 79, 79],
  ['greenyellow', 173, 255, 47],
  ['chartreuse', 127, 255, 0],
  ['lawngreen', 124, 252, 0],
  ['limegreen', 50, 205, 50],
  ['palegreen', 152, 251, 152],
  ['lightgreen', 144, 238, 144],
  ['springgreen', 0, 255, 127],
  ['mediumspringgreen', 0, 250, 154],
  ['darkgreen', 0, 100, 0],
  ['forestgreen', 34, 139, 34],
  ['seagreen', 46, 139, 87],
  ['mediumseagreen', 60, 179, 113],
  ['mediumaquamarine', 102, 205, 170],
  ['darkseagreen', 143, 188, 143],
  ['aquamarine', 127, 255, 212],
  ['paleturquoise', 175, 238, 238],
  ['lightcyan', 224, 255, 255],
  ['darkturquoise', 0, 206, 209],
  ['turquoise', 64, 224, 208],
  ['mediumturquoise', 72, 209, 204],
  ['lightseagreen', 32, 178, 170],
  ['cadetblue', 95, 158, 160],
  ['darkcyan', 0, 139, 139],
  ['steelblue', 70, 130, 180],
  ['lightsteelblue', 176, 196, 222],
  ['powderblue', 176, 224, 230],
  ['lightblue', 173, 216, 230],
  ['skyblue', 135, 206, 235],
  ['lightskyblue', 135, 206, 250],
  ['deepskyblue', 0, 191, 255],
  ['dodgerblue', 30, 144, 255],
  ['cornflowerblue', 100, 149, 237],
  ['mediumslateblue', 123, 104, 238],
  ['royalblue', 65, 105, 225],
  ['mediumblue', 0, 0, 205],
  ['darkblue', 0, 0, 139],
  ['midnightblue', 25, 25, 112],
  ['indigo', 75, 0, 130],
  ['darkslateblue', 72, 61, 139],
  ['slateblue', 106, 90, 205],
  ['blueviolet', 138, 43, 226],
  ['mediumpurple', 147, 112, 219],
  ['darkorchid', 153, 50, 204],
  ['darkviolet', 148, 0, 211],
  ['darkmagenta', 139, 0, 139],
  ['plum', 221, 160, 221],
  ['violet', 238, 130, 238],
  ['orchid', 218, 112, 214],
  ['mediumorchid', 186, 85, 211],
  ['mediumvioletred', 199, 21, 133],
  ['deeppink', 255, 20, 147],
  ['hotpink', 255, 105, 180],
  ['lavender', 230, 230, 250],
  ['thistle', 216, 191, 216],
  ['fuchsia', 255, 0, 255],
  ['aqua', 0, 255, 255],
  ['cornsilk', 255, 248, 220],
  ['oldlace', 253, 245, 230],
  ['navajowhite', 255, 222, 173],
  ['goldenrod', 218, 165, 32],
  ['darkgoldenrod', 184, 134, 11],
  ['yellowgreen', 154, 205, 50],
  ['olivedrab', 107, 142, 35],
  ['darkolivegreen', 85, 107, 47],
];

function parseHex(hex: string): [number, number, number] {
  let h = hex.replace(/^#/, '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return [r, g, b];
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

export function nameColor(hex: string): string {
  const [r, g, b] = parseHex(hex);
  let bestName = 'unknown';
  let bestDist = Infinity;

  for (const [name, cr, cg, cb] of CSS_NAMED_COLORS) {
    const dist = colorDistance(r, g, b, cr, cg, cb);
    if (dist < bestDist) {
      bestDist = dist;
      bestName = name;
    }
  }

  return bestName;
}

export function nameTypographySize(fontSize: string): string {
  const match = fontSize.match(/^(\d+(?:\.\d+)?)\s*px$/i);
  if (!match) return fontSize;
  const px = parseFloat(match[1]);
  if (px < 12) return 'xs';
  if (px < 15) return 'sm';
  if (px < 19) return 'md';
  if (px < 25) return 'lg';
  return 'xl';
}

function parseDurationMs(duration: string): number {
  const msMatch = duration.match(/^(\d+(?:\.\d+)?)\s*ms$/i);
  if (msMatch) return parseFloat(msMatch[1]);
  const sMatch = duration.match(/^(\d+(?:\.\d+)?)\s*s$/i);
  if (sMatch) return parseFloat(sMatch[1]) * 1000;
  return -1;
}

export function nameMotionDuration(duration: string): string {
  const ms = parseDurationMs(duration);
  if (ms < 0) return duration;
  if (ms < 100) return 'instant';
  if (ms <= 200) return 'quick';
  if (ms <= 400) return 'normal';
  return 'slow';
}

export function nameTokens(project: ProjectRecord): Map<string, string> {
  const map = new Map<string, string>();
  const usedNames = new Map<string, number>();

  function uniqueName(base: string): string {
    const count = usedNames.get(base) ?? 0;
    usedNames.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  }

  for (const color of aggregateColors(project.inspirations)) {
    const name = uniqueName(nameColor(color.hex));
    map.set(color.hex, name);
  }

  const seenSizes = new Set<string>();
  for (const typo of aggregateTypography(project.inspirations)) {
    if (!seenSizes.has(typo.fontSize)) {
      seenSizes.add(typo.fontSize);
      map.set(typo.fontSize, nameTypographySize(typo.fontSize));
    }
  }

  const seenDurations = new Set<string>();
  for (const motion of aggregateMotion(project.inspirations)) {
    for (const t of motion.transitions ?? []) {
      if (t.duration && !seenDurations.has(t.duration)) {
        seenDurations.add(t.duration);
        map.set(t.duration, nameMotionDuration(t.duration));
      }
    }
  }

  return map;
}
