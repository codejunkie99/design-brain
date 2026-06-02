import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAppStore } from "@/stores/appStore";
import { Camera, Loader2, Monitor, Tablet, Smartphone, X } from "lucide-react";

export function CapturePage() {
  const currentProject = useAppStore((s) => s.currentProject);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [viewports, setViewports] = useState({ desktop: true, tablet: false, mobile: false });
  const [journeySteps, setJourneySteps] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSubmit = async () => {
    if (!currentProject) { toast.error("Select a project first"); return; }
    if (!url.trim() && !name.trim()) { toast.error("URL or name required"); return; }
    setIsLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (api) {
        const selectedViewports: string[] = [];
        if (viewports.desktop) selectedViewports.push("desktop=1440x900");
        if (viewports.tablet) selectedViewports.push("tablet=1024x1366");
        if (viewports.mobile) selectedViewports.push("mobile=390x844");
        await api.capture.ingest({
          url: url.trim() || undefined,
          project: currentProject,
          name: name.trim() || new URL(url.trim()).hostname,
          tags,
          viewports: selectedViewports,
          journeySteps: journeySteps || undefined,
        });
        toast.success("Capture complete!");
        setUrl(""); setName(""); setTags([]);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Capture</h1>
        <p className="text-muted-foreground">Capture design inspiration from any URL or screenshot</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New Capture</CardTitle>
          <CardDescription>Enter a URL to extract design tokens, components, and patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <Input placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input placeholder="Inspiration name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button variant="outline" onClick={addTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Viewports</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={viewports.desktop} onCheckedChange={(c) => setViewports({ ...viewports, desktop: !!c })} />
                <Monitor className="h-4 w-4" /> Desktop
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={viewports.tablet} onCheckedChange={(c) => setViewports({ ...viewports, tablet: !!c })} />
                <Tablet className="h-4 w-4" /> Tablet
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={viewports.mobile} onCheckedChange={(c) => setViewports({ ...viewports, mobile: !!c })} />
                <Smartphone className="h-4 w-4" /> Mobile
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Journey Steps (0 = disabled)</label>
            <Input type="number" min={0} max={10} value={journeySteps} onChange={(e) => setJourneySteps(Number(e.target.value))} className="w-32" />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
            {isLoading ? "Capturing..." : "Start Capture"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
