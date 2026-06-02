import { useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { useCaptureStore } from "@/stores/captureStore";

export function useInitialize() {
  const { setProjects, setBrainRoot, setCurrentProject, currentProject } =
    useAppStore();
  const { setCaptures, setStats, setLoading } = useCaptureStore();

  // Load root + projects on mount
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    async function init() {
      const root = await api!.project.getRoot();
      if (root) {
        setBrainRoot(root);
        const projects = await api!.project.list();
        setProjects(projects || []);
        if (projects.length > 0 && !currentProject) {
          setCurrentProject(projects[0]);
        }
      }
    }
    init();
  }, []);

  // Load stats + captures when project changes
  useEffect(() => {
    const api = window.electronAPI;
    if (!api || !currentProject) return;

    async function loadProject() {
      setLoading(true);
      try {
        const [stats, captures] = await Promise.all([
          api!.project.stats(currentProject!),
          api!.capture.list(currentProject!),
        ]);
        setStats(stats);
        setCaptures(
          Array.isArray(captures)
            ? captures.map((c: any) => ({
                id: c.id || c.slug || c.file || String(Math.random()),
                project: currentProject!,
                name: c.name || c.title || c.file || "Untitled",
                url: c.url || "",
                tags: c.tags || [],
                date: c.date || c.created || "",
                tokens: c.tokens,
              }))
            : [],
        );
      } catch {
        // Silently handle — might not have data yet
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [currentProject]);
}
