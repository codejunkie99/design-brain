import { Camera, GitBranch, Lightbulb, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCaptureStore } from "@/stores/captureStore";

export function StatsCards() {
  const stats = useCaptureStore((s) => s.stats);

  const items = [
    {
      title: "Captures",
      value: stats?.captures ?? 0,
      icon: Camera,
      description: "Design inspirations captured",
    },
    {
      title: "Patterns",
      value: stats?.patterns ?? 0,
      icon: GitBranch,
      description: "Reusable design patterns",
    },
    {
      title: "Decisions",
      value: stats?.decisions ?? 0,
      icon: Lightbulb,
      description: "Design decisions recorded",
    },
    {
      title: "Outcomes",
      value: stats?.outcomes ?? 0,
      icon: Trophy,
      description: "Shipped design outcomes",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {item.title}
            </CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
