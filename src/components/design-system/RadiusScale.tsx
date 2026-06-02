import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const radii = [
  { label: "sm", value: "0.45rem", className: "rounded-sm" },
  { label: "md", value: "0.6rem", className: "rounded-md" },
  { label: "lg", value: "0.75rem", className: "rounded-lg" },
  { label: "xl", value: "1.05rem", className: "rounded-xl" },
  { label: "2xl", value: "1.35rem", className: "rounded-2xl" },
  { label: "3xl", value: "1.65rem", className: "rounded-3xl" },
  { label: "full", value: "9999px", className: "rounded-full" },
];

export function RadiusScale() {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold text-indigo">border radius</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">
            base radius: 0.75rem (12px)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {radii.map((r) => (
              <div key={r.label} className="flex flex-col items-center gap-2">
                <div
                  className={`h-16 w-16 border-2 border-cobalt bg-peach ${r.className}`}
                />
                <span className="text-xs font-medium text-foreground">{r.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{r.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
