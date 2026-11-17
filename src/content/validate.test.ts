import { checkContent, validateContent, type ContentError } from './validate';
import type { Content } from './schema';
import { makeConcept, makeContent, makeFamily, makeLink, makePrinciple, makeSector, makeTree } from '../../tests/fixtures/content';

const messages = (errors: ContentError[]) => errors.map((e) => `${e.file} ${e.path} ${e.message}`);

describe('validation croisée du contenu', () => {
  test('C69 — un contenu cohérent ne produit aucune erreur', () => {
    expect(validateContent(makeContent())).toEqual([]);
  });

  test('C69 — une erreur de schéma nomme le fichier et le champ fautifs', () => {
    const content = makeContent();
    content.concepts[2] = { ...content.concepts[2]!, problem: '' };
    const errors = validateContent(content);
    expect(errors).toContainEqual(
      expect.objectContaining({ file: 'src/content/concepts/cqrs.ts', path: 'problem' }),
    );
  });

  test('C69 — checkContent échoue avec un message lisible qui cite fichier et champ', () => {
    const content = makeContent();
    content.sectors[0] = { ...content.sectors[0]!, linkedinPost: '' };
    const result = checkContent(content);
    expect(result.ok).toBe(false);
    expect(result.message).toContain('src/content/sectors/banque.ts');
    expect(result.message).toContain('linkedinPost');
  });

  test('C69 — checkContent réussit sur un contenu valide', () => {
    expect(checkContent(makeContent()).ok).toBe(true);
  });
});

describe('C63 — fichiers propres à l’écosystème du langage', () => {
  test.each([
    ['java', 'pom.xml'],
    ['java', 'build.gradle.kts'],
    ['php', 'composer.json'],
    ['typescript', 'package.json'],
    ['go', 'go.mod'],
    ['csharp', 'App.csproj'],
    ['kotlin', 'build.gradle.kts'],
    ['swift', 'Package.swift'],
    ['python', 'pyproject.toml'],
  ] as const)('C63 — un secteur %s dont l’arborescence contient %s est accepté', (language, manifest) => {
    const content = makeContent();
    content.sectors[1] = makeSector({
      id: 'vitrine',
      stack: { language, framework: 'Framework', why: 'Raison.' },
      tree: makeTree(manifest),
    });
    expect(validateContent(content)).toEqual([]);
  });

  test('C63 — un secteur Java sans pom.xml ni build.gradle est refusé', () => {
    const content = makeContent();
    content.sectors[0] = { ...content.sectors[0]!, tree: makeTree('package.json') };
    expect(messages(validateContent(content)).join('\n')).toMatch(/banque\.ts tree .*pom\.xml/);
  });

  test('C63 — un manifeste rangé dans un sous-dossier compte aussi (monorepo)', () => {
    const content = makeContent();
    content.sectors[0] = {
      ...content.sectors[0]!,
      tree: [
        {
          name: 'compte-service',
          kind: 'dir',
          role: 'Service de gestion des comptes.',
          children: [{ name: 'pom.xml', kind: 'file', role: 'Build Maven du service.' }],
        },
      ],
    };
    expect(validateContent(content)).toEqual([]);
  });
});

describe('C65 — liens', () => {
  test('C65 — un lien vers un nœud inexistant est refusé', () => {
    const content = makeContent();
    content.links.push(makeLink('banque', 'inexistant'));
    expect(messages(validateContent(content)).join('\n')).toMatch(/links\.ts .*inexistant/);
  });

  test('C65 — un lien d’un nœud vers lui-même est refusé', () => {
    const content = makeContent();
    content.links.push(makeLink('cqrs', 'cqrs'));
    expect(validateContent(content)).not.toEqual([]);
  });

  test('C65 — deux liens entre les mêmes nœuds sont refusés, quel que soit le sens', () => {
    const content = makeContent();
    content.links.push(makeLink('event-sourcing', 'banque'));
    expect(validateContent(content)).not.toEqual([]);
  });

  test('C65 — deux liens avec le même identifiant sont refusés', () => {
    const content = makeContent();
    content.links.push(makeLink('ddd', 'couches', { id: 'banque--event-sourcing' }));
    expect(validateContent(content)).not.toEqual([]);
  });

  test('C65 — une architecture voisine sans lien correspondant est refusée', () => {
    const content = makeContent();
    content.concepts[1] = { ...content.concepts[1]!, neighbors: ['couches'] };
    expect(messages(validateContent(content)).join('\n')).toMatch(/concepts\/ddd\.ts neighbors/);
  });

  test('C65 — une architecture voisine doit être un concept existant', () => {
    const content = makeContent();
    content.concepts[2] = { ...content.concepts[2]!, neighbors: ['event-sourcing', 'fantome'] };
    expect(validateContent(content)).not.toEqual([]);
  });
});

