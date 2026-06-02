import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAppStore } from "@/stores/appStore";
import { Download, Palette, Type, Component } from "lucide-react";

const MOCK_COLORS = [
  { name: "Primary", hex: "#533AFD" },
  { name: "Secondary", hex: "#1A1A2E" },
  { name: "Accent", hex: "#E94560" },
  { name: "Surface", hex: "#F8F9FA" },
  { name: "Text Primary", hex: "#16213E" },
  { name: "Text Secondary", hex: "#6C757D" },
];

const MOCK_TYPOGRAPHY = [
  { family: "Inter", weight: "700", size: "48px", usage: "H1 Heading" },
  { family: "Inter", weight: "600", size: "32px", usage: "H2 Heading" },
  { family: "Inter", weight: "500", size: "24px", usage: "H3 Heading" },
  { family: "Inter", weight: "400", size: "16px", usage: "Body" },
  { family: "JetBrains Mono", weight: "400", size: "14px", usage: "Code" },
];

export function TokensPage() {
  const currentProject = useAppStore((s) => s.currentProject);
  const [exportFormat, setExportFormat] = useState("tailwind");

  const handleExport = async () => {
    if (!currentProject) { toast.error("Select a project first"); return; }
    const api = (window as any).electronAPI;
    if (api) {
      const result = await api.export.tokens({ project: currentProject, format: exportFormat });
      if (result.success) toast.success("Exported successfully!");
      else toast.error(result.error);
    } else {
      toast.info("Electron API not available in browser mode");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Design Tokens</h1>
          <p className="text-muted-foreground">Extracted colors, typography, and components</p>
        </div>
        <div className="flex gap-2">
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tailwind">Tailwind</SelectItem>
              <SelectItem value="style-dictionary">Style Dictionary</SelectItem>
              <SelectItem value="css-in-js">CSS-in-JS</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
        </div>
      </div>
      <Tabs defaultValue="colors">
        <TabsList>
          <TabsTrigger value="colors"><Palette className="mr-2 h-4 w-4" />Colors</TabsTrigger>
          <TabsTrigger value="typography"><Type className="mr-2 h-4 w-4" />Typography</TabsTrigger>
          <TabsTrigger value="components"><Component className="mr-2 h-4 w-4" />Components</TabsTrigger>
        </TabsList>
        <TabsContent value="colors">
          <Card>
            <CardHeader><CardTitle>Color Palette</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {MOCK_COLORS.map((color) => (
                  <div key={color.name} className="space-y-2">
                    <div className="h-20 rounded-lg border" style={{ backgroundColor: color.hex }} />
                    <p className="text-xs font-medium">{color.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{color.hex}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="typography">
          <Card>
            <CardHeader><CardTitle>Typography Scale</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-6">
                {MOCK_TYPOGRAPHY.map((t, i) => (
                  <div key={i} className="flex items-baseline justify-between border-b border-border pb-4 last:border-0">
                    <span style={{ fontFamily: t.family, fontWeight: Number(t.weight), fontSize: t.size }}>
                      {t.usage}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {t.family} / {t.weight} / {t.size}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="components">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Component className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">Component tokens appear after capturing websites</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
