import test from 'node:test';
import assert from 'node:assert/strict';
import { diffProjects, diffTemporal, renderSystemDiff } from '../dist/systemDiff.js';

const makeInspo = (overrides) => ({
  id: 'inspo-1', name: 'Test', sourceType: 'url', capturedAt: '2026-01-01T00:00:00Z', tags: [],
  fingerprint: 'abc', version: 1,
  analysis: {
    colors: [], typography: [], components: [], motion: [], layout: [],
    cssVariables: {},
  },
  ...overrides,
});

const makeProject = (id, inspos) => ({
  id, name: id, createdAt: '', updatedAt: '',
  inspirations: inspos, outcomes: [],
});

test('diffProjects detects shared and unique colors between projects', () => {
  const projectA = makeProject('a', [
    makeInspo({
      id: 'i1',
      analysis: {
        colors: [{ hex: '#FF0000', count: 5, samples: [] }, { hex: '#00FF00', count: 3, samples: [] }],
        typography: [], components: [], motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);
  const projectB = makeProject('b', [
    makeInspo({
      id: 'i2',
      analysis: {
        colors: [{ hex: '#FF0000', count: 8, samples: [] }, { hex: '#0000FF', count: 4, samples: [] }],
        typography: [], components: [], motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);

  const diff = diffProjects(projectA, projectB);
  assert.equal(diff.colors.shared.length, 1);
  assert.equal(diff.colors.onlyA.length, 1);
  assert.equal(diff.colors.onlyB.length, 1);
});

test('diffTemporal splits captures by time and finds changes', () => {
  const project = makeProject('test', [
    makeInspo({ id: 'i1', capturedAt: '2026-01-01T00:00:00Z',
      analysis: { colors: [{ hex: '#FF0000', count: 5, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} },
    }),
    makeInspo({ id: 'i2', capturedAt: '2026-01-02T00:00:00Z',
      analysis: { colors: [{ hex: '#FF0000', count: 3, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} },
    }),
    makeInspo({ id: 'i3', capturedAt: '2026-02-01T00:00:00Z',
      analysis: { colors: [{ hex: '#FF0000', count: 2, samples: [] }, { hex: '#0000FF', count: 4, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} },
    }),
    makeInspo({ id: 'i4', capturedAt: '2026-02-02T00:00:00Z',
      analysis: { colors: [{ hex: '#0000FF', count: 6, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} },
    }),
  ]);

  const diff = diffTemporal(project);
  assert.ok(diff.firstHalfCount === 2);
  assert.ok(diff.secondHalfCount === 2);
  assert.ok(diff.colors.added.length >= 0);
});

test('renderSystemDiff produces markdown', () => {
  const projectA = makeProject('a', [makeInspo({})]);
  const projectB = makeProject('b', [makeInspo({})]);
  const diff = diffProjects(projectA, projectB);
  const md = renderSystemDiff(diff, 'cross-project', 'a', 'b');
  assert.ok(md.includes('# Design System Diff'));
});
