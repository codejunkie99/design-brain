export {};

declare global {
  interface Window {
    electronAPI?: {
      capture: {
        ingest: (opts: any) => Promise<any>;
        list: (project: string) => Promise<any>;
        get: (project: string, id: string) => Promise<any>;
      };
      search: {
        keyword: (query: string) => Promise<any>;
        semantic: (query: string) => Promise<any>;
      };
      export: {
        tokens: (opts: { project: string; format: string }) => Promise<any>;
      };
      project: {
        init: (root: string) => Promise<any>;
        list: () => Promise<string[]>;
        stats: (project: string) => Promise<any>;
        setRoot: (root: string) => Promise<void>;
        getRoot: () => Promise<string | null>;
      };
      knowledge: {
        graph: (project: string) => Promise<any>;
        patterns: (project: string) => Promise<any>;
        decisions: (project: string) => Promise<any>;
        note: (path: string) => Promise<any>;
      };
    };
  }
}
