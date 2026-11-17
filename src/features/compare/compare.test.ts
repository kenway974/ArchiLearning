import { compareSheets, findLink } from './compare';
import { makeContent } from '../../../tests/fixtures/content';

const content = makeContent();
const sheet = (id: string) => [...content.concepts, ...content.sectors].find((s) => s.id === id)!;

describe('critères du comparateur', () => {
  test('C54 — deux concepts : idée, problème, quand utiliser, quand éviter, taille d’équipe, pièges', () => {
    const result = compareSheets(sheet('cqrs'), sheet('event-sourcing'));
    if (!result.ok) throw new Error('comparaison refusée');
    expect(result.rows.map((r) => r.criterion)).toEqual([
      'Idée',
      'Problème résolu',
      'Quand l’utiliser',
      'Quand l’éviter',
      'Taille d’équipe et d’entreprise',
      'Pièges',
    ]);
    expect(result.rows[0]).toEqual({
      criterion: 'Idée',
      left: 'Séparer les écritures des lectures.',
      right: 'Stocker les événements plutôt que l’état courant.',
    });
  });

  test('C54 — deux secteurs : contraintes, architecture par taille, langage et framework, pièges', () => {
    const result = compareSheets(sheet('banque'), sheet('vitrine'));
    if (!result.ok) throw new Error('comparaison refusée');
    expect(result.rows.map((r) => r.criterion)).toEqual([
      'Contraintes',
      'Petite entreprise',
      'Entreprise moyenne',
      'Grande entreprise',
      'Langage et framework',
      'Pièges',
    ]);
    expect(result.rows.find((r) => r.criterion === 'Langage et framework')?.left).toContain('Spring Boot');
  });

  test('C54 — un concept et un secteur ne se comparent pas', () => {
    expect(compareSheets(sheet('cqrs'), sheet('banque'))).toEqual({ ok: false, reason: 'mixed-kinds' });
  });

  test('C54 — une fiche ne se compare pas à elle-même', () => {
    expect(compareSheets(sheet('cqrs'), sheet('cqrs'))).toEqual({ ok: false, reason: 'same-sheet' });
  });
});

describe('lien entre les deux éléments comparés', () => {
  test('C55 — le lien est trouvé dans les deux sens', () => {
    expect(findLink(content.links, 'cqrs', 'event-sourcing')?.id).toBe('cqrs--event-sourcing');
    expect(findLink(content.links, 'event-sourcing', 'cqrs')?.id).toBe('cqrs--event-sourcing');
  });

  test('C55 — pas de lien → undefined', () => {
    expect(findLink(content.links, 'cqrs', 'couches')).toBeUndefined();
  });
});
