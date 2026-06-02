import type { ProjectRecord } from './types.js';
import { aggregateColors, aggregateTypography, aggregateComponents, aggregateMotion } from './aggregate.js';

function parseDurationSeconds(value: string): number | null {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)(ms|s)$/i);
  if (!match) {
    return null;
  }

  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount)) {
    return null;
  }

  return match[2].toLowerCase() === 'ms' ? amount / 1000 : amount;
}

export function generateMoodboardHtml(project: ProjectRecord): string {
  if (project.inspirations.length === 0) {
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${project.name} Moodboard</title>
<style>body{font-family:system-ui,sans-serif;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.empty{text-align:center;opacity:0.5}</style></head>
<body><div class="empty"><h1>${project.name}</h1><p>No captures yet. Run <code>design-brain-memory ingest</code> to start.</p></div></body></html>`;
  }

  const colors = aggregateColors(project.inspirations).slice(0, 10);
  const typography = aggregateTypography(project.inspirations).slice(0, 3);
  const components = aggregateComponents(project.inspirations).slice(0, 6);
  const motion = aggregateMotion(project.inspirations);

  const avgDuration = motion.length > 0
    ? (motion.reduce((sum, m) => {
        const durations = (m.transitions ?? [])
          .map((t) => parseDurationSeconds(t.duration))
          .filter((value): value is number => value !== null);
        return sum + (durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0);
      }, 0) / motion.length).toFixed(2)
    : '0';

  const topEasing = motion.length > 0
    ? (motion.flatMap((m) => (m.transitions ?? []).map((t) => t.timingFunction))
        .reduce((acc, fn) => { acc.set(fn, (acc.get(fn) ?? 0) + 1); return acc; }, new Map<string, number>()))
    : new Map<string, number>();
  const topEasingName = topEasing.size > 0
    ? [...topEasing.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : 'none';

  const transitionCount = motion.filter((m) => m.transition && m.transition !== 'none').length;
  const animationCount = motion.filter((m) => m.animation && m.animation !== 'none').length;

  const colorSwatches = colors.map((c) =>
    `<div class="swatch" style="background:${c.hex}"><span class="hex">${c.hex}</span><span class="freq">${c.count}</span></div>`
  ).join('\n');

  const typoSpecimens = typography.map((t) => {
    const family = t.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
    return `<div class="typo-specimen">
      <div class="typo-heading" style="font-family:${t.fontFamily}">${family}</div>
      <div class="typo-body" style="font-family:${t.fontFamily};font-size:${t.fontSize};font-weight:${t.fontWeight};line-height:${t.lineHeight}">The quick brown fox jumps over the lazy dog.</div>
      <div class="typo-meta">${t.fontSize} / ${t.fontWeight} / ${t.lineHeight}</div>
    </div>`;
  }).join('\n');

  const componentBadges = components.map((c) =>
    `<span class="badge">${c.kind} <small>(${c.count})</small></span>`
  ).join('\n');

  const sourceNames = project.inspirations.map((i) => i.name).join(', ');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${project.name} Moodboard</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e0e0e0;padding:2rem}
h1{font-size:1.8rem;font-weight:700;margin-bottom:.5rem}
h2{font-size:1rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:1rem;border-bottom:1px solid #222;padding-bottom:.5rem}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:2rem;max-width:1200px;margin:0 auto}
.section{background:#141414;border-radius:12px;padding:1.5rem;border:1px solid #222}
.section.full{grid-column:1/3}
.palette{display:flex;gap:.5rem;flex-wrap:wrap}
.swatch{width:80px;height:80px;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:6px;position:relative;overflow:hidden}
.swatch::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.5));pointer-events:none}
.hex{font-size:10px;font-weight:600;z-index:1;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.8)}
.freq{font-size:9px;z-index:1;color:rgba(255,255,255,.7)}
.typo-specimen{margin-bottom:1.5rem}
.typo-heading{font-size:1.5rem;font-weight:700;margin-bottom:.25rem}
.typo-body{margin-bottom:.25rem;color:#aaa}
.typo-meta{font-size:.75rem;color:#555}
.badge{display:inline-block;background:#1a1a2e;border:1px solid #333;border-radius:20px;padding:6px 14px;margin:4px;font-size:.85rem}
.badge small{color:#666}
.motion-stat{display:flex;gap:2rem;flex-wrap:wrap}
.motion-stat div{text-align:center}
.motion-stat .val{font-size:1.5rem;font-weight:700;color:#fff}
.motion-stat .lbl{font-size:.75rem;color:#666}
.footer{text-align:center;margin-top:2rem;color:#444;font-size:.75rem}
</style></head>
<body>
<div class="grid">
  <div class="section full"><h1>${project.name}</h1><p style="color:#666;margin-top:.25rem">Moodboard &mdash; ${project.inspirations.length} capture${project.inspirations.length !== 1 ? 's' : ''}</p></div>
  <div class="section full"><h2>Color Palette</h2><div class="palette">${colorSwatches}</div></div>
  <div class="section"><h2>Typography</h2>${typoSpecimens || '<p style="color:#555">No typography captured</p>'}</div>
  <div class="section"><h2>Components</h2><div>${componentBadges || '<p style="color:#555">No components captured</p>'}</div></div>
  <div class="section full"><h2>Motion</h2><div class="motion-stat">
    <div><div class="val">${avgDuration}s</div><div class="lbl">Avg Duration</div></div>
    <div><div class="val">${topEasingName}</div><div class="lbl">Top Easing</div></div>
    <div><div class="val">${transitionCount}</div><div class="lbl">Transitions</div></div>
    <div><div class="val">${animationCount}</div><div class="lbl">Animations</div></div>
  </div></div>
  <div class="section full"><div class="footer">Sources: ${sourceNames} &mdash; Generated by design-brain-memory</div></div>
</div>
</body></html>`;
}

export function generateMoodboardSvg(project: ProjectRecord): string {
  if (project.inspirations.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200"><rect width="800" height="200" fill="#111"/><text x="400" y="100" text-anchor="middle" fill="#666" font-family="system-ui" font-size="16">${project.name} — No captures</text></svg>`;
  }

  const colors = aggregateColors(project.inspirations).slice(0, 10);
  const typography = aggregateTypography(project.inspirations).slice(0, 3);
  const components = aggregateComponents(project.inspirations).slice(0, 6);

  const W = 800;
  let y = 0;

  const lines: string[] = [];

  // Title
  y += 40;
  lines.push(`<text x="20" y="${y}" fill="#fff" font-family="system-ui" font-size="22" font-weight="700">${project.name}</text>`);
  y += 16;
  lines.push(`<text x="20" y="${y}" fill="#888" font-family="system-ui" font-size="12">${project.inspirations.length} capture${project.inspirations.length !== 1 ? 's' : ''}</text>`);
  y += 30;

  // Color swatches
  lines.push(`<text x="20" y="${y}" fill="#888" font-family="system-ui" font-size="11" text-transform="uppercase">COLOR PALETTE</text>`);
  y += 15;
  colors.forEach((c, i) => {
    const x = 20 + i * 72;
    lines.push(`<rect x="${x}" y="${y}" width="64" height="64" rx="6" fill="${c.hex}"/>`);
    lines.push(`<text x="${x + 32}" y="${y + 78}" text-anchor="middle" fill="#aaa" font-family="monospace" font-size="9">${c.hex}</text>`);
  });
  y += 95;

  // Typography
  lines.push(`<text x="20" y="${y}" fill="#888" font-family="system-ui" font-size="11">TYPOGRAPHY</text>`);
  y += 20;
  for (const t of typography) {
    const family = t.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
    lines.push(`<text x="20" y="${y}" fill="#fff" font-family="${t.fontFamily}" font-size="16" font-weight="${t.fontWeight}">${family} — ${t.fontSize}</text>`);
    y += 24;
  }
  y += 15;

  // Components
  lines.push(`<text x="20" y="${y}" fill="#888" font-family="system-ui" font-size="11">COMPONENTS</text>`);
  y += 20;
  let cx = 20;
  for (const c of components) {
    const label = `${c.kind} (${c.count})`;
    const w = label.length * 7 + 20;
    lines.push(`<rect x="${cx}" y="${y - 14}" width="${w}" height="22" rx="11" fill="none" stroke="#444"/>`);
    lines.push(`<text x="${cx + w / 2}" y="${y}" text-anchor="middle" fill="#ccc" font-family="system-ui" font-size="11">${label}</text>`);
    cx += w + 8;
    if (cx > W - 100) { cx = 20; y += 30; }
  }
  y += 35;

  // Footer
  const sourceNames = project.inspirations.map((i) => i.name).join(', ');
  lines.push(`<text x="${W / 2}" y="${y}" text-anchor="middle" fill="#555" font-family="system-ui" font-size="10">Sources: ${sourceNames}</text>`);
  y += 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${y}"><rect width="${W}" height="${y}" fill="#0a0a0a"/>${lines.join('')}</svg>`;
}
