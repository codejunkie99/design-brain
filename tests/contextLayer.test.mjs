import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDesignContext, generateUnifiedContext } from '../dist/contextLayer.js';

const makeProject = (overrides) => ({
  id: 'proj-1',
  name: 'Test Project',
  description: 'A test project for design brain',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-15T00:00:00Z',
  inspirations: [],
  outcomes: [],
  ...overrides,
});

const makeInspo = (overrides) => ({
  id: 'inspo-1',
  name: 'Test Inspo',
  sourceType: 'url',
  url: 'https://example.com',
  capturedAt: '2026-01-10T00:00:00Z',
  tags: [],
  fingerprint: 'abc',
  version: 1,
  analysis: {
    colors: [],
    typography: [],
    components: [],
    motion: [],
    layout: [],
    cssVariables: {},
  },
  ...overrides,
});

test('generateDesignContext includes color palette with names', () => {
  const project = makeProject({
    inspirations: [
      makeInspo({
        analysis: {
          colors: [
            { hex: '#FF0000', count: 5, samples: ['.hero'] },
            { hex: '#0000FF', count: 3, samples: ['.link'] },
          ],
          typography: [],
          components: [],
          motion: [],
          layout: [],
          cssVariables: {},
        },
      }),
    ],
  });

  const ctx = generateDesignContext(project);
  assert.ok(ctx.includes('## Color Palette'));
  assert.ok(ctx.includes('#FF0000'));
  assert.ok(ctx.includes('#0000FF'));
  assert.ok(ctx.includes('Do not invent colors'));
});

test('generateDesignContext includes typography scale', () => {
  const project = makeProject({
    inspirations: [
      makeInspo({
        analysis: {
          colors: [],
          typography: [
            { fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '1.5', letterSpacing: '0', selector: 'body', count: 10 },
            { fontFamily: 'Inter', fontSize: '32px', fontWeight: '700', lineHeight: '1.2', letterSpacing: '0', selector: 'h1', count: 2 },
          ],
          components: [],
          motion: [],
          layout: [],
          cssVariables: {},
        },
      }),
    ],
  });

  const ctx = generateDesignContext(project);
  assert.ok(ctx.includes('## Typography'));
  assert.ok(ctx.includes('Inter'));
  assert.ok(ctx.includes('16px'));
  assert.ok(ctx.includes('32px'));
});

test('generateDesignContext includes component inventory', () => {
  const project = makeProject({
    inspirations: [
      makeInspo({
        analysis: {
          colors: [],
          typography: [],
          components: [
            { kind: 'button', tag: 'button', selector: '.btn-primary', text: 'Get started', className: 'btn-primary', styles: {} },
            { kind: 'heading', tag: 'h1', selector: 'h1', text: 'Welcome to our platform', className: '', styles: {} },
          ],
          motion: [],
          layout: [],
          cssVariables: {},
        },
      }),
    ],
  });

  const ctx = generateDesignContext(project);
  assert.ok(ctx.includes('## Components'));
  assert.ok(ctx.includes('button'));
  assert.ok(ctx.includes('.btn-primary'));
  assert.ok(ctx.includes('Get started'));
});

test('generateDesignContext includes writing style', () => {
  const project = makeProject({
    inspirations: [
      makeInspo({
        analysis: {
          colors: [],
          typography: [],
          components: [
            { kind: 'heading', tag: 'h1', selector: 'h1', text: 'Build something amazing', className: '', styles: {} },
            { kind: 'button', tag: 'button', selector: '.cta', text: 'Start free trial', className: '', styles: {} },
            { kind: 'text', tag: 'p', selector: 'p', text: "You'll love how easy it is to get started with our amazing tools.", className: '', styles: {} },
          ],
          motion: [],
          layout: [],
          cssVariables: {},
        },
      }),
    ],
  });

  const ctx = generateDesignContext(project);
  assert.ok(ctx.includes('## Writing Style'));
  assert.ok(ctx.includes('CTA patterns'));
  assert.ok(ctx.includes('Start free trial'));
});

test('generateDesignContext includes CSS variables', () => {
  const project = makeProject({
    inspirations: [
      makeInspo({
        analysis: {
          colors: [{ hex: '#533AFD', count: 2, samples: ['.btn'] }],
          typography: [],
          components: [],
          motion: [],
          layout: [],
          cssVariables: {
            '--color-primary': '#533AFD',
            '--spacing-md': '16px',
            '--border-radius': '8px',
          },
        },
      }),
    ],
  });

  const ctx = generateDesignContext(project);
  // --color-primary appears in the CSS Variables (colors) subsection
  assert.ok(ctx.includes('--color-primary'));
  // non-color vars appear in the CSS Variables section
  assert.ok(ctx.includes('--spacing-md'));
  assert.ok(ctx.includes('--border-radius'));
});

test('generateDesignContext handles empty project', () => {
  const project = makeProject({});
  const ctx = generateDesignContext(project);
  assert.ok(ctx.includes('# Design Context'));
  assert.ok(!ctx.includes('## Color Palette'));
  assert.ok(!ctx.includes('## Typography'));
});

test('generateUnifiedContext summarizes multiple projects', () => {
  const projects = [
    makeProject({
      id: 'site-a',
      name: 'Site A',
      inspirations: [
        makeInspo({
          analysis: {
            colors: [{ hex: '#FF0000', count: 3, samples: ['.hero'] }],
            typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '1.5', letterSpacing: '0', selector: 'body', count: 1 }],
            components: [{ kind: 'button', tag: 'button', selector: '.btn', text: 'Click', className: '', styles: {} }],
            motion: [],
            layout: [],
            cssVariables: {},
          },
        }),
      ],
    }),
    makeProject({
      id: 'site-b',
      name: 'Site B',
      inspirations: [
        makeInspo({
          analysis: {
            colors: [{ hex: '#0000FF', count: 2, samples: ['.link'] }],
            typography: [],
            components: [],
            motion: [],
            layout: [],
            cssVariables: {},
          },
        }),
      ],
    }),
  ];

  const ctx = generateUnifiedContext(projects);
  assert.ok(ctx.includes('# Design Brain — Unified Context'));
  assert.ok(ctx.includes('## Site A'));
  assert.ok(ctx.includes('## Site B'));
  assert.ok(ctx.includes('#FF0000'));
  assert.ok(ctx.includes('#0000FF'));
  assert.ok(ctx.includes('Inter'));
});

test('generateDesignContext lists source captures', () => {
  const project = makeProject({
    inspirations: [
      makeInspo({ name: 'Stripe Homepage', url: 'https://stripe.com' }),
      makeInspo({ id: 'inspo-2', name: 'Linear App', url: 'https://linear.app' }),
    ],
  });

  const ctx = generateDesignContext(project);
  assert.ok(ctx.includes('## Sources'));
  assert.ok(ctx.includes('Stripe Homepage'));
  assert.ok(ctx.includes('https://stripe.com'));
  assert.ok(ctx.includes('Linear App'));
});
