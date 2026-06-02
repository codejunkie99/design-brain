import { create } from "zustand";

type AppState = {
  currentProject: string | null;
  brainRoot: string | null;
  projects: string[];
  sidebarOpen: boolean;
  setCurrentProject: (project: string | null) => void;
  setBrainRoot: (root: string | null) => void;
  setProjects: (projects: string[]) => void;
  toggleSidebar: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  currentProject: null,
  brainRoot: null,
  projects: [],
  sidebarOpen: true,
  setCurrentProject: (project) => set({ currentProject: project }),
  setBrainRoot: (root) => set({ brainRoot: root }),
  setProjects: (projects) => set({ projects }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
