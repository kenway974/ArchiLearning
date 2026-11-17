# Guide de relecture des tests

Chaque test porte le numéro du comportement qu'il vérifie (voir `COMPORTEMENTS.md`). Les 71 comportements, de C01 à C71, ont au moins un test.

## Où trouver quoi

| Comportements | Fichier | Outil |
|---|---|---|
| C62–C64 (schéma des fiches et des quiz) | `src/content/schema.test.ts` | Vitest |
| C63, C65–C67, C69 (règles croisées, messages d'erreur) | `src/content/validate.test.ts` | Vitest |
| C65, C67–C69 (contenu réel de la V1) | `src/content/content.test.ts` | Vitest |
| C14, C15, C17, C26 (graphe, voisinage, fil d'Ariane) | `src/content/graph.test.ts` | Vitest |
| C16 (disposition de la carte) | `src/features/mindmap/layout.test.ts` | Vitest |
| C08, C09 (recherche et filtre) | `src/features/courses/filterCourses.test.ts` | Vitest |
| C38, C41, C44 (calcul du parcours) | `src/features/path/buildPath.test.ts` | Vitest |
| C11, C13, C40, C44, C46, C52, C58 (état de progression) | `src/features/progress/progress.test.ts` | Vitest |
| C48, C49 (localStorage) | `src/features/progress/storage.test.ts` | Vitest |
| C51 (score) | `src/features/quiz/quiz.test.ts` | Vitest |
| C54, C55 (comparateur) | `src/features/compare/compare.test.ts` | Vitest |
| C04, C69–C71 (Vercel, build, verify, CI) | `tests/tooling/tooling.test.ts` | Vitest |
| C01–C06 | `tests/e2e/navigation.spec.ts` | Playwright |
| C07–C10 | `tests/e2e/courses.spec.ts` | Playwright |
| C11–C13 | `tests/e2e/progress-page.spec.ts` | Playwright |
| C18–C23 | `tests/e2e/mindmap-desktop.spec.ts` | Playwright, ordinateur |
| C24–C29 | `tests/e2e/mindmap-mobile.spec.ts` | Playwright, mobile |
| C30–C37 | `tests/e2e/sheet.spec.ts` | Playwright |
| C39–C45 | `tests/e2e/path.spec.ts` | Playwright |
| C46–C49 | `tests/e2e/progress.spec.ts` | Playwright |
| C50–C52 | `tests/e2e/quiz.spec.ts` | Playwright |
| C53–C57 | `tests/e2e/compare.spec.ts` | Playwright |
| C58–C61 | `tests/e2e/a11y.spec.ts` | Playwright + axe-core |

Les tests Playwright tournent sur deux projets : `ordinateur` (1280×800) et `mobile` (390×844, tactile). Un test propre à un seul format est ignoré sur l'autre.

## Choix à valider

1. **Modèle de contenu** : `tests/fixtures/content.ts` décrit la forme d'une fiche. Le futur `schema.ts` devra la respecter. Chaque fiche a des `prerequisites` et des `nextSteps` sous la forme `{ id, reason }`. Chaque élément de l'arborescence a un `role` obligatoire, dossiers et fichiers imbriqués compris. Une entreprise citée a obligatoirement une `source` (URL).
2. **Fichier de manifeste obligatoire selon le langage** (C63) : `pom.xml` ou `build.gradle(.kts)` pour Java, `composer.json` pour PHP, `package.json` pour TypeScript, `go.mod` pour Go, `*.csproj` pour C#, `build.gradle(.kts)` pour Kotlin, `Package.swift` pour Swift, `pyproject.toml` pour Python.
3. **Identifiants des fiches** (C68) : `transaction-script`, `architecture-en-couches`, `mvc`, `hexagonale`, `clean-onion`, `ddd`, `cqrs`, `event-sourcing`, `vertical-slice`, `monolithe`, `monolithe-modulaire`, `microservices`, `architecture-evenementielle`, `serverless`, `microkernel`, `pipes-and-filters` ; secteurs `site-vitrine`, `e-commerce`, `saas-b2b`, `banque-fintech`. Ils servent dans les URL.
4. **Disposition de la carte** (C16) : racine au centre, concepts à gauche, secteurs à droite.
5. **Recherche** (C08) : elle porte sur le titre, l'idée et le contenu de la fiche. Les prérequis, le quiz et le post LinkedIn ne sont pas pris en compte. Tous les mots tapés doivent être présents.
6. **Phrase « Suivant »** (C41) : c'est la raison du prérequis qui relie l'étape suivante à l'étape courante. À défaut, c'est celle de la fiche du parcours qui a besoin de l'étape suivante.
7. **Fin de parcours** (C44) : le parcours en cours est clos quand la fiche cible est lue.
8. **Réinitialisation** (C13) : elle efface fiches lues, scores et parcours, mais garde le thème choisi.
9. **Meilleur score** (C52) : si le nombre de questions a changé, on compare les proportions.
10. **localStorage inaccessible** (C49) : la progression est gardée en mémoire pendant la visite.
11. **Contrat DOM** : les tests ciblent d'abord les rôles et les noms accessibles (ce que lit un lecteur d'écran). Pour la carte, ils utilisent quelques attributs `data-*` décrits en tête de `tests/e2e/helpers.ts`.

## État actuel

Aucun code applicatif n'existe encore : tous les tests échouent, et c'est voulu. Les modules testés n'existent pas encore (`Failed to load url ./schema`, `Cannot find module src/content/index`). Seul le test C70 passe déjà, parce que le script `verify` fait partie de l'outillage posé pour pouvoir lancer les tests.
