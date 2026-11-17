import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const root = join(import.meta.dirname, '..', '..');
const read = (file: string) => readFileSync(join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };

describe('outillage', () => {
  test('C70 — npm run verify enchaîne lint, types, tests, build et e2e, dans cet ordre, en s’arrêtant au premier échec', () => {
    expect(pkg.scripts.verify).toBe(
      'npm run lint && npm run typecheck && npm run test && npm run build && npm run e2e',
    );
  });

  test('C69 — le build commence par la validation du contenu', () => {
    expect(pkg.scripts.build).toMatch(/^npm run check:content && /);
    expect(existsSync(join(root, 'scripts/check-content.ts'))).toBe(true);
  });

  test('C71 — la CI GitHub lance npm run verify sur chaque push et chaque pull request', () => {
    const path = '.github/workflows/ci.yml';
    expect(existsSync(join(root, path))).toBe(true);
    const workflow = parse(read(path)) as {
      on: Record<string, unknown>;
      jobs: Record<string, { steps: { run?: string }[] }>;
    };
    expect(Object.keys(workflow.on)).toEqual(expect.arrayContaining(['push', 'pull_request']));
    const runs = Object.values(workflow.jobs).flatMap((job) => job.steps.map((s) => s.run ?? ''));
    expect(runs).toContain('npm ci');
    expect(runs).toContain('npm run verify');
  });

  test('C04 — Vercel renvoie toutes les routes vers index.html (URL directes et rechargement)', () => {
    const config = JSON.parse(read('vercel.json')) as {
      rewrites: { source: string; destination: string }[];
    };
    expect(config.rewrites).toContainEqual({ source: '/(.*)', destination: '/index.html' });
  });
});
