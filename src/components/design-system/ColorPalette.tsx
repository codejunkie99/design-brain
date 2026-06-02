import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const brandColors = [
  { name: "Cobalt", variable: "--color-cobalt", hex: "#0047FF", className: "bg-cobalt" },
  { name: "Cobalt Light", variable: "--color-cobalt-light", hex: "#3366FF", className: "bg-cobalt-light" },
  { name: "Terracotta", variable: "--color-terracotta", hex: "#E28765", className: "bg-terracotta" },
  { name: "Orange Accent", variable: "--color-orange-accent", hex: "#FF5C00", className: "bg-orange-accent" },
  { name: "Peach", variable: "--color-peach", hex: "#FCE3D9", className: "bg-peach" },
  { name: "Pistachio", variable: "--color-pistachio", hex: "#D2E8D4", className: "bg-pistachio" },
  { name: "Lavender", variable: "--color-lavender", hex: "#E3DFFE", className: "bg-lavender" },
  { name: "Ivory", variable: "--color-ivory", hex: "#FDFBF7", className: "bg-ivory" },
  { name: "Indigo", variable: "--color-indigo", hex: "#1A1525", className: "bg-indigo" },
];

const semanticColors = [
  { name: "Background", variable: "--background", hex: "#FDFBF7", className: "bg-background" },
  { name: "Foreground", variable: "--foreground", hex: "#1A1525", className: "bg-foreground" },
  { name: "Primary", variable: "--primary", hex: "#0047FF", className: "bg-primary" },
  { name: "Secondary", variable: "--secondary", hex: "#F3F0ED", className: "bg-secondary" },
  { name: "Muted", variable: "--muted", hex: "#F3F0ED", className: "bg-muted" },
  { name: "Accent", variable: "--accent", hex: "#FCE3D9", className: "bg-accent" },
  { name: "Destructive", variable: "--destructive", hex: "#E5484D", className: "bg-destructive" },
  { name: "Card", variable: "--card", hex: "#FFFFFF", className: "bg-card" },
  { name: "Border", variable: "--border", hex: "#E8E4DF", className: "bg-border" },
];

const chartColors = [
  { name: "Chart 1", hex: "#0047FF", className: "bg-chart-1" },
  { name: "Chart 2", hex: "#FF5C00", className: "bg-chart-2" },
  { name: "Chart 3", hex: "#D2E8D4", className: "bg-chart-3" },
  { name: "Chart 4", hex: "#E3DFFE", className: "bg-chart-4" },
  { name: "Chart 5", hex: "#FCE3D9", className: "bg-chart-5" },
];

function ColorSwatch({ name, hex, className }: { name: string; hex: string; className: string; variable?: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`h-16 w-16 rounded-xl border border-border shadow-xs ${className}`}
      />
      <span className="text-xs font-medium text-foreground">{name}</span>
      <span className="font-mono text-[10px] text-muted-foreground">{hex}</span>
    </div>
  );
}

export function ColorPalette() {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold text-indigo">colors</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">brand palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {brandColors.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">semantic tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {semanticColors.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">chart colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {chartColors.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
