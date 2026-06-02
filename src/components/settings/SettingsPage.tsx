import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAppStore } from "@/stores/appStore";
import { FolderOpen, RefreshCw } from "lucide-react";

export function SettingsPage() {
  const { brainRoot, setBrainRoot, setProjects } = useAppStore();
  const [rootInput, setRootInput] = useState(brainRoot || "");

  useEffect(() => {
    setRootInput(brainRoot || "");
  }, [brainRoot]);

  const handleSetRoot = async () => {
    if (!rootInput.trim()) return;
    const api = (window as any).electronAPI;
    if (api) {
      await api.project.setRoot(rootInput.trim());
      setBrainRoot(rootInput.trim());
      const projects = await api.project.list();
      setProjects(projects || []);
      toast.success("Brain root updated!");
    } else {
      setBrainRoot(rootInput.trim());
      toast.info("Saved locally (Electron API not available)");
    }
  };

  const handleInit = async () => {
    if (!rootInput.trim()) return;
    const api = (window as any).electronAPI;
    if (api) {
      await api.project.init(rootInput.trim());
      toast.success("Design Brain initialized!");
    } else {
      toast.info("Init requires Electron environment");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your Design Brain environment</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Brain Root Directory</CardTitle>
          <CardDescription>Set the root directory where .design-brain/ lives</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="/path/to/your/project"
              value={rootInput}
              onChange={(e) => setRootInput(e.target.value)}
            />
            <Button onClick={handleSetRoot}>
              <FolderOpen className="mr-2 h-4 w-4" />Set Root
            </Button>
          </div>
          <Button variant="outline" onClick={handleInit}>
            <RefreshCw className="mr-2 h-4 w-4" />Initialize .design-brain/
          </Button>
        </CardContent>
      </Card>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>LLM Configuration</CardTitle>
          <CardDescription>Optional: Configure an LLM for semantic search</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Base URL</label>
            <Input placeholder="https://api.openai.com/v1" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <Input type="password" placeholder="sk-..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <Input placeholder="gpt-4o-mini" />
          </div>
          <Button variant="outline">Save LLM Config</Button>
        </CardContent>
      </Card>
    </div>
  );
}
