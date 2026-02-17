import type { ColorToken, ComponentToken } from './types.js';
import { truncate } from './util.js';

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

const COMP_GROUP_W = 220;
const COMP_ITEM_H = 52;
const COMP_GAP = 16;

export function generateComponentsSvg(components: ComponentToken[], title: string): string {
  if (components.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 60">\n`
      + `  <text x="10" y="30" font-family="${FONT}" font-size="14" fill="#888">No components captured</text>\n`
      + `</svg>`;
  }

  const groups = new Map<string, ComponentToken[]>();
  for (const comp of components) {
    const list = groups.get(comp.kind) ?? [];
    list.push(comp);
    groups.set(comp.kind, list);
  }

  const sortedGroups = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  const colOffsets = [COMP_GAP, COMP_GROUP_W + COMP_GAP * 2];
  const colHeights = [50, 50];
  const groupSvgs: string[] = [];

  for (const [kind, items] of sortedGroups) {
    const col = colHeights[0] <= colHeights[1] ? 0 : 1;
    const x = colOffsets[col];
    let y = colHeights[col];

    groupSvgs.push(
      `  <text x="${x}" y="${y + 16}" font-family="${FONT}" font-size="13" font-weight="600" fill="#333">${escapeXml(kind)} (${items.length})</text>`
    );
    y += 24;

    const visible = items.slice(0, 8);
    const boxH = visible.length * COMP_ITEM_H + 8;
    groupSvgs.push(
      `  <rect x="${x}" y="${y}" width="${COMP_GROUP_W}" height="${boxH}" fill="none" stroke="#ddd" rx="6"/>`
    );

    for (let idx = 0; idx < visible.length; idx++) {
      const item = visible[idx];
      groupSvgs.push(
        `  <text x="${x + 8}" y="${y + 18}" font-family="${FONT}" font-size="11" fill="#555">&lt;${escapeXml(item.tag)}&gt;</text>`,
        `  <text x="${x + 8}" y="${y + 32}" font-family="monospace" font-size="10" fill="#888">${escapeXml(item.selector)}</text>`,
        `  <text x="${x + 8}" y="${y + 44}" font-family="${FONT}" font-size="10" fill="#aaa">${escapeXml(truncate(item.text || '-', 30))}</text>`,
      );
      y += COMP_ITEM_H;
      if (idx < visible.length - 1) {
        groupSvgs.push(`  <line x1="${x + 8}" y1="${y}" x2="${x + COMP_GROUP_W - 8}" y2="${y}" stroke="#eee"/>`);
      }
    }

    colHeights[col] = y + boxH / visible.length + COMP_GAP;
  }

  const height = Math.max(...colHeights) + 10;
  const width = colOffsets[1] + COMP_GROUP_W + COMP_GAP;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">\n`
    + `  <text x="${COMP_GAP}" y="28" font-family="${FONT}" font-size="16" font-weight="600" fill="#111">${escapeXml(title)} — Component Inventory</text>\n`
    + groupSvgs.join('\n')
    + `\n</svg>`;
}
