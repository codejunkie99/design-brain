import type { ProjectRecord } from './types.js';
import type { CodebaseTokens } from './scorecard.js';
import {
  aggregateColors,
  aggregateTypography,
  aggregateComponents,
  aggregateMotion,
} from './aggregate.js';
import { scoreAgainstProject } from './scorecard.js';

export interface ChecklistItem {
  category: 'color' | 'typography' | 'component' | 'motion' | 'scorecard';
  description: string;
  severity: 'info' | 'warning' | 'action';
}

export interface ReviewChecklist {
  projectId: string;
  items: ChecklistItem[];
  generatedAt: string;
}

export function buildChecklist(params: {
  project: ProjectRecord;
  codebaseTokens?: CodebaseTokens;
}): ReviewChecklist {
  const { project, codebaseTokens } = params;
  const items: ChecklistItem[] = [];

  const colors = aggregateColors(project.inspirations);
  if (colors.length > 0) {
    items.push({
      category: 'color',
      description: `Verify primary palette uses top ${Math.min(colors.length, 5)} captured colors: ${colors.slice(0, 5).map((c) => c.hex).join(', ')}`,
      severity: 'info',
    });

    if (colors.length > 20) {
      items.push({
        category: 'color',
        description: `${colors.length} unique colors captured — consider consolidating to reduce palette complexity`,
        severity: 'warning',
      });
    }
  }

  const typography = aggregateTypography(project.inspirations);
  if (typography.length > 0) {
    const families = [...new Set(typography.map((t) => t.fontFamily.split(',')[0].trim().replace(/['"]/g, '')))];
    items.push({
      category: 'typography',
      description: `Verify font stack includes: ${families.slice(0, 3).join(', ')}`,
      severity: 'info',
    });

    const sizes = [...new Set(typography.map((t) => t.fontSize))];
    if (sizes.length > 8) {
      items.push({
        category: 'typography',
        description: `${sizes.length} unique font sizes — consider establishing a type scale`,
        severity: 'warning',
      });
    }
  }

  const components = aggregateComponents(project.inspirations);
  if (components.length > 0) {
    const kinds = [...new Set(components.map((c) => c.kind))];
    items.push({
      category: 'component',
      description: `Component library should cover: ${kinds.slice(0, 8).join(', ')}`,
      severity: 'info',
    });
  }

  const motion = aggregateMotion(project.inspirations);
  if (motion.length > 0) {
    const durations = new Set<string>();
    for (const m of motion) {
      for (const t of m.transitions ?? []) {
        if (t.duration && t.duration !== '0s') durations.add(t.duration);
      }
    }
    if (durations.size > 0) {
      items.push({
        category: 'motion',
        description: `Standard transition durations: ${[...durations].slice(0, 4).join(', ')}`,
        severity: 'info',
      });
    }
  }

  if (codebaseTokens) {
    const scores = scoreAgainstProject(codebaseTokens, project);

    if (scores.colorScore.offPalette > 0) {
      items.push({
        category: 'scorecard',
        description: `${scores.colorScore.offPalette} off-palette color usages found in codebase`,
        severity: 'action',
      });
      for (const detail of scores.colorScore.details.slice(0, 5)) {
        items.push({
          category: 'scorecard',
          description: `Replace off-palette color ${detail.value}`,
          severity: 'action',
        });
      }
    }

    if (scores.typographyScore.offSystem > 0) {
      items.push({
        category: 'scorecard',
        description: `${scores.typographyScore.offSystem} off-system typography usages found`,
        severity: 'action',
      });
    }

    if (scores.motionScore.inconsistent > 0) {
      items.push({
        category: 'scorecard',
        description: `${scores.motionScore.inconsistent} inconsistent motion values found`,
        severity: 'warning',
      });
    }
  }

  return {
    projectId: project.id,
    items,
    generatedAt: new Date().toISOString(),
  };
}

export function renderChecklist(checklist: ReviewChecklist, projectId: string): string {
  const lines: string[] = [];
  lines.push(`# Design Review Checklist — ${projectId}\n`);
  lines.push(`Generated: ${checklist.generatedAt}\n`);

  const categories = ['color', 'typography', 'component', 'motion', 'scorecard'] as const;
  const categoryLabels: Record<string, string> = {
    color: 'Colors',
    typography: 'Typography',
    component: 'Components',
    motion: 'Motion',
    scorecard: 'Codebase Audit',
  };

  for (const category of categories) {
    const categoryItems = checklist.items.filter((i) => i.category === category);
    if (categoryItems.length === 0) continue;

    lines.push(`## ${categoryLabels[category]}\n`);
    for (const item of categoryItems) {
      const prefix = item.severity === 'action' ? '- [ ] **ACTION:**' : item.severity === 'warning' ? '- [ ] **WARNING:**' : '- [ ]';
      lines.push(`${prefix} ${item.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
