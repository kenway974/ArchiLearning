# Archi Map

Application web pour apprendre quelles architectures logicielles et quelles organisations de code sont privilégiées selon le secteur, le type de logiciel et la taille de l’entreprise, et pourquoi.

- **Mindmap** : au centre « Architectures logicielles », deux branches « Concepts » et « Secteurs », un nœud par fiche et des liens transverses cliquables (ex. Banque → Event Sourcing).
- **Fiches** : idée, problème résolu, quand l’utiliser ou l’éviter, taille d’équipe, arborescence cliquable, code commenté, pièges, quiz, idée de post LinkedIn.
- **Parcours par sujet** : on choisit un sujet ; s’il demande des bases, la fiche propose de commencer par elles, dans le bon ordre.
- **Progression** (fiches lues, scores, parcours en cours) gardée dans le navigateur, **comparateur**, **thème clair/sombre**, mobile avec mode focus.

Le comportement attendu est décrit, numéroté (C01 à C71), dans [`COMPORTEMENTS.md`](COMPORTEMENTS.md). Chaque numéro se retrouve dans le nom des tests et dans les messages de commit.

## Démarrer

```bash
npm ci
npm run dev        # http://localhost:5173
npm run verify     # lint + types + tests unitaires + build + tests de bout en bout
```

Node 22 (voir `.nvmrc`). Les tests de bout en bout utilisent Chromium via Playwright (`npx playwright install chromium` la première fois).

| Script | Rôle |
|---|---|
| `npm run check:content` | Valide toutes les fiches et tous les liens (schéma Zod + règles croisées). Lancé avant chaque build : le build échoue si une fiche est incomplète ou si un lien pointe vers un nœud inexistant. |
| `npm run test` | Vitest : logique pure et validation du contenu. |
| `npm run e2e` | Playwright, sur ordinateur (1280×800) et mobile (390×844). |
| `npm run verify` | Tout, dans l’ordre ; s’arrête au premier échec. Lancé par la CI GitHub sur chaque push et pull request. |

Hébergement : Vercel (site statique ; `vercel.json` renvoie toutes les routes vers `index.html` pour que les URL des fiches soient partageables).

## Organisation du code

Rangement **par fonctionnalité**, contenu séparé de l’interface :

```
src/
  content/            Le contenu, sous forme de données typées
    schema.ts         Schémas Zod : forme d’une fiche concept, secteur, d’un quiz, d’un lien
    validate.ts       Règles croisées (liens existants, prérequis sans boucle, manifeste du langage…)
    concepts/         Une fiche par fichier (cqrs.ts, ddd.ts…)
    sectors/          Une fiche secteur par fichier
    links.ts          Liens transverses et leur explication
    graph.ts          Graphe de la mindmap, dérivé des fiches (rien n’est saisi deux fois)
  features/
    mindmap/          Carte React Flow, disposition, mode focus mobile, panneaux
    sheet/            Affichage d’une fiche : arborescence, code coloré, parcours
    quiz/             Quiz et calcul du score
    progress/         État de progression, stockage localStorage, page « Ma progression »
    courses/          Liste des cours, recherche et filtre
    compare/          Comparateur
    path/             Calcul du parcours d’un sujet
  shared/             Composants génériques (icônes, bouton copier, media queries)
  app/                Point d’entrée, routes, mise en page, accueil
tests/
  e2e/                Tests Playwright
  fixtures/           Contenu de test
  tooling/            Vérification de la CI, du build et de la config Vercel
```

Toute la logique (parcours, étape suivante, progression, score, graphe, disposition, recherche, comparateur) est faite de **fonctions pures**, testées sans navigateur. Les composants React se contentent de les appeler.

### Ajouter une fiche

1. Créer `src/content/concepts/<id>.ts` (ou `sectors/`), typé `ConceptSheet` ou `SectorSheet`.
2. L’ajouter dans `concepts/index.ts` (ou `sectors/index.ts`).
3. Ajouter ses liens dans `links.ts`.
4. `npm run check:content` dit précisément quel fichier et quel champ corriger.

## Pourquoi pas d’architecture hexagonale ici ?

C’est un choix assumé. L’hexagonale (ports et adaptateurs) protège un **métier** de la **technique** qui l’entoure : base de données, fournisseurs, API externes. On définit des ports pour pouvoir changer d’adaptateur ou le simuler en test.

Archi Map n’a :

- **pas de base de données** : le contenu est compilé dans le site ;
- **pas de fournisseur externe** : aucun appel réseau ;
- **pas de règles métier à protéger** au sens de l’hexagonale : la logique (parcours, score) est déjà faite de fonctions pures, testables sans rien simuler.

Ajouter des ports ici créerait des interfaces sans seconde implémentation, des fichiers en plus et aucune protection réelle. Le découpage par fonctionnalité et la séparation contenu / interface suffisent.

### Évolution prévue

Si des comptes utilisateurs ou une administration du contenu arrivent, la progression ne vivra plus seulement dans le navigateur. On introduira alors un port à ce moment-là, par exemple :

```ts
interface ProgressRepository {
  load(): Promise<Progress>;
  save(progress: Progress): Promise<void>;
}
```

avec un adaptateur `LocalStorageProgressRepository` (le comportement actuel) et un adaptateur `ApiProgressRepository`. Le code est prêt pour ce changement : la lecture et l’écriture sont déjà isolées dans `src/features/progress/storage.ts`.
