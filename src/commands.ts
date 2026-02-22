import path from 'node:path';
import fs from 'fs-extra';
import { compareInspirations, renderComparison } from './compare.js';
import { buildComponentGraph, renderComponentGraphMd } from './componentGraph.js';
import { generateCssInJsTheme, renderCssInJsTheme } from './cssInJs.js';
import { captureDesignFromImage } from './extractFromImage.js';
import { generateMoodboardHtml, generateMoodboardSvg } from './moodboard.js';
import { buildChecklist, renderChecklist } from './reviewChecklist.js';
import { scanCodebase } from './scorecard.js';
import { diffProjects, diffTemporal, renderSystemDiff } from './systemDiff.js';
import { nameTokens } from './tokenNaming.js';
import { detectTrends, writeTrendNotes } from './trends.js';
import { generateProjectWiki, generateSharedContextWiki, generateWikiIndex, countSharedTokens } from './wiki.js';
import { buildKnowledgeGraph, generateGraphHtml } from './graphView.js';
import { aggregateWritingStyles, renderWritingStyleMd } from './writingStyle.js';
import { generateDesignContext, generateUnifiedContext } from './contextLayer.js';
import { captureDesignFromUrl } from './extractFromUrl.js';
import { createLiveView } from './liveView.js';
import { enrichWithLlm } from './llm.js';
import { askDesignBrain, searchDesignBrain } from './query.js';
import { renderAll } from './render.js';
import { generateStyleDictionary } from './styleDictionary.js';
import { generateTailwindConfig } from './tailwind.js';
import {
  brainRoot,
  ensureBrainExists,
  ensureProject,
  loadDatabase,
  projectAssetDir,
  projectDir,
  saveDatabase,
} from './store.js';
import { makeId, normalizeUrl, nowIso, slugify, stableHash, unique } from './util.js';
import type {
  DesignAnalysis,
  IngestOptions,
  InspirationDiff,
  InspirationRecord,
  LlmConfig,
  OutcomeOptions,
} from './types.js';

function computeFingerprint(input: {
  url?: string;
  analysis: DesignAnalysis;
}): string {
  const basis = {
    url: input.url ? normalizeUrl(input.url) : null,
    topColors: input.analysis.colors.slice(0, 20).map((color) => color.hex.toUpperCase()),
    componentKinds: input.analysis.components.slice(0, 40).map((component) => component.kind),
    layout: input.analysis.layout.slice(0, 20).map((layout) => `${layout.tag}:${layout.role}`),
    motion: input.analysis.motion.slice(0, 20).map((motion) => `${motion.transition}|${motion.animation}`),
  };

  return stableHash(JSON.stringify(basis));
}

function buildDiff(previous: InspirationRecord, next: DesignAnalysis): InspirationDiff {
  const previousColors = new Set(previous.analysis.colors.map((color) => color.hex.toUpperCase()));
  const nextColors = new Set(next.colors.map((color) => color.hex.toUpperCase()));

  const addedColors = [...nextColors].filter((color) => !previousColors.has(color)).slice(0, 30);
  const removedColors = [...previousColors].filter((color) => !nextColors.has(color)).slice(0, 30);

  return {
    previousId: previous.id,
    addedColors,
    removedColors,
    componentCountDelta: next.components.length - previous.analysis.components.length,
    motionCountDelta: next.motion.length - previous.analysis.motion.length,
  };
}

function resolvePreviousVersion(projectInspirations: InspirationRecord[], fingerprint: string): InspirationRecord | undefined {
  const versions = projectInspirations
    .filter((entry) => entry.fingerprint === fingerprint)
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));

  return versions.at(-1);
}

function mergeTags(...lists: string[][]): string[] {
  return unique(
    lists
      .flat()
      .map((tag) => slugify(tag))
      .filter((tag) => tag.length > 0)
  );
}

export async function initBrain(rootDir: string): Promise<void> {
  await ensureBrainExists(rootDir);

  // Create knowledge system directories
  const root = brainRoot(rootDir);
  await fs.ensureDir(path.join(root, 'self'));
  await fs.ensureDir(path.join(root, 'notes', 'patterns'));
  await fs.ensureDir(path.join(root, 'notes', 'decisions'));
  await fs.ensureDir(path.join(root, 'notes', 'principles'));
  await fs.ensureDir(path.join(root, 'notes', 'mocs'));
  await fs.ensureDir(path.join(root, 'ops', 'queue'));
  await fs.ensureDir(path.join(root, 'ops', 'sessions'));

  const db = await loadDatabase(rootDir);
  await renderAll(rootDir, db);
}

