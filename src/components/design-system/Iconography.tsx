import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Home,
  Camera,
  Network,
  Palette,
  LayoutGrid,
  Search,
  Settings,
  Plus,
  X,
  Check,
  ChevronRight,
  ArrowRight,
  Loader2,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Brain,
  Sparkles,
  Globe,
} from "lucide-react";

const icons = [
  { name: "Home", Icon: Home },
  { name: "Camera", Icon: Camera },
  { name: "Network", Icon: Network },
  { name: "Palette", Icon: Palette },
  { name: "LayoutGrid", Icon: LayoutGrid },
  { name: "Search", Icon: Search },
  { name: "Settings", Icon: Settings },
  { name: "Plus", Icon: Plus },
  { name: "X", Icon: X },
  { name: "Check", Icon: Check },
  { name: "ChevronRight", Icon: ChevronRight },
  { name: "ArrowRight", Icon: ArrowRight },
  { name: "Loader2", Icon: Loader2 },
  { name: "Monitor", Icon: Monitor },
  { name: "Tablet", Icon: Tablet },
  { name: "Smartphone", Icon: Smartphone },
  { name: "Eye", Icon: Eye },
  { name: "Brain", Icon: Brain },
  { name: "Sparkles", Icon: Sparkles },
  { name: "Globe", Icon: Globe },
];

export function Iconography() {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold text-indigo">iconography</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">
            lucide react · stroke width 1.5 · sizes: 16, 20, 24
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-6 sm:grid-cols-10">
            {icons.map(({ name, Icon }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="h-5 w-5 text-indigo" />
                </div>
                <span className="text-[9px] text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">icon sizes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-8">
            {[
              { size: "h-4 w-4", label: "16px (sm)" },
              { size: "h-5 w-5", label: "20px (default)" },
              { size: "h-6 w-6", label: "24px (lg)" },
              { size: "h-8 w-8", label: "32px (xl)" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2">
                <Brain className={`text-cobalt ${s.size}`} />
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
