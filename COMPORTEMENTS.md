# Archi Map — comportements attendus (V1)

Chaque comportement porte un numéro (Cxx). Ce numéro apparaît dans le nom du test qui le vérifie et dans le message du commit qui l'implémente.

Type de test : **U** = Vitest (logique pure ou contenu), **E** = Playwright, lancé sur ordinateur (1280×800) et mobile (390×844) sauf mention contraire.

---

## A. Accueil et navigation générale

| N° | Comportement | Test |
|---|---|---|
| C01 | L'accueil affiche le titre « Archi Map », une phrase d'accroche, un bouton « Voir la mindmap » et un bouton « Commencer le parcours ». | E |
| C02 | « Voir la mindmap » ouvre la carte entière (ordinateur) ou centrée sur la racine (mobile). | E |
| C03 | « Commencer le parcours » ouvre la carte centrée sur le premier nœud du parcours, sa fiche ouverte. S'il y a déjà une progression, le bouton devient « Reprendre le parcours » et ouvre le prochain nœud non lu. | E |
| C04 | Chaque fiche affiche en haut un bouton « Voir la mindmap » qui ferme la fiche et laisse la carte centrée sur le nœud de cette fiche. | E |
| C05 | Chaque fiche et chaque lien a une URL propre (ex. `/fiche/cqrs`, `/lien/banque--event-sourcing`). Ouvrir cette URL directement affiche la carte centrée sur le nœud ou le lien, la fiche ouverte. | E |
| C06 | Le bouton « retour » du navigateur referme la fiche, puis revient à l'écran précédent. | E |
| C07 | Une URL inconnue affiche une page « Introuvable » avec un lien vers l'accueil et vers la mindmap. | E |

## B. Mindmap — structure (logique pure)

| N° | Comportement | Test |
|---|---|---|
| C08 | Le graphe est dérivé des fiches : une racine « Architectures logicielles », deux branches « Concepts » et « Secteurs », un nœud par fiche rattaché à sa branche. | U |
| C09 | Chaque lien transverse de `links.ts` devient une arête entre deux nœuds existants, avec une étiquette (son titre). | U |
| C10 | Les « architectures voisines » citées dans une fiche concept correspondent à un lien existant (pas de voisin sans explication). | U |
| C11 | Les positions des nœuds sont calculées de façon déterministe (même contenu → même disposition), sans chevauchement de nœuds. | U |

## C. Mindmap — ordinateur

| N° | Comportement | Test |
|---|---|---|
| C12 | La carte entière est visible à l'ouverture, avec zoom (molette, boutons +/−), déplacement (glisser) et bouton « recentrer ». | E (ordi) |
| C13 | Les branches « Concepts » et « Secteurs » se replient et se déplient d'un clic sur leur bouton ; les nœuds et liens concernés disparaissent ou réapparaissent. | E (ordi) |
| C14 | Survoler un nœud met en évidence ses liens et les nœuds reliés ; le reste est estompé. | E (ordi) |
| C15 | Cliquer sur un nœud ouvre sa fiche dans un panneau latéral ; la carte reste visible et interactive à côté. | E (ordi) |
| C16 | Cliquer sur l'étiquette au milieu d'un lien ouvre l'explication de la relation dans le même panneau latéral. | E (ordi) |
| C17 | Le panneau se ferme par un bouton « Fermer » et par la touche Échap. | E (ordi) |

## D. Mindmap — mobile (mode focus, pas de liste de repli)

