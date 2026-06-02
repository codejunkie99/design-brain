import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const typeSamples = [
  { label: "Display", className: "text-5xl font-extrabold tracking-tight", text: "Graph Builder" },
  { label: "H1", className: "text-4xl font-bold tracking-tight", text: "Knowledge Systems" },
  { label: "H2", className: "text-2xl font-bold", text: "Design Tokens" },
  { label: "H3", className: "text-xl font-semibold", text: "Pattern Recognition" },
  { label: "H4", className: "text-lg font-semibold", text: "Component Anatomy" },
  { label: "Body Large", className: "text-base font-normal", text: "The quick brown fox jumps over the lazy dog. Design decisions are documented as structured knowledge." },
  { label: "Body", className: "text-sm font-normal", text: "The quick brown fox jumps over the lazy dog. Each capture is analyzed and broken into reusable fragments." },
  { label: "Caption", className: "text-xs font-medium text-muted-foreground", text: "captured 3 hours ago · 12 tokens extracted" },
  { label: "Overline", className: "text-[10px] uppercase tracking-widest font-medium text-muted-foreground", text: "processing queue" },
];

export function TypographyShowcase() {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold text-indigo">typography</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">
            font: outfit · weight scale: 400–800
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {typeSamples.map((sample) => (
            <div key={sample.label} className="flex items-baseline gap-6 border-b border-border pb-4 last:border-0 last:pb-0">
              <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">
                {sample.label}
              </span>
              <p className={`text-indigo ${sample.className}`}>{sample.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">font weights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { weight: "font-normal", label: "Regular (400)" },
              { weight: "font-medium", label: "Medium (500)" },
              { weight: "font-semibold", label: "Semibold (600)" },
              { weight: "font-bold", label: "Bold (700)" },
              { weight: "font-extrabold", label: "Extrabold (800)" },
            ].map((w) => (
              <div key={w.label} className="text-center">
                <p className={`text-lg text-indigo ${w.weight}`}>Aa</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{w.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
