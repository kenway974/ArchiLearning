import { tokenize } from './highlight';

describe('coloration syntaxique', () => {
  test('C34 — reconstitue exactement le code source', () => {
    const source = `// commentaire\nconst x = "texte"; // fin\nreturn 42;`;
    expect(tokenize(source, 'typescript').map((t) => t.text).join('')).toBe(source);
  });

  test('C34 — repère commentaires, chaînes, nombres et mots-clés', () => {
    const types = tokenize('// c\nconst x = "a" + 1;', 'typescript').map((t) => `${t.type}:${t.text}`);
    expect(types).toEqual(expect.arrayContaining(['comment:// c', 'keyword:const', 'string:"a"', 'number:1']));
  });

  test('C34 — les attributs PHP #[...] et annotations Java @... ne sont pas des commentaires', () => {
    expect(tokenize("#[Route('/a')]", 'php')[0]).toEqual({ type: 'annotation', text: '#[Route' });
    expect(tokenize('@Service', 'java')[0]).toEqual({ type: 'annotation', text: '@Service' });
  });
});
