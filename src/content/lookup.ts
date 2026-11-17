import { content } from './index';
import type { Family, Link, Principle, Sheet } from './schema';

export const allSheets: Sheet[] = [...content.concepts, ...content.sectors];
const sheetsById = new Map(allSheets.map((s) => [s.id, s]));
const linksById = new Map(content.links.map((l) => [l.id, l]));

export const getSheet = (id: string | undefined): Sheet | undefined => (id ? sheetsById.get(id) : undefined);
export const getLink = (id: string | undefined): Link | undefined => (id ? linksById.get(id) : undefined);

const principlesById = new Map(content.principles.map((p) => [p.id, p]));
export const getPrinciple = (id: string | undefined): Principle | undefined => (id ? principlesById.get(id) : undefined);

/** Principes appliqués par un concept, dans l'ordre de principles.ts. */
export const principlesOf = (conceptId: string): Principle[] =>
  content.principles.filter((p) => p.applications.some((a) => a.concept === conceptId));

export const familyOf = (conceptId: string): Family | undefined =>
  content.families.find((f) => f.concepts.includes(conceptId));
