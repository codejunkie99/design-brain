import type { ColorToken } from './types.js';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SWATCH_SIZE = 60;
const SWATCH_GAP = 12;
const COLS = 5;
const MAX_COLORS = 20;
const FONT = 'system-ui, -apple-system, sans-serif';

export function generatePaletteSvg(colors: ColorToken[], title: string): string {
  const items = colors.slice(0, MAX_COLORS);

  if (items.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 60">\n`
      + `  <text x="10" y="30" font-family="${FONT}" font-size="14" fill="#888">No colors captured</text>\n`
      + `</svg>`;
  }

  const maxCount = Math.max(...items.map((c) => c.count), 1);
  const rows = Math.ceil(items.length / COLS);
  const cellW = SWATCH_SIZE + SWATCH_GAP;
  const rowH = SWATCH_SIZE + 60;
  const width = COLS * cellW + SWATCH_GAP;
  const height = 40 + rows * rowH + 10;

  const rects = items.map((color, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = SWATCH_GAP + col * cellW;
    const y = 40 + row * rowH;
    const barW = Math.round((color.count / maxCount) * SWATCH_SIZE);
    const hex = escapeXml(color.hex);

    return [
      `  <rect x="${x}" y="${y}" width="${SWATCH_SIZE}" height="${SWATCH_SIZE}" fill="${hex}" rx="4"/>`,
      `  <text x="${x}" y="${y + SWATCH_SIZE + 14}" font-family="${FONT}" font-size="10" fill="#333">${hex}</text>`,
      `  <rect x="${x}" y="${y + SWATCH_SIZE + 20}" width="${SWATCH_SIZE}" height="6" fill="#eee" rx="2"/>`,
      `  <rect x="${x}" y="${y + SWATCH_SIZE + 20}" width="${barW}" height="6" fill="${hex}" rx="2"/>`,
      `  <text x="${x}" y="${y + SWATCH_SIZE + 40}" font-family="${FONT}" font-size="9" fill="#888">${color.count}</text>`,
    ].join('\n');
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">\n`
    + `  <text x="${SWATCH_GAP}" y="24" font-family="${FONT}" font-size="16" font-weight="600" fill="#111">${escapeXml(title)} — Color Palette</text>\n`
    + rects.join('\n')
    + `\n</svg>`;
}
