import { contextBridge, ipcRenderer } from "electron";

export type ElectronAPI = {
  capture: {
    ingest: (opts: { url?: string; screenshot?: string; project: string; name: string; tags?: string[]; viewports?: string[]; journeySteps?: number }) => Promise<unknown>;
    list: (project: string) => Promise<unknown>;
    get: (project: string, id: string) => Promise<unknown>;
  };
  search: {
    keyword: (query: string) => Promise<unknown>;
    semantic: (query: string) => Promise<unknown>;
  };
  export: {
    tokens: (opts: { project: string; format: string }) => Promise<unknown>;
  };
  project: {
    init: (root: string) => Promise<unknown>;
    list: () => Promise<unknown>;
    stats: (project: string) => Promise<unknown>;
    setRoot: (root: string) => Promise<void>;
    getRoot: () => Promise<string | null>;
  };
  knowledge: {
    graph: (project: string) => Promise<unknown>;
    patterns: (project: string) => Promise<unknown>;
    decisions: (project: string) => Promise<unknown>;
    note: (path: string) => Promise<unknown>;
  };
};

const electronAPI: ElectronAPI = {
  capture: {
    ingest: (opts) => ipcRenderer.invoke("capture:ingest", opts),
    list: (project) => ipcRenderer.invoke("capture:list", project),
    get: (project, id) => ipcRenderer.invoke("capture:get", project, id),
  },
  search: {
    keyword: (query) => ipcRenderer.invoke("search:keyword", query),
    semantic: (query) => ipcRenderer.invoke("search:semantic", query),
  },
  export: {
    tokens: (opts) => ipcRenderer.invoke("export:tokens", opts),
  },
  project: {
    init: (root) => ipcRenderer.invoke("project:init", root),
    list: () => ipcRenderer.invoke("project:list"),
    stats: (project) => ipcRenderer.invoke("project:stats", project),
    setRoot: (root) => ipcRenderer.invoke("project:setRoot", root),
    getRoot: () => ipcRenderer.invoke("project:getRoot"),
  },
  knowledge: {
    graph: (project) => ipcRenderer.invoke("knowledge:graph", project),
    patterns: (project) => ipcRenderer.invoke("knowledge:patterns", project),
    decisions: (project) => ipcRenderer.invoke("knowledge:decisions", project),
    note: (notePath) => ipcRenderer.invoke("knowledge:note", notePath),
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
