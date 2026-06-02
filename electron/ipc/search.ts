import type { IpcMain } from "electron";
import { runCli } from "./helpers.js";

export function registerSearchHandlers(ipcMain: IpcMain) {
  ipcMain.handle("search:keyword", async (_event, query: string) => {
    try {
      const result = await runCli(["search", "--query", query]);
      return { success: true, results: result.split("\n").filter(Boolean) };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle("search:semantic", async (_event, query: string) => {
    try {
      const result = await runCli(["ask", "--query", query]);
      return { success: true, results: result.split("\n").filter(Boolean) };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });
}
