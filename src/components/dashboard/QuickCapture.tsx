import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/appStore";

export function QuickCapture() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const currentProject = useAppStore((s) => s.currentProject);

  const handleCapture = async () => {
    if (!url.trim()) return;
    if (!currentProject) {
      toast.error("Select a project first");
      return;
    }
    setIsLoading(true);
    try {
      const api = window.electronAPI;
      if (api) {
        await api.capture.ingest({
          url: url.trim(),
          project: currentProject,
          name: new URL(url.trim()).hostname,
        });
        toast.success("Capture started!");
        setUrl("");
      } else {
        toast.info("Electron API not available in browser mode");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Capture failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full bg-peach px-5 py-2.5 shadow-md">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-cobalt" />
        ) : (
          <Plus className="h-4 w-4 text-cobalt" />
        )}
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCapture()}
          placeholder="paste URL to capture..."
          className="bg-transparent text-sm text-indigo placeholder:text-indigo/50 outline-none w-44"
        />
      </div>
    </div>
  );
}
