import path from 'node:path';
import fs from 'fs-extra';
import { brainRoot } from './store.js';
import type { DesignBrainDatabase } from './types.js';

export interface DesignProfile {
  domains: string[];
  focus: string;
  philosophy?: string;
  tools?: string[];
  team?: string;
}

const DEFAULT_DOMAINS = ['web', 'brand', 'mobile', 'design-systems'];

const DOMAIN_MOCS = [
  { id: 'color-systems', title: 'Color Systems', description: 'Color palettes, contrast, accessibility, theming' },
  { id: 'typography', title: 'Typography', description: 'Font pairings, scales, hierarchy, readability' },
  { id: 'components', title: 'Components', description: 'Buttons, cards, forms, navigation patterns' },
  { id: 'layout', title: 'Layout', description: 'Grid systems, spacing, responsive patterns' },
  { id: 'motion', title: 'Motion', description: 'Transitions, animations, keyframes, easing' },
  { id: 'brand', title: 'Brand & Identity', description: 'Visual identity, logos, brand guidelines' },
];

export function generateIdentity(profile: DesignProfile): string {
  const domainsStr = profile.domains.length > 0
    ? profile.domains.map((d) => `- ${d}`).join('\n')
    : DEFAULT_DOMAINS.map((d) => `- ${d}`).join('\n');

  const toolsStr = profile.tools && profile.tools.length > 0
    ? `\n## Tools\n\n${profile.tools.map((t) => `- ${t}`).join('\n')}\n`
    : '';

  const teamStr = profile.team
    ? `\n## Team\n\n${profile.team}\n`
    : '';

  return `# Design Brain Identity

This is the persistent identity of the design brain agent.
Updated as the system learns from captures and synthesis.

## Focus

${profile.focus}

## Domains

${domainsStr}
${profile.philosophy ? `\n## Philosophy\n\n${profile.philosophy}\n` : ''}${toolsStr}${teamStr}
## Methodology

This agent captures design inspiration from websites and screenshots,
extracts reusable patterns, records design decisions with rationale,
and builds cross-project principles backed by evidence.

The knowledge graph grows through: Capture → Extract → Synthesize → Evolve → Verify.
`;
}

export function generateMethodology(): string {
  return `# Design Brain Methodology

## How This Agent Thinks

1. **Capture** — Ingest design inspiration from URLs or screenshots
2. **Extract** — Identify reusable patterns, notable decisions, emerging principles
3. **Synthesize** — Find connections across notes, update Maps of Content
4. **Evolve** — Backward pass: update older notes with new evidence
5. **Verify** — Check schema compliance, link health, MOC coverage

## Note Types

- **Patterns** — Reusable design approaches observed across captures
  - Confidence: emerging → established → canonical
- **Decisions** — Specific design choices with rationale
  - Status: active → superseded → revisiting
- **Principles** — Cross-project truths backed by evidence
  - Confidence: emerging → established → canonical

## Linking

Notes use wiki links \`[[note-name]]\` to connect to:
- Inspiration captures in \`projects/\`
- Other notes in \`notes/\`
- MOCs in \`notes/mocs/\`

## Growth

- Patterns emerge from single captures, strengthen as more evidence appears
- Principles are promoted from patterns when evidence spans 3+ sources
- Decisions reference patterns and principles as justification
`;
}

export function generateMocHub(db: DesignBrainDatabase): string {
  const projectLinks = db.projects.length > 0
    ? db.projects.map((p) => `- [${p.name}](../../projects/${p.id}/README.md) — ${p.inspirations.length} inspirations`).join('\n')
    : '- No projects yet';

  const domainLinks = DOMAIN_MOCS
    .map((d) => `- [${d.title}](./${d.id}.md) — ${d.description}`)
    .join('\n');

  return `# Design Brain Hub

Central navigation for the design knowledge graph.

## Domain Maps

${domainLinks}

## Projects

${projectLinks}

## Recent Activity

<!-- Auto-updated during Synthesize phase -->
- System initialized

## Quick Access

- [Identity](../../self/identity.md)
- [Methodology](../../self/methodology.md)
- [Maintenance](../../ops/maintenance.md)
`;
}

export function generateDomainMoc(domain: typeof DOMAIN_MOCS[number], db: DesignBrainDatabase): string {
  const notesByDomain = `<!-- Notes tagged with '${domain.id}' will be listed here during Synthesize -->\n- No notes yet`;

  // Find relevant inspirations that have data for this domain
  const relevantInspirations: string[] = [];
  for (const project of db.projects) {
    for (const inspo of project.inspirations) {
      let relevant = false;
      if (domain.id === 'color-systems' && inspo.analysis.colors.length > 0) relevant = true;
      if (domain.id === 'typography' && inspo.analysis.typography.length > 0) relevant = true;
      if (domain.id === 'components' && inspo.analysis.components.length > 0) relevant = true;
      if (domain.id === 'layout' && inspo.analysis.layout.length > 0) relevant = true;
      if (domain.id === 'motion' && inspo.analysis.motion.length > 0) relevant = true;
      if (domain.id === 'brand') relevant = inspo.analysis.colors.length > 5;

      if (relevant) {
        relevantInspirations.push(`- [[${inspo.id}]] (${inspo.name}) — ${project.name}`);
      }
    }
  }

  const inspoSection = relevantInspirations.length > 0
    ? relevantInspirations.join('\n')
    : '- No inspirations captured yet';

  return `# ${domain.title}

${domain.description}

## Patterns

${notesByDomain}

## Decisions

<!-- Decisions tagged with '${domain.id}' will be listed here -->
- No decisions yet

## Principles

<!-- Principles with evidence from '${domain.id}' will be listed here -->
- No principles yet

## Source Inspirations

${inspoSection}
`;
}

export function generateMaintenance(): string {
  return `# Maintenance

System health signals and pending work.

## Queue Status

- Pending extractions: 0
- Pending synthesis: 0

## Last Session

- No sessions recorded yet

## Signals

<!-- Warnings and suggestions surfaced by verify -->
- System initialized, no issues detected
`;
}

export async function ensureKnowledgeFiles(rootDir: string, db: DesignBrainDatabase, profile?: DesignProfile): Promise<void> {
  const root = brainRoot(rootDir);

  // Generate self/ files if they don't exist
  const identityPath = path.join(root, 'self', 'identity.md');
  if (!await fs.pathExists(identityPath)) {
    const effectiveProfile = profile ?? {
      domains: DEFAULT_DOMAINS,
      focus: 'Capturing and synthesizing design inspiration across web, brand, mobile, and design systems.',
    };
    await fs.writeFile(identityPath, generateIdentity(effectiveProfile));
  }

  const methodologyPath = path.join(root, 'self', 'methodology.md');
  if (!await fs.pathExists(methodologyPath)) {
    await fs.writeFile(methodologyPath, generateMethodology());
  }

  // Always regenerate MOC hub and domain MOCs (they reflect current data)
  const hubPath = path.join(root, 'notes', 'mocs', 'hub.md');
  await fs.writeFile(hubPath, generateMocHub(db));

  for (const domain of DOMAIN_MOCS) {
    const mocPath = path.join(root, 'notes', 'mocs', `${domain.id}.md`);
    await fs.writeFile(mocPath, generateDomainMoc(domain, db));
  }

  // Generate maintenance file if it doesn't exist
  const maintenancePath = path.join(root, 'ops', 'maintenance.md');
  if (!await fs.pathExists(maintenancePath)) {
    await fs.writeFile(maintenancePath, generateMaintenance());
  }
}
