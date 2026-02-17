import path from 'node:path';
import fs from 'fs-extra';
import { nowIso, slugify } from './util.js';
import type { DesignBrainDatabase, ProjectRecord } from './types.js';

export function brainRoot(rootDir: string): string {
  return path.join(rootDir, '.design-brain');
}

export function databasePath(rootDir: string): string {
  return path.join(brainRoot(rootDir), 'database.json');
}

export function projectDir(rootDir: string, projectId: string): string {
  return path.join(brainRoot(rootDir), 'projects', projectId);
}

export function projectAssetDir(rootDir: string, projectId: string): string {
  return path.join(brainRoot(rootDir), 'assets', projectId);
}

export async function ensureBrainExists(rootDir: string): Promise<void> {
  const base = brainRoot(rootDir);
  await fs.ensureDir(path.join(base, 'projects'));
  await fs.ensureDir(path.join(base, 'assets'));
  await fs.ensureDir(path.join(base, 'graph'));

  const dbFile = databasePath(rootDir);
  if (!(await fs.pathExists(dbFile))) {
    const db: DesignBrainDatabase = {
      version: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      projects: [],
    };
    await fs.writeJson(dbFile, db, { spaces: 2 });
  }
}

export async function loadDatabase(rootDir: string): Promise<DesignBrainDatabase> {
  await ensureBrainExists(rootDir);
  const db = await fs.readJson(databasePath(rootDir));
  return db as DesignBrainDatabase;
}

export async function saveDatabase(rootDir: string, db: DesignBrainDatabase): Promise<void> {
  db.updatedAt = nowIso();
  await fs.writeJson(databasePath(rootDir), db, { spaces: 2 });
}

export function findProject(db: DesignBrainDatabase, projectId: string): ProjectRecord | undefined {
  return db.projects.find((project) => project.id === projectId);
}

export function ensureProject(db: DesignBrainDatabase, options: {
  projectId: string;
  projectName?: string;
  description?: string;
}): ProjectRecord {
  const normalizedId = slugify(options.projectId);
  const now = nowIso();
  let project = findProject(db, normalizedId);

  if (!project) {
    project = {
      id: normalizedId,
      name: options.projectName?.trim() || options.projectId,
      description: options.description,
      createdAt: now,
      updatedAt: now,
      inspirations: [],
      outcomes: [],
    };
    db.projects.push(project);
  }

  if (options.projectName?.trim()) {
    project.name = options.projectName.trim();
  }

  if (options.description !== undefined) {
    project.description = options.description;
  }

  project.updatedAt = now;
  return project;
}
