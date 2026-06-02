import type { IpcMain } from "electron";
import { runCli, getDesignBrainRoot, readJsonFile } from "./helpers.js";
import path from "path";
import fs from "fs/promises";

export function registerCaptureHandlers(ipcMain: IpcMain) {
  ipcMain.handle("capture:ingest", async (_event, opts) => {
    const args = ["ingest", "--project", opts.project, "--name", opts.name];
    if (opts.url) args.push("--url", opts.url);
    if (opts.screenshot) args.push("--screenshot", opts.screenshot);
    if (opts.tags?.length) args.push("--tags", opts.tags.join(","));
    if (opts.viewports?.length) {
      args.push("--viewport", ...opts.viewports);
    }
    if (opts.journeySteps) args.push("--journey-steps", String(opts.journeySteps));
    return runCli(args);
  });

  ipcMain.handle("capture:list", async (_event, project) => {
    const root = await getDesignBrainRoot();
    if (!root) return [];
    const dbPath = path.join(root, ".design-brain", "projects", project);
    try {
      const dbFile = path.join(root, ".design-brain", "database.json");
      const db = (await readJsonFile(dbFile)) as { inspirations?: unknown[] };
      return (db.inspirations || []).filter((i: any) => i.project === project);
    } catch {
      try {
        const inspoDir = path.join(dbPath, "inspirations");
        const files = await fs.readdir(inspoDir);
        return files.filter((f) => f.endsWith(".md")).map((f) => ({ id: f.replace(".md", ""), file: f }));
      } catch {
        return [];
      }
    }
  });

  ipcMain.handle("capture:get", async (_event, project, id) => {
    const root = await getDesignBrainRoot();
    if (!root) return null;
    try {
      const dbFile = path.join(root, ".design-brain", "database.json");
      const db = (await readJsonFile(dbFile)) as { inspirations?: unknown[] };
      return (db.inspirations || []).find((i: any) => i.id === id || i.slug === id);
    } catch {
      return null;
    }
  });
}
