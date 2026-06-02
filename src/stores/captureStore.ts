import { create } from "zustand";
import type { Capture, ProjectStats } from "@/types";

type CaptureState = {
  captures: Capture[];
  stats: ProjectStats | null;
  isLoading: boolean;
  setCaptures: (captures: Capture[]) => void;
  setStats: (stats: ProjectStats | null) => void;
  setLoading: (loading: boolean) => void;
};

export const useCaptureStore = create<CaptureState>((set) => ({
  captures: [],
  stats: null,
  isLoading: false,
  setCaptures: (captures) => set({ captures }),
  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),
}));