export async function ingestInspiration(options: IngestOptions): Promise<{ projectId: string; inspirationId: string }> {
  if (!options.url && !options.screenshot) {
    throw new Error('Provide either --url or --screenshot');
  }

  if (options.url && options.screenshot) {
    throw new Error('Use either --url or --screenshot, not both');
  }

  await ensureBrainExists(options.rootDir);
  const db = await loadDatabase(options.rootDir);
  const project = ensureProject(db, {
    projectId: options.project,
    projectName: options.projectName,
    description: options.projectDescription,
  });

  const inspirationName = options.name?.trim() || options.url || options.screenshot || 'inspiration';
  const inspirationId = makeId('inspo', inspirationName);
  const assetDir = projectAssetDir(options.rootDir, project.id);
  await fs.ensureDir(assetDir);

  let screenshotPath: string | undefined;
  let analysis: DesignAnalysis;

  const liveView = createLiveView({
    enabled: Boolean(options.live),
    viewportLabels: options.responsiveViewports?.map(v => v.label),
    journeySteps: options.journeySteps,
  });

  if (options.url) {
    screenshotPath = path.join(assetDir, `${inspirationId}.png`);
    const sessionName = `designbrain-${project.id}-${Date.now().toString(36)}`;
    liveView.onPhaseStart(`Capturing ${options.url}`);
    analysis = await captureDesignFromUrl({
      url: options.url,
      sessionName,
      screenshotPath,
      workingDir: options.rootDir,
      headed: options.headed,
      journeySteps: options.journeySteps,
      responsiveViewports: options.responsiveViewports,
      callbacks: {
        onViewportExtracted: liveView.onViewportExtracted,
        onInteractiveStates: liveView.onInteractiveStates,
        onJourneyStep: liveView.onJourneyStep,
        onMerged: liveView.onMerged,
      },
    });
  } else {
    const source = path.resolve(options.rootDir, options.screenshot as string);
    const ext = path.extname(source) || '.png';
    screenshotPath = path.join(assetDir, `${inspirationId}${ext}`);
    await fs.copy(source, screenshotPath);
    analysis = await captureDesignFromImage({
      imagePath: screenshotPath,
      sourceName: inspirationName,
      notes: options.notes,
      llm: options.llm,
    });
  }

  let llmEnrichment;
  if (options.llm) {
    llmEnrichment = await enrichWithLlm({
      llm: options.llm,
      sourceName: inspirationName,
      sourceUrl: options.url,
      notes: options.notes,
      fallbackSummary: options.inspirationSummary,
      analysis,
    });
  }

  const fingerprint = computeFingerprint({
    url: options.url,
    analysis,
  });

  const previousVersion = resolvePreviousVersion(project.inspirations, fingerprint);
  const version = previousVersion ? previousVersion.version + 1 : 1;

  const mergedTags = mergeTags(
    options.tags,
    llmEnrichment?.suggestedTags ?? []
  );

  const inspirationSummary = options.inspirationSummary
    || llmEnrichment?.summary
    || undefined;

  const record: InspirationRecord = {
    id: inspirationId,
    name: inspirationName,
    sourceType: options.url ? 'url' : 'screenshot',
    url: options.url,
    originalImagePath: options.screenshot ? path.resolve(options.rootDir, options.screenshot) : undefined,
    screenshotPath,
    capturedAt: nowIso(),
    tags: mergedTags,
    notes: options.notes,
    inspirationSummary,
    llmEnrichment,
    fingerprint,
    version,
    supersedes: previousVersion?.id,
    diffFromPrevious: previousVersion ? buildDiff(previousVersion, analysis) : undefined,
    analysis,
  };

  liveView.onAnalysisComplete(record);

  project.inspirations.push(record);

  project.updatedAt = nowIso();
  await saveDatabase(options.rootDir, db);
  await renderAll(options.rootDir, db, options.skipVisuals);

  return { projectId: project.id, inspirationId };
}

