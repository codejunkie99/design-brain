import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCaptureStore } from "@/stores/captureStore";
import { ExternalLink } from "lucide-react";

export function RecentCaptures() {
  const captures = useCaptureStore((s) => s.captures);
  const recent = captures.slice(0, 5);

  if (recent.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Captures</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No captures yet. Use the quick capture above or go to the Capture
            page to ingest your first inspiration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Captures</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recent.map((capture) => (
            <div
              key={capture.id}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">{capture.name}</p>
                {capture.url && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    <span className="max-w-[300px] truncate">
                      {capture.url}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                {capture.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
