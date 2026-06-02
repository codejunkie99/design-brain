import type { IpcMain } from "electron";
import { runCli } from "./helpers.js";

export function registerExportHandlers(ipcMain: IpcMain) {
  ipcMain.handle("export:tokens", async (_event, opts: { project: string; format: string }) => {
    try {
      const result = await runCli(["export", "--project", opts.project, "--format", opts.format]);
      return { success: true, output: result };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });
}