describe('C66 — prérequis et suites', () => {
  test('C66 — un prérequis vers une fiche inexistante est refusé', () => {
    const content = makeContent();
    content.concepts[0] = {
      ...content.concepts[0]!,
      prerequisites: [{ id: 'fantome', reason: 'Raison.' }],
    };
    expect(messages(validateContent(content)).join('\n')).toMatch(/couches\.ts prerequisites/);
  });

  test('C66 — une suite vers une fiche inexistante est refusée', () => {
    const content = makeContent();
    content.concepts[0] = { ...content.concepts[0]!, nextSteps: [{ id: 'fantome', reason: 'Raison.' }] };
    expect(messages(validateContent(content)).join('\n')).toMatch(/couches\.ts nextSteps/);
  });

  test('C66 — un prérequis sans phrase d’explication est refusé', () => {
    const content = makeContent();
    content.concepts[1] = { ...content.concepts[1]!, prerequisites: [{ id: 'couches', reason: '' }] };
    expect(validateContent(content)).not.toEqual([]);
  });

  test('C66 — une fiche ne peut pas être son propre prérequis', () => {
    const content = makeContent();
    content.concepts[0] = { ...content.concepts[0]!, prerequisites: [{ id: 'couches', reason: 'R.' }] };
    expect(validateContent(content)).not.toEqual([]);
  });

  test('C66 — une boucle de prérequis est refusée et le message cite la boucle', () => {
    const content = makeContent();
    // couches → ddd → couches
    content.concepts[0] = { ...content.concepts[0]!, prerequisites: [{ id: 'ddd', reason: 'R.' }] };
    const text = messages(validateContent(content)).join('\n');
    expect(text).toMatch(/boucle/i);
    expect(text).toContain('couches');
    expect(text).toContain('ddd');
  });
});

describe('C67 — identifiants', () => {
  test.each(['CQRS', 'event sourcing', 'événement', 'a_b', '-cqrs', 'cqrs-', ''])(
    'C67 — l’identifiant « %s » est refusé',
    (id) => {
      const content = makeContent();
      content.concepts.push(makeConcept({ id }));
      expect(validateContent(content)).not.toEqual([]);
    },
  );

  test.each(['cqrs', 'event-sourcing', 'saas-b2b', 'web3'])('C67 — l’identifiant « %s » est accepté', (id) => {
    const content: Content = {
      concepts: [makeConcept({ id })],
      sectors: [],
      links: [],
      families: [makeFamily('famille', [id])],
      principles: [],
    };
    expect(validateContent(content)).toEqual([]);
  });

  test('C67 — deux fiches avec le même identifiant sont refusées, même entre concept et secteur', () => {
    const content = makeContent();
    content.sectors.push(makeSector({ id: 'cqrs' }));
    expect(validateContent(content)).not.toEqual([]);
  });

  test.each(['root', 'concepts', 'sectors'])(
    'C67 — l’identifiant réservé « %s » (nœud de structure de la carte) est refusé',
    (id) => {
      const content = makeContent();
      content.concepts.push(makeConcept({ id }));
      expect(validateContent(content)).not.toEqual([]);
    },
  );
});

describe('C77 — familles et principes', () => {
  test('C77 — un concept sans famille est refusé', () => {
    const content = makeContent();
    content.families[0] = { ...content.families[0]!, concepts: [] };
    expect(messages(validateContent(content)).join('\n')).toMatch(/families\.ts .*couches/);
  });

  test('C77 — un concept dans deux familles est refusé', () => {
    const content = makeContent();
    content.families[1] = { ...content.families[1]!, concepts: ['ddd', 'couches'] };
    expect(validateContent(content)).not.toEqual([]);
  });

  test('C77 — une famille qui cite un concept inexistant est refusée', () => {
    const content = makeContent();
    content.families[1] = { ...content.families[1]!, concepts: ['ddd', 'fantome'] };
    expect(messages(validateContent(content)).join('\n')).toMatch(/fantome/);
  });

  test('C77 — un principe appliqué par un seul concept n’est pas « partagé » : refusé', () => {
    const content = makeContent();
    content.principles[0] = makePrinciple('separation', ['couches']);
    expect(messages(validateContent(content)).join('\n')).toMatch(/principles\.ts .*separation/);
  });

  test('C77 — un principe qui cite un concept inexistant est refusé', () => {
    const content = makeContent();
    content.principles[0] = makePrinciple('separation', ['couches', 'fantome']);
    expect(validateContent(content)).not.toEqual([]);
  });

  test('C77 — une application sans phrase « comment » est refusée', () => {
    const content = makeContent();
    const p = content.principles[0]!;
    content.principles[0] = { ...p, applications: [{ concept: 'couches', how: '' }, p.applications[1]!] };
    expect(validateContent(content)).not.toEqual([]);
  });

  test('C77 — une couleur de principe invalide est refusée', () => {
    const content = makeContent();
    content.principles[0] = { ...content.principles[0]!, color: 'bleu' };
    expect(validateContent(content)).not.toEqual([]);
  });

  test('C77 — un identifiant de principe ou de famille identique à une fiche est refusé', () => {
    const content = makeContent();
    content.principles[0] = makePrinciple('cqrs', ['couches', 'ddd']);
    expect(validateContent(content)).not.toEqual([]);
    const other = makeContent();
    other.families[0] = makeFamily('banque', ['couches']);
    expect(validateContent(other)).not.toEqual([]);
  });
});
