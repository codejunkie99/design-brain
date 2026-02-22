export type SourceType = 'url' | 'screenshot';

export interface ColorToken {
  hex: string;
  count: number;
  samples: string[];
}

export interface TypographyToken {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  count: number;
}

export interface ComponentToken {
  kind: string;
  tag: string;
  selector: string;
  text: string;
  className: string;
  styles: Record<string, string>;
  html?: string;
}

export interface TransitionDetail {
  property: string;
  duration: string;
  timingFunction: string;
  delay: string;
}

export interface AnimationDetail {
  name: string;
  duration: string;
  timingFunction: string;
  delay: string;
  iterationCount: string;
  direction: string;
  fillMode: string;
}

export interface KeyframeRule {
  name: string;
  steps: Array<{ offset: string; declarations: Record<string, string> }>;
}

export interface MotionToken {
  selector: string;
  transition: string;
  animation: string;
  transform: string;
  transitions?: TransitionDetail[];
  animations?: AnimationDetail[];
}

export interface LayoutToken {
  tag: string;
  selector: string;
  role: string;
  children: number;
}

export interface ResponsiveSnapshot {
  label: string;
  viewport: {
    width: number;
    height: number;
  };
  url?: string;
  title?: string;
  colorCount: number;
  componentCount: number;
  typographyCount: number;
}

export interface StateStyleToken {
  selector: string;
  state: 'hover' | 'focus' | 'active';
  declarations: Record<string, string>;
}

export interface JourneyStep {
  step: number;
  action: string;
  fromUrl?: string;
  toUrl?: string;
  title?: string;
  summary?: string;
}

export interface DesignAnalysis {
  pageTitle?: string;
  pageUrl?: string;
  viewport?: {
    width: number;
    height: number;
  };
  colors: ColorToken[];
  typography: TypographyToken[];
  components: ComponentToken[];
  motion: MotionToken[];
  keyframes?: KeyframeRule[];
  layout: LayoutToken[];
  cssVariables: Record<string, string>;
  accessibilitySnapshot?: string;
  responsiveSnapshots?: ResponsiveSnapshot[];
  stateStyles?: StateStyleToken[];
  journey?: JourneyStep[];
}

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs?: number;
}

export interface LlmEnrichment {
  summary: string;
  designPrinciples: string[];
  componentPatterns: string[];
  colorNarrative: string;
  suggestedTags: string[];
  layoutGuidance?: string[];
  motionGuidance?: string[];
  model: string;
  baseUrl: string;
  generatedAt: string;
}

export interface InspirationDiff {
  previousId: string;
  addedColors: string[];
  removedColors: string[];
  componentCountDelta: number;
  motionCountDelta: number;
}

export interface InspirationRecord {
  id: string;
  name: string;
  sourceType: SourceType;
  url?: string;
  originalImagePath?: string;
  screenshotPath?: string;
  capturedAt: string;
  tags: string[];
  notes?: string;
  inspirationSummary?: string;
  llmEnrichment?: LlmEnrichment;
  fingerprint: string;
  version: number;
  supersedes?: string;
  diffFromPrevious?: InspirationDiff;
  analysis: DesignAnalysis;
}

export interface OutcomeRecord {
  id: string;
  title: string;
  description: string;
  inspiredBy: string[];
  artifactUrl?: string;
  createdAt: string;
  tags: string[];
}

export interface ProjectRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  inspirations: InspirationRecord[];
  outcomes: OutcomeRecord[];
}

export interface DesignBrainDatabase {
  version: 1;
  createdAt: string;
  updatedAt: string;
  projects: ProjectRecord[];
}

export interface InitOptions {
  rootDir: string;
}

export interface IngestOptions {
  rootDir: string;
  project: string;
  projectName?: string;
  projectDescription?: string;
  url?: string;
  screenshot?: string;
  name?: string;
  notes?: string;
  inspirationSummary?: string;
  tags: string[];
  llm?: LlmConfig;
  journeySteps?: number;
  responsiveViewports?: Array<{ label: string; width: number; height: number }>;
  skipVisuals?: boolean;
  live?: boolean;
  headed?: boolean;
}

/* ─── Taste Profile types ─── */

export interface PersonaMatch {
  id: string;
  label: string;
  description: string;
  confidence: number;              // 0-1
}

export interface ScanScore {
  overall: number;                 // 0-100
  color: number;
  typography: number;
  spacing: number;
  motion: number;
}

export interface TasteColorPreference {
  palette: Array<{ hex: string; role: string; source: string }>;
  harmony: string;
  hueRange: { min: number; max: number };
  saturationBias: 'muted' | 'vibrant' | 'neutral';
  lightnessBias: 'light' | 'dark' | 'balanced';
}

export interface TasteTypographyPreference {
  primaryFont: string;
  secondaryFont: string | null;
  scaleType: string;
  sizes: string[];
  weightRange: { min: string; max: string };
}

export interface TasteSpacingPreference {
  baseUnit: number;
  scale: number[];
  gridAlignmentRatio: number;
}

export interface TasteMotionPreference {
  easing: string;
  durations: string[];
  intensity: 'none' | 'subtle' | 'moderate' | 'expressive';
}

export interface TasteComponentPreference {
  cherryPicks: ComponentCherryPick[];
  borderRadius: string;
  shadowStyle: 'none' | 'subtle' | 'elevated' | 'dramatic';
}

export interface ComponentCherryPick {
  componentKind: string;
  sourceInspirationId: string;
  sourceUrl: string;
  tokens: ComponentToken[];
  styles: Record<string, string>;
  note?: string;
}

export interface TasteDecision {
  id: string;
  question: string;
  answer: string;
  dimension: 'color' | 'typography' | 'spacing' | 'motion' | 'component' | 'layout' | 'general';
  decidedAt: string;
}

export interface TasteConflict {
  dimension: string;
  description: string;
  options: string[];
  resolved: boolean;
  resolvedByDecisionId?: string;
}

export interface TasteProfile {
  id: string;
  name: string;
  version: number;
  sourceInspirationIds: string[];
  sourceUrls: string[];
  persona: PersonaMatch;
  aggregateScore: ScanScore;
  color: TasteColorPreference;
  typography: TasteTypographyPreference;
  spacing: TasteSpacingPreference;
  motion: TasteMotionPreference;
  components: TasteComponentPreference;
  decisions: TasteDecision[];
  conflicts: TasteConflict[];
  narrative?: string;
  principles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TasteDiffResult {
  alignment: number;
  dimensions: {
    color: TasteDimensionDiff;
    typography: TasteDimensionDiff;
    spacing: TasteDimensionDiff;
    motion: TasteDimensionDiff;
  };
  deltas: TasteDelta[];
}

export interface TasteDimensionDiff {
  alignment: number;
  summary: string;
}

export interface TasteDelta {
  dimension: string;
  issue: string;
  suggestion: string;
  severity: 'info' | 'warning' | 'mismatch';
}

export interface OutcomeOptions {
  rootDir: string;
  project: string;
  title: string;
  description: string;
  inspiredBy: string[];
  artifactUrl?: string;
  tags: string[];
}
