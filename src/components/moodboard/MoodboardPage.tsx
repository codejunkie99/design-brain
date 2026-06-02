import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";

export function MoodboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moodboard</h1>
        <p className="text-muted-foreground">Visual grid of your captured design inspirations</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <LayoutGrid className="h-16 w-16 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            Moodboards will appear here after you capture some inspirations.
          </p>
          <p className="text-xs text-muted-foreground">
            Use the Capture page to ingest URLs or screenshots.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
