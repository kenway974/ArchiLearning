import { content } from './index';
import type { Link, Sheet } from './schema';

export const allSheets: Sheet[] = [...content.concepts, ...content.sectors];
const sheetsById = new Map(allSheets.map((s) => [s.id, s]));
const linksById = new Map(content.links.map((l) => [l.id, l]));

export const getSheet = (id: string | undefined): Sheet | undefined => (id ? sheetsById.get(id) : undefined);
export const getLink = (id: string | undefined): Link | undefined => (id ? linksById.get(id) : undefined);
