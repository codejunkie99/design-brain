import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/stores/appStore";
import { Network, GitBranch, Lightbulb } from "lucide-react";
import type { Note } from "@/types";

export function KnowledgeGraphPage() {
  const currentProject = useAppStore((s) => s.currentProject);
  const [patterns, setPatterns] = useState<Note[]>([]);
  const [decisions, setDecisions] = useState<Note[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({
    nodes: [],
    links: [],
  });


  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api || !currentProject) return;
    api.knowledge
      .patterns(currentProject)
      .then((p: Note[]) => setPatterns(p || []));
    api.knowledge
      .decisions(currentProject)
      .then((d: Note[]) => setDecisions(d || []));
    api.knowledge.graph(currentProject).then((g: any) => {
      if (g?.entities) {
        const nodes = g.entities.map((e: any) => ({
          id: e.id,
          label: e.label,
          type: e.type,
        }));
        const links = g.relations.map((r: any) => ({
          source: r.source,
          target: r.target,
          label: r.relation,
        }));
        setGraphData({ nodes, links });
      }
    });
  }, [currentProject]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
        <p className="text-muted-foreground">
          Explore patterns, decisions, and connections in your design brain
        </p>
      </div>
      <Tabs defaultValue="graph">
        <TabsList>
          <TabsTrigger value="graph">
            <Network className="mr-2 h-4 w-4" />
            Graph
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <GitBranch className="mr-2 h-4 w-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="decisions">
            <Lightbulb className="mr-2 h-4 w-4" />
            Decisions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="graph">
          <Card>
            <CardContent className="p-0">
              <div className="flex h-[500px] items-center justify-center rounded-lg border border-dashed border-border">
                {graphData.nodes.length > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Graph visualization: {graphData.nodes.length} nodes,{" "}
                    {graphData.links.length} connections
                  </p>
                ) : (
                  <div className="text-center">
                    <Network className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No graph data yet. Run the pipeline to generate
                      connections.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="patterns">
          <NotesList
            notes={patterns}
            emptyText="No patterns extracted yet."
            icon={GitBranch}
          />
        </TabsContent>
        <TabsContent value="decisions">
          <NotesList
            notes={decisions}
            emptyText="No decisions recorded yet."
            icon={Lightbulb}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotesList({
  notes,
  emptyText,
  icon: Icon,
}: {
  notes: Note[];
  emptyText: string;
  icon: any;
}) {
  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Icon className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">{emptyText}</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3">
        {notes.map((note, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {note.title || "Untitled"}
                </CardTitle>
                {note.confidence && (
                  <Badge variant="outline">{note.confidence}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {note.preview}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