export async function recordOutcome(options: OutcomeOptions): Promise<{ projectId: string; outcomeId: string }> {
  if (!options.title.trim()) {
    throw new Error('--title is required');
  }

  if (!options.description.trim()) {
    throw new Error('--description is required');
  }

  await ensureBrainExists(options.rootDir);
  const db = await loadDatabase(options.rootDir);
  const project = ensureProject(db, {
    projectId: options.project,
  });

  const outcomeId = makeId('outcome', options.title);

  const knownInspirationIds = new Set(project.inspirations.map((entry) => entry.id));
  const inspiredBy = options.inspiredBy.filter((id) => knownInspirationIds.has(id));

  project.outcomes.push({
    id: outcomeId,
    title: options.title,
    description: options.description,
    inspiredBy,
    artifactUrl: options.artifactUrl,
    createdAt: nowIso(),
    tags: unique(options.tags.map((tag) => slugify(tag)).filter(Boolean)),
  });

  project.updatedAt = nowIso();
  await saveDatabase(options.rootDir, db);
  await renderAll(options.rootDir, db);

  return { projectId: project.id, outcomeId };
}

export async function reindexBrain(rootDir: string, skipVisuals = false): Promise<void> {
  const db = await loadDatabase(rootDir);
  await renderAll(rootDir, db, skipVisuals);
}

export async function searchBrain(params: {
  rootDir: string;
  query: string;
  project?: string;
  limit?: number;
}) {
  return searchDesignBrain(params);
}

export async function askBrain(params: {
  rootDir: string;
  query: string;
  project?: string;
  limit?: number;
  llm?: LlmConfig;
}) {
  return askDesignBrain(params);
}

export async function exportDesignSystem(params: {
  rootDir: string;
  project: string;
  format: string;
}): Promise<string> {
  const db = await loadDatabase(params.rootDir);
  const project = db.projects.find((p) => p.id === params.project);
  if (!project) {
    throw new Error(`Project not found: ${params.project}`);
  }

  if (params.format === 'tailwind') {
    const config = generateTailwindConfig(project);
    const outPath = path.join(projectDir(params.rootDir, project.id), 'tailwind.config.js');
    await fs.ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, config);
    return outPath;
  }

  if (params.format === 'style-dictionary') {
    const tokens = generateStyleDictionary(project);
    const outPath = path.join(projectDir(params.rootDir, project.id), 'tokens.json');
    await fs.ensureDir(path.dirname(outPath));
    await fs.writeJson(outPath, tokens, { spaces: 2 });
    return outPath;
  }

  if (params.format === 'css-in-js') {
    const theme = generateCssInJsTheme(project);
    const ts = renderCssInJsTheme(theme);
    const outPath = path.join(projectDir(params.rootDir, project.id), 'theme.ts');
    await fs.ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, ts);
    return outPath;
  }

  throw new Error(`Unsupported format: ${params.format}. Supported: tailwind, style-dictionary, css-in-js`);
}

export async function compareCaptures(params: {
  rootDir: string;
  inspoA?: string;
  inspoB?: string;
  inspo?: string;
}): Promise<string> {
  const db = await loadDatabase(params.rootDir);

  let a: InspirationRecord | undefined;
  let b: InspirationRecord | undefined;
  let projectId = '';

  if (params.inspo) {
    // Version diff mode — find inspo and its predecessor
    for (const project of db.projects) {
      const found = project.inspirations.find((i) => i.id === params.inspo);
      if (found) {
        b = found;
        projectId = project.id;
        if (found.supersedes) {
          a = project.inspirations.find((i) => i.id === found.supersedes);
        }
        break;
      }
    }
    if (!b) throw new Error(`Inspiration not found: ${params.inspo}`);
    if (!a) throw new Error(`No previous version found for ${params.inspo}`);
  } else if (params.inspoA && params.inspoB) {
    // Cross-capture mode
    for (const project of db.projects) {
      const foundA = project.inspirations.find((i) => i.id === params.inspoA);
      const foundB = project.inspirations.find((i) => i.id === params.inspoB);
      if (foundA) { a = foundA; projectId = project.id; }
      if (foundB) { b = foundB; if (!projectId) projectId = project.id; }
    }
    if (!a) throw new Error(`Inspiration not found: ${params.inspoA}`);
    if (!b) throw new Error(`Inspiration not found: ${params.inspoB}`);
  } else {
    throw new Error('Provide --a and --b for cross-capture, or --inspo for version diff');
  }

  const report = compareInspirations(a, b);
  const md = renderComparison(report);

  const compDir = path.join(projectDir(params.rootDir, projectId), 'comparisons');
  await fs.ensureDir(compDir);
  const outPath = path.join(compDir, `${a.id}-vs-${b.id}.md`);
  await fs.writeFile(outPath, md);

  return outPath;
}

