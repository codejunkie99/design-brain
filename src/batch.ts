import fs from 'fs-extra';
import { ingestInspiration } from './commands.js';

export interface BatchEntry {
  url: string;
  name?: string;
  tags: string[];
}

export function parseBatchFile(content: string): BatchEntry[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const parts = line.split('\t');
      const url = parts[0].trim();
      const name = parts[1]?.trim() || undefined;
      const tags = parts[2] ? parts[2].split(',').map((t) => t.trim()).filter(Boolean) : [];
      return { url, name, tags };
    });
}

export async function batchCapture(params: {
  rootDir: string;
  project: string;
  filePath: string;
  skipVisuals: boolean;
}): Promise<{ total: number; succeeded: number; failed: string[] }> {
  const content = await fs.readFile(params.filePath, 'utf-8');
  const entries = parseBatchFile(content);
  const failed: string[] = [];
  let succeeded = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const label = entry.name || entry.url;
    console.log(`[${i + 1}/${entries.length}] Capturing ${label}...`);

    try {
      await ingestInspiration({
        rootDir: params.rootDir,
        project: params.project,
        url: entry.url,
        name: entry.name,
        tags: entry.tags,
        skipVisuals: params.skipVisuals,
      });
      succeeded++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  Failed: ${msg}`);
      failed.push(entry.url);
    }
  }

  return { total: entries.length, succeeded, failed };
}
