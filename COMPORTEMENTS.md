# Archi Map — comportements attendus (V1)

Chaque comportement porte un numéro (Cxx). Ce numéro apparaît dans le nom du test qui le vérifie et dans le message du commit qui l'implémente.

Type de test : **U** = Vitest (logique pure ou contenu), **E** = Playwright, sur ordinateur (1280×800) et mobile (390×844) sauf mention contraire.

Hébergement : Vercel, URL propres (réécriture de toutes les routes vers `index.html`).

## Pages et URL

| URL | Page |
|---|---|
| `/` | Accueil |
| `/cours` | Liste des cours |
| `/cours/:id` | Fiche en pleine page (concept ou secteur) |
| `/liens/:id` | Explication d'un lien en pleine page |
| `/carte` | Mindmap |
| `/carte/:id` | Mindmap centrée sur un nœud, sa fiche ouverte dans le panneau |
| `/carte/liens/:id` | Mindmap centrée sur un lien, son explication ouverte dans le panneau |
| `/progression` | Ma progression |
| `/comparer`, `/comparer/:a`, `/comparer/:a/:b` | Comparateur (vide, un élément choisi, deux éléments choisis) |

---

## A. Navigation générale

| N° | Comportement | Test |
|---|---|---|
| C01 | L'accueil affiche le titre « Archi Map », une présentation courte (à quoi sert l'app, en 2 ou 3 phrases), un bouton « Liste des cours », un bouton « Voir la mindmap », un lien vers « Ma progression », et le nombre de cours disponibles (ex. « 16 concepts, 4 secteurs »). | E |
| C02 | Une barre de navigation semi-flottante est présente sur toutes les pages : Accueil, Cours, Mindmap, Comparer, Progression, bouton de thème. Sur mobile, elle reste accessible sans masquer le contenu (barre compacte en bas d'écran). | E |
| C03 | La page en cours est indiquée dans la barre de navigation. | E |
| C04 | Chaque URL du tableau ci-dessus, ouverte directement (lien collé, rechargement), affiche la bonne page. | E |
| C05 | Le bouton « retour » du navigateur revient à l'écran précédent (fermeture du panneau comprise). | E |
| C06 | Une URL inconnue, ou un identifiant de fiche inexistant, affiche une page « Introuvable » avec des liens vers l'accueil, les cours et la mindmap. | E |

## B. Liste des cours

| N° | Comportement | Test |
|---|---|---|
| C07 | La liste affiche deux sections, « Concepts » et « Secteurs ». Chaque cours est une carte : titre, idée en une phrase, coche s'il est lu. | E |
| C08 | Un champ de recherche filtre les cours par mot-clé (titre, idée, contenu de la fiche), sans tenir compte des majuscules ni des accents. Aucun résultat → message « Aucun cours ne correspond » avec un bouton pour effacer la recherche. | U (filtre) + E |
| C09 | Un filtre « Tous / Non lus / Lus » restreint la liste ; il se combine avec la recherche. | U + E |
| C10 | Cliquer sur un cours ouvre sa fiche en pleine page (`/cours/:id`). | E |

## C. Page « Ma progression »

| N° | Comportement | Test |
|---|---|---|
| C11 | La page affiche le nombre de fiches lues (ex. « 7 / 20 »), séparément pour les concepts et les secteurs, et les meilleurs scores de quiz. | E |
| C12 | Si un parcours est en cours, la page affiche son sujet, l'étape atteinte et un bouton « Reprendre » qui ouvre l'étape suivante. | E |
| C13 | Un bouton « Réinitialiser ma progression » demande confirmation, puis efface fiches lues, scores et parcours en cours. | E |

## D. Mindmap — structure (logique pure)

| N° | Comportement | Test |
|---|---|---|
| C14 | Le graphe est dérivé des fiches : une racine « Architectures logicielles », deux branches « Concepts » et « Secteurs », un nœud par fiche rattaché à sa branche. | U |
| C15 | Chaque lien transverse de `links.ts` devient une arête entre deux nœuds existants, avec une étiquette (son titre). | U |
| C16 | Les positions des nœuds sont calculées de façon déterministe (même contenu → même disposition), sans chevauchement de nœuds. | U |
| C17 | Pour un nœud donné, on sait calculer son parent, ses enfants et ses nœuds reliés par un lien transverse (utilisé pour le survol et le mode focus). | U |

## E. Mindmap — ordinateur

| N° | Comportement | Test |
|---|---|---|
| C18 | La carte entière est visible à l'ouverture, avec zoom (molette, boutons +/−), déplacement (glisser) et bouton « Recentrer ». | E (ordi) |
| C19 | Les branches « Concepts » et « Secteurs » se replient et se déplient d'un clic sur leur bouton ; les nœuds et liens concernés disparaissent ou réapparaissent. | E (ordi) |
| C20 | Survoler un nœud met en évidence ses liens et les nœuds reliés ; le reste est estompé. | E (ordi) |
| C21 | Cliquer sur un nœud ouvre sa fiche dans un panneau latéral ; la carte reste visible et interactive à côté. | E (ordi) |
| C22 | Cliquer sur l'étiquette au milieu d'un lien ouvre l'explication de la relation dans le même panneau. | E (ordi) |
| C23 | Le panneau se ferme par un bouton « Fermer » et par la touche Échap. | E (ordi) |

## F. Mindmap — mobile

La même mindmap que sur ordinateur, pas de liste de repli.

| N° | Comportement | Test |
|---|---|---|
| C24 | La carte se zoome à deux doigts et se déplace au doigt. | E (mobile) |
| C25 | Toucher un nœud le place au centre avec une animation. Son parent, ses enfants et ses nœuds reliés restent nets ; le reste est estompé (mode focus). | E (mobile) |
| C26 | Un fil d'Ariane en haut (ex. Architectures logicielles › Concepts › CQRS) permet de remonter d'un toucher à n'importe quel niveau. | E (mobile) |
| C27 | Toucher un nœud de fiche ouvre aussi un panneau qui monte du bas, à mi-hauteur : titre, idée en une phrase, points clés, bouton « Voir toute la fiche ». Glisser vers le haut (ou ce bouton) le passe en plein écran avec la fiche complète. Glisser vers le bas le referme. | E (mobile) |
| C28 | Toucher l'étiquette d'un lien ouvre son explication dans le même panneau du bas. | E (mobile) |
| C29 | Toutes les zones tactiles (nœuds, étiquettes de lien, boutons, fil d'Ariane, barre de navigation, réponses du quiz) mesurent au moins 44×44 px. | E (mobile) |

## G. Fiches

Les fiches ont le même contenu en pleine page (`/cours/:id`) et dans le panneau de la carte.

| N° | Comportement | Test |
|---|---|---|
| C30 | Une fiche concept affiche, dans cet ordre : idée en une phrase, problème résolu, quand l'utiliser, quand l'éviter, taille d'équipe et d'entreprise typique, arborescence d'exemple, extrait de code commenté, pièges, architectures voisines, quiz, idée de post LinkedIn. | E |
| C31 | Une fiche secteur affiche : contexte et contraintes, architecture recommandée par taille (petite, moyenne, grande), langage et framework avec la justification, arborescence cliquable, extrait de code commenté, pièges courants, entreprises réelles (section absente s'il n'y en a pas), quiz, idée de post LinkedIn. | E |
| C32 | En haut de chaque fiche : bouton « Voir sur la mindmap » (ouvre `/carte/:id`), bouton « Comparer avec… », bouton « Marquer comme lue / non lue ». | E |
| C33 | L'arborescence est dépliée par défaut. Cliquer (ou Entrée au clavier) sur un dossier ou un fichier affiche l'explication de son rôle ; un seul élément est expliqué à la fois. Au clavier : flèches haut/bas pour se déplacer, gauche/droite pour replier/déplier. | E |
| C34 | Les extraits de code s'affichent avec coloration syntaxique, le nom du langage et un bouton « Copier ». | E |
| C35 | Les architectures voisines sont cliquables : un clic ouvre l'explication de la relation. | E |
| C36 | L'idée de post LinkedIn a un bouton « Copier ». | E |
| C37 | Une page de lien affiche son titre, les deux nœuds reliés (cliquables, chacun ouvre sa fiche) et l'explication de la relation. | E |

## H. Parcours par sujet

Chaque fiche déclare ses **prérequis** (fiches à comprendre avant) et ses **suites** (fiches qui la prolongent).

| N° | Comportement | Test |
|---|---|---|
| C38 | Le parcours d'un sujet est calculé ainsi : ses prérequis non lus, eux-mêmes précédés de leurs propres prérequis non lus (dans l'ordre où il faut les lire), puis le sujet. Une fiche sans prérequis non lu a un parcours d'une seule étape. | U |
| C39 | En haut d'une fiche qui a des prérequis non lus : « Pour bien comprendre ce sujet, commence par X, Y » et un bouton « Suivre le parcours ». On peut aussi lire la fiche directement. | E |
| C40 | « Suivre le parcours » ouvre la première étape et mémorise le parcours en cours. | E |
| C41 | Pendant un parcours, chaque fiche se termine par « Suivant : <titre> » et une phrase qui explique pourquoi c'est la suite logique, avec l'indication « Étape 2 / 4 ». La phrase est celle du prérequis qui relie l'étape suivante à l'étape courante ou, à défaut, à la fiche du parcours qui en a besoin. | U + E |
| C42 | Cliquer sur « Suivant » marque la fiche courante comme lue et ouvre l'étape suivante. Sur la carte, la carte glisse jusqu'au nœud suivant et ouvre sa fiche dans le panneau ; en pleine page, la fiche suivante s'ouvre. | E |
| C43 | Sur la carte, pendant un parcours, l'étape suivante est mise en évidence (anneau d'accent + mention « Suivant »). | E |
| C44 | À la dernière étape, « Suivant » est remplacé par « Parcours terminé », avec les suites du sujet proposées (« Pour aller plus loin : … »). Le parcours en cours est clos quand la fiche cible est lue. | U + E |
| C45 | Hors parcours, chaque fiche se termine par ses suites (« Pour aller plus loin »), chacune avec sa phrase d'explication. | E |

