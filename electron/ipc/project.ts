import type { IpcMain } from "electron";
import { runCli, getDesignBrainRoot, setDesignBrainRoot, readJsonFile } from "./helpers.js";
import path from "path";
import fs from "fs/promises";

export function registerProjectHandlers(ipcMain: IpcMain) {
  ipcMain.handle("project:init", async (_event, root: string) => {
    return runCli(["init", "--root", root], root);
  });

  ipcMain.handle("project:list", async () => {
    const root = await getDesignBrainRoot();
    if (!root) return [];
    const projectsDir = path.join(root, ".design-brain", "projects");
    try {
      const entries = await fs.readdir(projectsDir, { withFileTypes: true });
      return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      return [];
    }
  });

  ipcMain.handle("project:stats", async (_event, project: string) => {
    const root = await getDesignBrainRoot();
    if (!root) return null;
    try {
      const dbFile = path.join(root, ".design-brain", "database.json");
      const db = (await readJsonFile(dbFile)) as {
        inspirations?: unknown[];
        outcomes?: unknown[];
      };
      const inspirations = (db.inspirations || []).filter(
        (i: any) => i.project === project,
      );
      const patternsDir = path.join(root, ".design-brain", "notes", "patterns");
      const decisionsDir = path.join(
        root,
        ".design-brain",
        "notes",
        "decisions",
      );
      let patternCount = 0;
      let decisionCount = 0;
      try {
        patternCount = (await fs.readdir(patternsDir)).filter((f) =>
          f.endsWith(".md"),
        ).length;
      } catch {
        /* empty */
      }
      try {
        decisionCount = (await fs.readdir(decisionsDir)).filter((f) =>
          f.endsWith(".md"),
        ).length;
      } catch {
        /* empty */
      }
      return {
        captures: inspirations.length,
        patterns: patternCount,
        decisions: decisionCount,
        outcomes: ((db.outcomes || []) as any[]).filter(
          (o: any) => o.project === project,
        ).length,
      };
    } catch {
      return { captures: 0, patterns: 0, decisions: 0, outcomes: 0 };
    }
  });

  ipcMain.handle("project:setRoot", async (_event, root: string) => {
    await setDesignBrainRoot(root);
  });

  ipcMain.handle("project:getRoot", async () => {
    return getDesignBrainRoot();
  });
}
