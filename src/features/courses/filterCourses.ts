import type { Sheet, TreeNode } from '../../content/schema';

export type CourseFilter = { query: string; status: 'all' | 'unread' | 'read' };

/** Minuscules, sans accents : « Événement » → « evenement ». */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const treeText = (nodes: TreeNode[]): string[] =>
  nodes.flatMap((n) => [n.name, n.role, ...treeText(n.children ?? [])]);

/** Texte sur lequel porte la recherche : titre, idée et contenu de la fiche (hors quiz, prérequis et post). */
function searchableText(sheet: Sheet): string {
  const common = [sheet.title, sheet.summary, ...sheet.pitfalls, ...treeText(sheet.tree)];
  const specific =
    sheet.kind === 'concept'
      ? [sheet.problem, ...sheet.whenToUse, ...sheet.whenToAvoid, sheet.teamSize]
      : [
          sheet.context,
          ...sheet.constraints,
          ...Object.values(sheet.bySize).flatMap((r) => [r.architecture, r.why]),
          sheet.stack.language,
          sheet.stack.framework,
          sheet.stack.why,
          ...sheet.companies.flatMap((c) => [c.name, c.fact]),
        ];
  return normalize([...common, ...specific].join(' '));
}

export function filterCourses<S extends Sheet>(sheets: S[], filter: CourseFilter, read: ReadonlySet<string>): S[] {
  const words = normalize(filter.query).split(/\s+/).filter(Boolean);
  return sheets.filter((sheet) => {
    if (filter.status === 'read' && !read.has(sheet.id)) return false;
    if (filter.status === 'unread' && read.has(sheet.id)) return false;
    if (words.length === 0) return true;
    const haystack = searchableText(sheet);
    return words.every((w) => haystack.includes(w));
  });
}