| N° | Comportement | Test |
|---|---|---|
| C18 | La carte affiche un nœud au centre, son parent et ses enfants autour, ainsi que les nœuds reliés par un lien transverse ; le reste est estompé. (logique de sélection testée en U, affichage en E) | U + E (mobile) |
| C19 | Toucher un nœud enfant, parent ou relié le place au centre avec une animation de recentrage. | E (mobile) |
| C20 | Un fil d'Ariane en haut (ex. Architectures logicielles › Concepts › CQRS) permet de remonter d'un toucher à n'importe quel niveau. | E (mobile) |
| C21 | Le zoom à deux doigts est disponible. | E (mobile) |
| C22 | Toucher le nœud central ouvre sa fiche dans un panneau qui monte du bas, à mi-hauteur (résumé : idée en une phrase + points clés). Glisser vers le haut ou toucher « Voir toute la fiche » le passe en plein écran (fiche complète). Glisser vers le bas le referme. | E (mobile) |
| C23 | Toucher l'étiquette d'un lien ouvre son explication dans le même panneau du bas. | E (mobile) |
| C24 | Toutes les zones tactiles (nœuds, étiquettes de lien, boutons, fil d'Ariane, cases du quiz) mesurent au moins 44×44 px. | E (mobile) |

## E. Fiches

| N° | Comportement | Test |
|---|---|---|
| C25 | Une fiche concept affiche, dans cet ordre : idée en une phrase, problème résolu, quand l'utiliser, quand l'éviter, taille d'équipe et d'entreprise typique, arborescence d'exemple, extrait de code commenté, pièges, architectures voisines, quiz, idée de post LinkedIn, « Suivant ». | E |
| C26 | Une fiche secteur affiche : contexte et contraintes, architecture recommandée par taille (petite, moyenne, grande), langage et framework avec la justification, arborescence cliquable, extrait de code commenté, pièges courants, entreprises réelles (section absente s'il n'y en a pas), quiz, idée de post LinkedIn, « Suivant ». | E |
| C27 | Dans l'arborescence cliquable, cliquer (ou Entrée au clavier) sur un dossier ou un fichier affiche l'explication de son rôle à côté ou en dessous ; un seul élément est expliqué à la fois. | E |
| C28 | Les fichiers propres à l'écosystème du langage (`pom.xml`, `composer.json`, `package.json`, `go.mod`…) ont leur explication dans l'arborescence. | U |
| C29 | Les extraits de code s'affichent avec coloration syntaxique, le nom du langage et un bouton « Copier ». | E |
| C30 | Les architectures voisines sont des liens : un clic ouvre l'explication de la relation. | E |
| C31 | Le texte de l'idée de post LinkedIn a un bouton « Copier ». | E |
| C32 | Une fiche lien affiche son titre, les deux nœuds reliés (cliquables, chacun ouvre sa fiche) et l'explication de la relation. | E |

## F. Parcours guidé

| N° | Comportement | Test |
|---|---|---|
| C33 | Le parcours est un ordre unique qui passe par toutes les fiches, concepts d'abord puis secteurs, sans doublon ni oubli. | U |
| C34 | Le prochain nœud conseillé est la première fiche non lue dans l'ordre du parcours ; quand tout est lu, il n'y en a plus et un message « Parcours terminé » s'affiche. | U + E |
| C35 | Le prochain nœud conseillé est mis en évidence sur la carte (anneau d'accent + mention « Suivant conseillé »). | E |
| C36 | Chaque fiche se termine par « Suivant : <titre> » et une phrase qui explique pourquoi c'est la suite logique. La dernière fiche n'a pas de « Suivant » mais renvoie au comparateur. | E |
| C37 | Cliquer sur « Suivant » marque la fiche courante comme lue, fait glisser la carte jusqu'au nœud suivant et ouvre sa fiche. | E |

## G. Progression

| N° | Comportement | Test |
|---|---|---|
| C38 | Chaque fiche a un bouton « Marquer comme lue » / « Marquer comme non lue ». | E |
| C39 | Les fiches lues sont cochées sur la carte (ordinateur et mobile). | E |
| C40 | La progression (fiches lues, meilleurs scores de quiz, thème choisi) est enregistrée dans localStorage et retrouvée après rechargement de la page. | E |
| C41 | Si localStorage est indisponible ou contient des données corrompues, l'app fonctionne normalement (progression vide, aucune erreur visible). | U + E |
| C42 | Un compteur « x / 20 fiches lues » est visible depuis la carte. Un bouton « Réinitialiser ma progression » demande confirmation puis efface tout. | E |

## H. Quiz

| N° | Comportement | Test |
|---|---|---|
| C43 | Chaque fiche contient entre 3 et 8 questions à choix multiples, chacune avec une seule bonne réponse et une explication. | U |
| C44 | Après avoir choisi une réponse, la question se verrouille, la bonne réponse est indiquée (couleur **et** icône/texte, pas la couleur seule) et l'explication s'affiche. | E |
| C45 | À la fin, le score s'affiche (ex. 4/5) avec un bouton « Recommencer ». | U (calcul) + E |
| C46 | Le meilleur score de chaque quiz est mémorisé et affiché sur la fiche. | U + E |

## I. Comparateur

| N° | Comportement | Test |
|---|---|---|
| C47 | Le comparateur est accessible depuis la carte et depuis chaque fiche (« Comparer avec… », la fiche courante pré-remplie à gauche). | E |
| C48 | On choisit deux concepts **ou** deux secteurs (pas un mélange) ; les deux s'affichent côte à côte, critère par critère sur la même ligne. Concepts : idée, problème, quand utiliser, quand éviter, taille d'équipe, pièges. Secteurs : contraintes, architecture par taille, langage et framework, pièges. | U (critères) + E |
| C49 | Si un lien existe entre les deux éléments comparés, son explication est affichée en haut du comparateur. | E |
| C50 | Le choix est dans l'URL (ex. `/comparer/cqrs/event-sourcing`) : l'URL est partageable. | E |
| C51 | Sur mobile, les deux colonnes restent côte à côte en version compacte, ou un sélecteur bascule entre les deux, sans défilement horizontal de la page. | E (mobile) |

## J. Thème et accessibilité

| N° | Comportement | Test |
|---|---|---|
| C52 | Le thème suit le réglage de l'appareil ; un bouton permet de forcer clair ou sombre, et ce choix est mémorisé. | E |
| C53 | Les contrastes respectent WCAG AA dans les deux thèmes (vérification automatique axe-core sur l'accueil, la carte, une fiche concept, une fiche secteur, le comparateur). | E |
| C54 | Au clavier sur ordinateur : Tab parcourt les nœuds et les étiquettes de lien, Entrée ouvre la fiche, Échap ferme le panneau, le focus est toujours visible et revient sur le nœud à la fermeture. | E (ordi) |
| C55 | Les nœuds et liens ont un nom accessible (ex. « CQRS, concept, lu »). | E |

## K. Validation du contenu

| N° | Comportement | Test |
|---|---|---|
| C56 | Chaque fiche concept respecte le schéma Zod : toutes les sections présentes et non vides. | U |
| C57 | Chaque fiche secteur respecte le schéma Zod : toutes les sections présentes, les trois tailles d'entreprise renseignées, chaque dossier principal et chaque fichier principal de l'arborescence a une explication. | U |
| C58 | Chaque lien respecte le schéma (titre, explication, deux identifiants) et pointe vers deux nœuds existants et différents ; pas de lien en double. | U |
| C59 | Les identifiants des fiches sont uniques et utilisables dans une URL (minuscules, chiffres, tirets). | U |
| C60 | Le build échoue si une de ces règles (C56 à C59, C33, C43) est violée, avec un message qui nomme le fichier et le champ fautifs. | U (script de build testé) |
| C61 | Les 16 fiches concepts et les 4 fiches secteurs de la V1 existent. | U |

## L. Outillage

| N° | Comportement | Test |
|---|---|---|
| C62 | `npm run verify` enchaîne lint, vérification des types, tests Vitest, build et tests Playwright, et échoue au premier échec. | CI |
| C63 | La CI GitHub lance `npm run verify` sur chaque push et chaque pull request. | CI |

---

## Ordre du parcours proposé (à valider)

1. Transaction Script → 2. Architecture en couches → 3. MVC → 4. Monolithe → 5. Monolithe modulaire → 6. Hexagonale → 7. Clean / Onion → 8. DDD → 9. Vertical Slice → 10. CQRS → 11. Event Sourcing → 12. Architecture orientée événements → 13. Microservices → 14. Serverless → 15. Microkernel (plugins) → 16. Pipes and filters → 17. Site vitrine → 18. E-commerce → 19. SaaS B2B → 20. Banque / fintech

Logique : du code le plus simple à l'organisation interne, puis au découpage du système, puis aux styles spécialisés ; les secteurs vont du plus simple au plus contraint.

## Points ouverts

1. **Hébergement** : Vercel ou GitHub Pages. Ça ne change que la forme des URL (C05, C50) : `/fiche/cqrs` ou `#/fiche/cqrs`.
2. **Mobile, branche Concepts** : 16 enfants autour d'un même nœud sur 390 px, c'est serré. Je propose trois sous-groupes : « Organiser le code » (Transaction Script, couches, MVC, hexagonale, Clean/Onion, Vertical Slice, DDD), « Découper le système » (monolithe, monolithe modulaire, microservices, serverless, microkernel) et « Faire circuler les données » (CQRS, Event Sourcing, orientée événements, pipes and filters). Sinon : un anneau de 16 nœuds aux libellés courts.
3. **Fiche lue** : marquée par le bouton (C38) et par « Suivant » (C37). Faut-il aussi la marquer quand le quiz est terminé ?
