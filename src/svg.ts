import type { ColorToken, ComponentToken, TypographyToken } from './types.js';
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

const TYPO_ROW_H = 36;
const TYPO_BAR_W = 60;

export function generateTypographySvg(tokens: TypographyToken[], title: string): string {
  if (tokens.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 60">\n`
      + `  <text x="10" y="30" font-family="${FONT}" font-size="14" fill="#888">No typography captured</text>\n`
      + `</svg>`;
  }

  const families = new Map<string, TypographyToken[]>();
  for (const token of tokens) {
    const list = families.get(token.fontFamily) ?? [];
    list.push(token);
    families.set(token.fontFamily, list);
  }

  const maxCount = Math.max(...tokens.map((t) => t.count), 1);
  const width = 600;
  let y = 50;
  const lines: string[] = [];

  for (const [family, items] of families) {
    lines.push(
      `  <text x="12" y="${y}" font-family="${FONT}" font-size="14" font-weight="600" fill="#222">${escapeXml(family)}</text>`
    );
    y += 6;
    lines.push(
      `  <line x1="12" y1="${y}" x2="${width - 12}" y2="${y}" stroke="#ddd"/>`
    );
    y += 20;

    for (const token of items.slice(0, 10)) {
      const meta = `${escapeXml(token.fontSize)} / ${escapeXml(token.fontWeight)} / ${escapeXml(token.lineHeight)}`;
      const barW = Math.round((token.count / maxCount) * TYPO_BAR_W);

      lines.push(
        `  <text x="12" y="${y}" font-family="${FONT}" font-size="11" fill="#555">${meta}</text>`,
        `  <rect x="240" y="${y - 8}" width="${TYPO_BAR_W}" height="8" fill="#eee" rx="2"/>`,
        `  <rect x="240" y="${y - 8}" width="${barW}" height="8" fill="#555" rx="2"/>`,
        `  <text x="310" y="${y}" font-family="${FONT}" font-size="9" fill="#888">${token.count}</text>`,
        `  <text x="350" y="${y}" font-family="${escapeXml(family)}, ${FONT}" font-size="12" fill="#333">Aa Bb Cc 123</text>`,
      );
      y += TYPO_ROW_H;
    }
    y += 12;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${y + 10}">\n`
    + `  <text x="12" y="28" font-family="${FONT}" font-size="16" font-weight="600" fill="#111">${escapeXml(title)} — Typography Specimen</text>\n`
    + lines.join('\n')
    + `\n</svg>`;
}