## I. Progression (stockage)

| N° | Comportement | Test |
|---|---|---|
| C46 | Une fiche est marquée comme lue par le bouton « Marquer comme lue », par « Suivant », ou quand son quiz est terminé. | U + E |
| C47 | Les fiches lues sont cochées sur la carte (ordinateur et mobile) et dans la liste des cours. | E |
| C48 | Fiches lues, meilleurs scores, parcours en cours et thème choisi sont enregistrés dans localStorage et retrouvés après rechargement. | E |
| C49 | Si localStorage est indisponible ou contient des données corrompues, l'app fonctionne normalement (progression vide, aucune erreur visible). | U + E |

## J. Quiz

| N° | Comportement | Test |
|---|---|---|
| C50 | Après avoir choisi une réponse, la question se verrouille, la bonne réponse est indiquée (couleur **et** icône ou texte, jamais la couleur seule) et l'explication s'affiche. | E |
| C51 | À la fin, le score s'affiche (ex. 4/5) avec un bouton « Recommencer ». | U (calcul) + E |
| C52 | Le meilleur score de chaque quiz est mémorisé et affiché sur la fiche. | U + E |

## K. Comparateur

| N° | Comportement | Test |
|---|---|---|
| C53 | Le comparateur est accessible depuis la barre de navigation et depuis chaque fiche (« Comparer avec… », la fiche courante pré-remplie à gauche). | E |
| C54 | On choisit deux concepts **ou** deux secteurs (pas un mélange) ; sur ordinateur, ils s’affichent côte à côte, critère par critère sur la même ligne. Concepts : idée, problème, quand utiliser, quand éviter, taille d'équipe, pièges. Secteurs : contraintes, architecture par taille, langage et framework, pièges. | U (critères) + E |
| C55 | Si un lien existe entre les deux éléments comparés, son explication est affichée en haut. | E |
| C56 | Le choix est dans l'URL (`/comparer/cqrs/event-sourcing`), donc partageable. | E |
| C57 | Sur mobile, un sélecteur bascule entre les deux colonnes, critère par critère, sans défilement horizontal de la page. | E (mobile) |