export async function generateMoodboard(params: {
  rootDir: string;
  project: string;
}): Promise<string> {
  const db = await loadDatabase(params.rootDir);
  const project = db.projects.find((p) => p.id === params.project);
  if (!project) {
    throw new Error(`Project not found: ${params.project}`);
  }

  const baseDir = projectDir(params.rootDir, project.id);
  await fs.ensureDir(baseDir);

  const html = generateMoodboardHtml(project);
  const htmlPath = path.join(baseDir, 'moodboard.html');
  await fs.writeFile(htmlPath, html);

  const svg = generateMoodboardSvg(project);
  const svgPath = path.join(baseDir, 'moodboard.svg');
  await fs.writeFile(svgPath, svg);

  // Try PNG via sharp, skip silently if not available
  try {
    const sharp = (await import('sharp')).default;
    const pngPath = path.join(baseDir, 'moodboard.png');
    await sharp(Buffer.from(svg)).png().toFile(pngPath);
  } catch {
    // sharp not available or SVG conversion failed — HTML is still usable
  }

  return htmlPath;
}

export async function detectAndWriteTrends(params: {
  rootDir: string;
  project?: string;
}): Promise<{ trends: number; written: number }> {
  const db = await loadDatabase(params.rootDir);

  let inspirations: InspirationRecord[];
  if (params.project) {
    const project = db.projects.find((p) => p.id === params.project);
    if (!project) throw new Error(`Project not found: ${params.project}`);
    inspirations = project.inspirations;
  } else {
    inspirations = db.projects.flatMap((p) => p.inspirations);
  }

  const trends = detectTrends(inspirations);
  const written = await writeTrendNotes(params.rootDir, trends);

  return { trends: trends.length, written };
}

export async function generateComponentGraphCmd(params: {
  rootDir: string;
  project: string;
}): Promise<string> {
  const db = await loadDatabase(params.rootDir);
  const project = db.projects.find((p) => p.id === params.project);
  if (!project) throw new Error(`Project not found: ${params.project}`);

  const graph = buildComponentGraph(project.inspirations);
  const baseDir = projectDir(params.rootDir, project.id);
  await fs.ensureDir(baseDir);

  await fs.writeJson(path.join(baseDir, 'component-graph.json'), graph, { spaces: 2 });

  const md = renderComponentGraphMd(graph);
  const mdPath = path.join(baseDir, 'component-graph.md');
  await fs.writeFile(mdPath, md);

  return mdPath;
}

export async function generateReviewChecklist(params: {
  rootDir: string;
  project: string;
  scanPath?: string;
}): Promise<string> {
  const db = await loadDatabase(params.rootDir);
  const project = db.projects.find((p) => p.id === params.project);
  if (!project) throw new Error(`Project not found: ${params.project}`);

  let codebaseTokens;
  if (params.scanPath) {
    const scan = await scanCodebase(params.scanPath);
    codebaseTokens = scan.tokens;
  }

  const checklist = buildChecklist({ project, codebaseTokens });
  const md = renderChecklist(checklist, project.id);

  const outPath = path.join(projectDir(params.rootDir, project.id), 'review-checklist.md');
  await fs.ensureDir(path.dirname(outPath));
  await fs.writeFile(outPath, md);

  return outPath;
}

export async function nameTokensCmd(params: {
  rootDir: string;
  project: string;
}): Promise<Map<string, string>> {
  const db = await loadDatabase(params.rootDir);
  const project = db.projects.find((p) => p.id === params.project);
  if (!project) throw new Error(`Project not found: ${params.project}`);
  return nameTokens(project);
}

export async function runSystemDiff(params: {
  rootDir: string;
  projectA?: string;
  projectB?: string;
  project?: string;
}): Promise<string> {
  const db = await loadDatabase(params.rootDir);

  if (params.project) {
    const project = db.projects.find((p) => p.id === params.project);
    if (!project) throw new Error(`Project not found: ${params.project}`);

    const diff = diffTemporal(project);
    const md = renderSystemDiff(diff, 'temporal', 'early', 'recent');
    const timestamp = Date.now().toString(36);
    const outPath = path.join(projectDir(params.rootDir, project.id), `system-diff-${timestamp}.md`);
    await fs.ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, md);
    return outPath;
  }

  if (params.projectA && params.projectB) {
    const projectA = db.projects.find((p) => p.id === params.projectA);
    const projectB = db.projects.find((p) => p.id === params.projectB);
    if (!projectA) throw new Error(`Project not found: ${params.projectA}`);
    if (!projectB) throw new Error(`Project not found: ${params.projectB}`);

    const diff = diffProjects(projectA, projectB);
    const md = renderSystemDiff(diff, 'cross-project', projectA.id, projectB.id);
    const timestamp = Date.now().toString(36);
    const outPath = path.join(projectDir(params.rootDir, projectA.id), `system-diff-vs-${projectB.id}-${timestamp}.md`);
    await fs.ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, md);
    return outPath;
  }

  throw new Error('Provide --project for temporal diff, or --project-a and --project-b for cross-project diff');
}

