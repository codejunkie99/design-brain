import { ColorPalette } from "./ColorPalette";
import { TypographyShowcase } from "./TypographyShowcase";
import { SpacingScale } from "./SpacingScale";
import { RadiusScale } from "./RadiusScale";
import { ComponentShowcase } from "./ComponentShowcase";
import { Iconography } from "./Iconography";

export function DesignSystemPage() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <header>
        <h1 className="text-5xl font-extrabold tracking-tight text-indigo leading-tight">
          design system
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          variant 3 — terracotta & cobalt
        </p>
        <div className="mt-4 h-1 w-32 rounded-full bg-cobalt" />
      </header>

      {/* Colors */}
      <ColorPalette />

      {/* Typography */}
      <TypographyShowcase />

      {/* Spacing */}
      <SpacingScale />

      {/* Radius */}
      <RadiusScale />

      {/* Icons */}
      <Iconography />

      {/* Components */}
      <ComponentShowcase />
    </div>
  );
}