## L. Thème et accessibilité

| N° | Comportement | Test |
|---|---|---|
| C58 | Le thème suit le réglage de l'appareil ; le bouton de thème force clair ou sombre, et ce choix est mémorisé. | E |
| C59 | Les contrastes respectent WCAG AA dans les deux thèmes (vérification axe-core sur l'accueil, la liste, la carte, une fiche concept, une fiche secteur, la progression, le comparateur). | E |
| C60 | Au clavier sur ordinateur : Tab parcourt la navigation, les nœuds et les étiquettes de lien ; Entrée ouvre la fiche ; Échap ferme le panneau ; le focus est toujours visible et revient sur le nœud à la fermeture. | E (ordi) |
| C61 | Les nœuds et liens ont un nom accessible (ex. « CQRS, concept, lu »). | E |

## M. Validation du contenu

| N° | Comportement | Test |
|---|---|---|
| C62 | Chaque fiche concept respecte le schéma Zod : toutes les sections présentes et non vides. | U |
| C63 | Chaque fiche secteur respecte le schéma Zod : toutes les sections présentes, les trois tailles d'entreprise renseignées, chaque dossier principal et chaque fichier principal de l'arborescence a une explication, y compris les fichiers propres à l'écosystème (`pom.xml`, `composer.json`, `package.json`, `go.mod`…). | U |
| C64 | Chaque quiz a entre 3 et 8 questions, chacune avec une seule bonne réponse et une explication. | U |
| C65 | Chaque lien a un titre, une explication et deux identifiants qui pointent vers deux nœuds existants et différents ; pas de lien en double. Chaque architecture voisine citée dans une fiche correspond à un lien existant. | U |
| C66 | Prérequis et suites pointent vers des fiches existantes, chacun avec sa phrase d'explication ; les prérequis ne forment pas de boucle. | U |
| C67 | Les identifiants des fiches sont uniques et utilisables dans une URL (minuscules, chiffres, tirets). | U |
| C68 | Les 16 fiches concepts et les 4 fiches secteurs de la V1 existent. | U |
| C69 | Le build échoue si une règle de C62 à C68 est violée, avec un message qui nomme le fichier et le champ fautifs. | U |

## N. Outillage

| N° | Comportement | Test |
|---|---|---|
| C70 | `npm run verify` enchaîne lint, vérification des types, tests Vitest, build et tests Playwright, et échoue au premier échec. | CI |
| C71 | La CI GitHub lance `npm run verify` sur chaque push et chaque pull request. | CI |
