export type Capture = {
  id: string;
  project: string;
  name: string;
  url?: string;
  screenshot?: string;
  tags: string[];
  date: string;
  tokens?: DesignTokens;
};

export type DesignTokens = {
  colors?: ColorToken[];
  typography?: TypographyToken[];
  components?: ComponentToken[];
  spacing?: string[];
};

export type ColorToken = {
  name: string;
  hex: string;
  usage?: string;
};

export type TypographyToken = {
  family: string;
  weight: string;
  size: string;
  usage?: string;
};

export type ComponentToken = {
  kind: string;
  count: number;
  variants?: string[];
};

export type GraphEntity = {
  id: string;
  type: string;
  label: string;
};

export type GraphRelation = {
  source: string;
  relation: string;
  target: string;
};

export type KnowledgeGraph = {
  entities: GraphEntity[];
  relations: GraphRelation[];
};

export type Note = {
  path: string;
  type?: string;
  title?: string;
  confidence?: string;
  tags?: string;
  preview: string;
};

export type ProjectStats = {
  captures: number;
  patterns: number;
  decisions: number;
  outcomes: number;
};
