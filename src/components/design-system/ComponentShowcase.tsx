import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, ArrowRight, Loader2 } from "lucide-react";

export function ComponentShowcase() {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold text-indigo">components</h2>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">buttons</CardTitle>
          <CardDescription>Primary actions, secondary, ghost, destructive, and sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <Separator />
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
          <Separator />
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <ArrowRight className="h-4 w-4" />
              With Icon
            </Button>
            <Button disabled>Disabled</Button>
            <Button disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="bg-peach text-indigo">Peach</Badge>
            <Badge className="bg-pistachio text-indigo">Pistachio</Badge>
            <Badge className="bg-lavender text-indigo">Lavender</Badge>
            <Badge className="bg-cobalt text-white">Cobalt</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium">Default card</p>
                <p className="text-xs text-muted-foreground">White background with subtle border</p>
              </CardContent>
            </Card>
            <Card className="bg-peach border-0">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-indigo">Peach card</p>
                <p className="text-xs text-indigo/60">Warm accent surface</p>
              </CardContent>
            </Card>
            <Card className="bg-pistachio border-0">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-indigo">Pistachio card</p>
                <p className="text-xs text-indigo/60">Cool accent surface</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Default input..." />
          <Input placeholder="Disabled input..." disabled />
          <div className="flex items-center gap-3">
            <Checkbox id="check-demo" />
            <label htmlFor="check-demo" className="text-sm">Checkbox label</label>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={25} />
          <Progress value={60} />
          <Progress value={100} />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">tabs</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="colors">
            <TabsList>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="spacing">Spacing</TabsTrigger>
            </TabsList>
            <TabsContent value="colors" className="mt-4">
              <p className="text-sm text-muted-foreground">Color tokens panel content</p>
            </TabsContent>
            <TabsContent value="typography" className="mt-4">
              <p className="text-sm text-muted-foreground">Typography specimens panel content</p>
            </TabsContent>
            <TabsContent value="spacing" className="mt-4">
              <p className="text-sm text-muted-foreground">Spacing scale panel content</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Avatars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm lowercase text-muted-foreground">avatars</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback>DB</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback className="bg-cobalt text-white">DB</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback className="bg-terracotta text-white">DB</AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
