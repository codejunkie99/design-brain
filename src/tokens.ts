import type { ComponentToken, ProjectRecord } from './types.js';

export interface TokenVariant {
  selector: string;
  tag: string;
  text: string;
  className: string;
  html: string;
  styles: Record<string, string>;
  sources: string[];
}

export interface ComponentTokenFile {
  kind: string;
  project: string;
  count: number;
  variants: TokenVariant[];
}

export function generateComponentTokens(
  project: ProjectRecord,
): Record<string, ComponentTokenFile> {
  const kindMap = new Map<string, Map<string, { component: ComponentToken; sources: Set<string> }>>();

  for (const inspiration of project.inspirations) {
    for (const component of inspiration.analysis.components) {
      let selectorMap = kindMap.get(component.kind);
      if (!selectorMap) {
        selectorMap = new Map();
        kindMap.set(component.kind, selectorMap);
      }

      const existing = selectorMap.get(component.selector);
      if (existing) {
        existing.sources.add(inspiration.id);
      } else {
        selectorMap.set(component.selector, {
          component,
          sources: new Set([inspiration.id]),
        });
      }
    }
  }

  const result: Record<string, ComponentTokenFile> = {};

  for (const [kind, selectorMap] of kindMap) {
    const variants: TokenVariant[] = [...selectorMap.values()]
      .sort((a, b) => b.sources.size - a.sources.size)
      .map(({ component, sources }) => ({
        selector: component.selector,
        tag: component.tag,
        text: component.text,
        className: component.className,
        html: component.html ?? '',
        styles: component.styles,
        sources: [...sources],
      }));

    result[kind] = {
      kind,
      project: project.id,
      count: variants.reduce((sum, v) => sum + v.sources.length, 0),
      variants,
    };
  }

  return result;
}
