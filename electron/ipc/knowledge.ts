import type { IpcMain } from "electron";
import { getDesignBrainRoot, listMarkdownFiles, readMarkdownNote, readJsonFile } from "./helpers.js";
import path from "path";

export function registerKnowledgeHandlers(ipcMain: IpcMain) {
  ipcMain.handle("knowledge:graph", async (_event, _project: string) => {
    const root = await getDesignBrainRoot();
    if (!root) return { entities: [], relations: [] };
    try {
      const entitiesPath = path.join(root, ".design-brain", "graph", "entities.csv");
      const relationsPath = path.join(root, ".design-brain", "graph", "relations.csv");
      const fs = await import("fs/promises");
      const [entitiesRaw, relationsRaw] = await Promise.all([
        fs.readFile(entitiesPath, "utf-8").catch(() => ""),
        fs.readFile(relationsPath, "utf-8").catch(() => ""),
      ]);
      const entities = entitiesRaw.split("\n").filter(Boolean).slice(1).map((line) => {
        const [id, type, label] = line.split(",");
        return { id, type, label };
      });
      const relations = relationsRaw.split("\n").filter(Boolean).slice(1).map((line) => {
        const [source, relation, target] = line.split(",");
        return { source, relation, target };
      });
      return { entities, relations };
    } catch {
      return { entities: [], relations: [] };
    }
  });

  ipcMain.handle("knowledge:patterns", async () => {
    const root = await getDesignBrainRoot();
    if (!root) return [];
    const dir = path.join(root, ".design-brain", "notes", "patterns");
    const files = await listMarkdownFiles(dir);
    const notes = await Promise.all(files.map(async (f) => {
      const note = await readMarkdownNote(f);
      return { path: f, ...note.frontmatter, preview: note.content.slice(0, 200) };
    }));
    return notes;
  });

  ipcMain.handle("knowledge:decisions", async () => {
    const root = await getDesignBrainRoot();
    if (!root) return [];
    const dir = path.join(root, ".design-brain", "notes", "decisions");
    const files = await listMarkdownFiles(dir);
    const notes = await Promise.all(files.map(async (f) => {
      const note = await readMarkdownNote(f);
      return { path: f, ...note.frontmatter, preview: note.content.slice(0, 200) };
    }));
    return notes;
  });

  ipcMain.handle("knowledge:note", async (_event, notePath: string) => {
    return readMarkdownNote(notePath);
  });
}