export async function buildWiki(params: {
  rootDir: string;
}): Promise<{ projectPages: number; sharedTokens: number; wikiDir: string }> {
  const db = await loadDatabase(params.rootDir);
  const root = brainRoot(params.rootDir);
  const wikiDir = path.join(root, 'wiki');
  const projectsDir = path.join(wikiDir, 'projects');
  const sharedDir = path.join(wikiDir, 'shared');

  await fs.ensureDir(projectsDir);
  await fs.ensureDir(sharedDir);

  const allProjectIds = db.projects.map((p) => p.id);

  // Per-project wiki pages
  for (const project of db.projects) {
    const md = generateProjectWiki(project, allProjectIds);
    await fs.writeFile(path.join(projectsDir, `${project.id}.md`), md);
  }

  // Shared context space
  const sharedMd = generateSharedContextWiki(db.projects);
  await fs.writeFile(path.join(sharedDir, 'shared-context.md'), sharedMd);

  // Wiki index
  const sharedCount = countSharedTokens(db.projects);
  const indexMd = generateWikiIndex(db.projects, sharedCount);
  await fs.writeFile(path.join(wikiDir, 'index.md'), indexMd);

  // Knowledge graph visualization
  const graph = buildKnowledgeGraph(db);
  const graphHtml = generateGraphHtml(graph);
  await fs.writeFile(path.join(wikiDir, 'graph.html'), graphHtml);

  // Design context files — the context layer for AI tools
  for (const project of db.projects) {
    const ctx = generateDesignContext(project);
    const projDir = projectDir(params.rootDir, project.id);
    await fs.ensureDir(projDir);
    await fs.writeFile(path.join(projDir, 'DESIGN_CONTEXT.md'), ctx);
  }
  if (db.projects.length > 0) {
    const unified = generateUnifiedContext(db.projects);
    await fs.writeFile(path.join(root, 'DESIGN_CONTEXT.md'), unified);
  }

  return {
    projectPages: db.projects.length,
    sharedTokens: sharedCount,
    wikiDir,
  };
}

export async function analyzeWritingStyleCmd(params: {
  rootDir: string;
  project: string;
}): Promise<string> {
  const db = await loadDatabase(params.rootDir);
  const project = db.projects.find((p) => p.id === params.project);
  if (!project) throw new Error(`Project not found: ${params.project}`);

  const agg = aggregateWritingStyles(project.inspirations);
  const md = renderWritingStyleMd(agg, project.id);

  const outPath = path.join(projectDir(params.rootDir, project.id), 'writing-style.md');
  await fs.ensureDir(path.dirname(outPath));
  await fs.writeFile(outPath, md);

  return outPath;
}

export async function generateContext(params: {
  rootDir: string;
  project?: string;
}): Promise<string> {
  const db = await loadDatabase(params.rootDir);
  const root = brainRoot(params.rootDir);

  if (params.project) {
    const project = db.projects.find((p) => p.id === params.project);
    if (!project) throw new Error(`Project not found: ${params.project}`);

    const ctx = generateDesignContext(project);
    const outPath = path.join(projectDir(params.rootDir, project.id), 'DESIGN_CONTEXT.md');
    await fs.ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, ctx);
    return outPath;
  }

  // Unified context across all projects
  const ctx = generateUnifiedContext(db.projects);
  const outPath = path.join(root, 'DESIGN_CONTEXT.md');
  await fs.ensureDir(path.dirname(outPath));
  await fs.writeFile(outPath, ctx);
  return outPath;
}

export async function buildGraphView(params: {
  rootDir: string;
}): Promise<string> {
  const db = await loadDatabase(params.rootDir);
  const root = brainRoot(params.rootDir);
  const wikiDir = path.join(root, 'wiki');
  await fs.ensureDir(wikiDir);

  const graph = buildKnowledgeGraph(db);
  const html = generateGraphHtml(graph);
  const outPath = path.join(wikiDir, 'graph.html');
  await fs.writeFile(outPath, html);

  return outPath;
}
