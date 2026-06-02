import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2 } from "lucide-react";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (api) {
        const res = await api.search.keyword(query);
        setResults(res.results || []);
      } else {
        setResults(["Search requires Electron environment"]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">Search across your design knowledge base</p>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patterns, decisions, colors, components..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>
      {results.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Results ({results.length})</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="rounded-md border border-border p-3">
                    <p className="font-mono text-sm">{r}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
