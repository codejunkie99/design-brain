import type { PersonaMatch, ScanScore } from './types.js';

interface PersonaDefinition {
  id: string;
  label: string;
  description: string;
  match: (score: ScanScore) => number;
}

const PERSONAS: PersonaDefinition[] = [
  {
    id: 'jony-ive',
    label: 'Jony Ive',
    description: '"Less, but better" — refined minimalism with premium polish',
    match: (s) => {
      let c = 0;
      if (s.color >= 70) c += 0.3;
      if (s.spacing >= 80) c += 0.3;
      if (s.typography >= 70) c += 0.2;
      if (s.motion >= 50 && s.motion <= 80) c += 0.2;
      return c;
    },
  },
  {
    id: 'dieter-rams',
    label: 'Dieter Rams',
    description: '"Good design is as little design as possible" — systematic clarity',
    match: (s) => {
      let c = 0;
      if (s.spacing >= 85) c += 0.35;
      if (s.typography >= 75) c += 0.3;
      if (s.color >= 60 && s.color <= 85) c += 0.2;
      if (s.motion <= 50) c += 0.15;
      return c;
    },
  },
  {
    id: 'massimo-vignelli',
    label: 'Massimo Vignelli',
    description: '"Design is one" — typographic discipline and grid mastery',
    match: (s) => {
      let c = 0;
      if (s.typography >= 85) c += 0.4;
      if (s.spacing >= 80) c += 0.3;
      if (s.color >= 50 && s.color <= 75) c += 0.15;
      if (s.motion <= 40) c += 0.15;
      return c;
    },
  },
  {
    id: 'paula-scher',
    label: 'Paula Scher',
    description: '"Make it bigger" — bold expression with systematic structure',
    match: (s) => {
      let c = 0;
      if (s.color >= 80) c += 0.35;
      if (s.typography >= 60) c += 0.2;
      if (s.motion >= 60) c += 0.25;
      if (s.spacing >= 50) c += 0.2;
      return c;
    },
  },
  {
    id: 'mike-monteiro',
    label: 'Mike Monteiro',
    description: '"Design is a job" — pragmatic, accessible, no-nonsense craft',
    match: (s) => {
      let c = 0;
      if (s.overall >= 50 && s.overall <= 75) c += 0.3;
      if (s.spacing >= 60) c += 0.25;
      if (s.typography >= 55) c += 0.25;
      if (s.color >= 40) c += 0.2;
      return c;
    },
  },
];

export function assignPersona(score: ScanScore): PersonaMatch {
  let best: { persona: PersonaDefinition; confidence: number } = {
    persona: PERSONAS[PERSONAS.length - 1],
    confidence: 0,
  };

  for (const persona of PERSONAS) {
    const confidence = persona.match(score);
    if (confidence > best.confidence) {
      best = { persona, confidence };
    }
  }

  return {
    id: best.persona.id,
    label: best.persona.label,
    description: best.persona.description,
    confidence: Math.min(1, Math.round(best.confidence * 100) / 100),
  };
}
