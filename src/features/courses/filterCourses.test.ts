import { filterCourses } from './filterCourses';
import { makeContent } from '../../../tests/fixtures/content';

const content = makeContent();
const sheets = [...content.concepts, ...content.sectors];
const ids = (xs: { id: string }[]) => xs.map((x) => x.id).sort();
const none = new Set<string>();

describe('recherche dans la liste des cours', () => {
  test('C08 — une recherche vide renvoie tous les cours', () => {
    expect(filterCourses(sheets, { query: '', status: 'all' }, none)).toHaveLength(sheets.length);
  });

  test('C08 — la recherche porte sur le titre', () => {
    expect(ids(filterCourses(sheets, { query: 'cqrs', status: 'all' }, none))).toEqual(['cqrs']);
  });

  test('C08 — la recherche porte sur l’idée en une phrase', () => {
    expect(ids(filterCourses(sheets, { query: 'lectures', status: 'all' }, none))).toEqual(['cqrs']);
  });

  test('C08 — la recherche porte sur le contenu de la fiche (ex. le framework)', () => {
    expect(ids(filterCourses(sheets, { query: 'spring', status: 'all' }, none))).toEqual(['banque']);
  });

  test('C08 — la recherche ignore majuscules et accents', () => {
    expect(ids(filterCourses(sheets, { query: 'EVENEMENTS', status: 'all' }, none))).toEqual(['event-sourcing']);
    expect(ids(filterCourses(sheets, { query: 'présentation', status: 'all' }, none))).toEqual(['vitrine']);
    expect(ids(filterCourses(sheets, { query: 'presentation', status: 'all' }, none))).toEqual(['vitrine']);
  });

  test('C08 — les espaces en trop sont ignorés et tous les mots doivent être présents', () => {
    expect(ids(filterCourses(sheets, { query: '  event   sourcing ', status: 'all' }, none))).toEqual(['event-sourcing']);
    expect(filterCourses(sheets, { query: 'event banane', status: 'all' }, none)).toEqual([]);
  });

  test('C08 — aucune correspondance → liste vide', () => {
    expect(filterCourses(sheets, { query: 'kubernetes-quantique', status: 'all' }, none)).toEqual([]);
  });

  test('C08 — l’ordre d’origine est conservé', () => {
    expect(filterCourses(sheets, { query: '', status: 'all' }, none).map((s) => s.id)).toEqual(sheets.map((s) => s.id));
  });
});

describe('filtre lu / non lu', () => {
  const read = new Set(['cqrs', 'banque']);

  test('C09 — « Lus » ne garde que les fiches lues', () => {
    expect(ids(filterCourses(sheets, { query: '', status: 'read' }, read))).toEqual(['banque', 'cqrs']);
  });

  test('C09 — « Non lus » ne garde que les fiches non lues', () => {
    expect(ids(filterCourses(sheets, { query: '', status: 'unread' }, read))).toEqual([
      'couches',
      'ddd',
      'event-sourcing',
      'vitrine',
    ]);
  });

  test('C09 — le filtre se combine avec la recherche', () => {
    expect(ids(filterCourses(sheets, { query: 'event', status: 'unread' }, read))).toEqual(['event-sourcing']);
    expect(filterCourses(sheets, { query: 'event', status: 'read' }, read)).toEqual([]);
  });
});
