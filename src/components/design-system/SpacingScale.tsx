import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const spacingValues = [
  { label: "0.5", px: "2px", className: "w-0.5" },
  { label: "1", px: "4px", className: "w-1" },
  { label: "2", px: "8px", className: "w-2" },
  { label: "3", px: "12px", className: "w-3" },
  { label: "4", px: "16px", className: "w-4" },
  { label: "5", px: "20px", className: "w-5" },
  { label: "6", px: "24px", className: "w-6" },
  { label: "8", px: "32px", className: "w-8" },
  { label: "10", px: "40px", className: "w-10" },
  { label: "12", px: "48px", className: "w-12" },
  { label: "16", px: "64px", className: "w-16" },
  { label: "20", px: "80px", className: "w-20" },
  { label: "24", px: "96px", className: "w-24" },
];

export function SpacingScale() {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold text-indigo">spacing</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">
            base unit: 4px · tailwind scale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {spacingValues.map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <span className="w-8 text-right font-mono text-xs text-muted-foreground">
                {s.label}
              </span>
              <div className={`h-3 rounded-xs bg-cobalt/70 ${s.className}`} />
              <span className="font-mono text-[10px] text-muted-foreground">
                {s.px}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
