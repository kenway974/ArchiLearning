import type { Link } from './schema';

/** Lien transverse entre deux nœuds de la carte. L'identifiant est « source--target ». */
const link = (source: string, target: string, title: string, explanation: string): Link => ({
  id: `${source}--${target}`,
  source,
  target,
  title,
  explanation,
});

export const links: Link[] = [
  // Concepts entre eux
  link(
    'transaction-script',
    'architecture-en-couches',
    'Du script aux couches',
    'Les couches apparaissent quand un Transaction Script devient trop gros : on sépare l’affichage, les règles et l’accès aux données. Les deux cohabitent souvent : un service de la couche métier n’est parfois qu’un Transaction Script rangé au bon endroit.',
  ),
  link(
    'architecture-en-couches',
    'hexagonale',
    'Couches ou hexagone : le sens des dépendances',
    'Les deux séparent les responsabilités. La différence tient au sens des dépendances : en couches, le métier dépend de l’accès aux données ; en hexagonale, l’accès aux données dépend du métier, à travers des ports définis par le métier. C’est ce qui permet de tester les règles sans base.',
  ),
  link(
    'architecture-en-couches',
    'mvc',
    'MVC n’est qu’une partie de l’application',
    'MVC organise la présentation : contrôleur, vue et données à afficher. L’architecture en couches organise toute l’application, de l’interface à la base. Dans un projet Symfony ou Spring, MVC est la couche présentation d’une architecture en couches.',
  ),
  link(
    'hexagonale',
    'clean-onion',
    'Même règle, découpage différent',
    'Hexagonale, Onion et Clean Architecture partagent la même règle : le code métier ne dépend pas de la technique. L’hexagonale parle de ports et d’adaptateurs ; Onion et Clean détaillent des anneaux (entités, cas d’usage, interfaces, infrastructure). Choisir entre elles est surtout une question de vocabulaire d’équipe.',
  ),
  link(
    'ddd',
    'hexagonale',
    'Un domaine riche mérite d’être protégé',
    'Le DDD dit quoi mettre au centre (agrégats, objets valeur, langage du métier) ; l’hexagonale dit comment le protéger de la technique. Elles se combinent très souvent, mais restent indépendantes : on peut faire de l’hexagonale avec un modèle simple, et du DDD dans une architecture en couches.',
  ),
  link(
    'ddd',
    'cqrs',
    'Des agrégats pour écrire, des vues pour lire',
    'Les agrégats du DDD protègent les règles lors des écritures, mais sont mal adaptés aux écrans qui croisent beaucoup de données. CQRS laisse les agrégats côté écriture et ajoute des modèles de lecture dédiés.',
  ),
  link(
    'ddd',
    'monolithe-modulaire',
    'Un contexte délimité, un module',
    'Les contextes délimités du DDD donnent les frontières les plus solides pour les modules : chaque module a son vocabulaire, son modèle et ses données. Découper selon les tables ou les couches techniques donne des modules qui dépendent tous les uns des autres.',
  ),
  link(
    'cqrs',
    'event-sourcing',
    'Souvent ensemble, jamais obligatoires',
    'L’Event Sourcing stocke des événements, qui se prêtent mal aux lectures directes : il faut des projections, c’est-à-dire le côté lecture de CQRS. L’inverse n’est pas vrai : on peut faire du CQRS avec une base classique, sans aucun événement.',
  ),
  link(
    'vertical-slice',
    'clean-onion',
    'Découper par fonctionnalité ou par anneau',
    'La Clean Architecture découpe horizontalement, par anneau ; Vertical Slice découpe verticalement, par fonctionnalité. On peut les combiner : des tranches verticales qui s’appuient sur un domaine central partagé quand les règles le justifient.',
  ),
  link(
    'vertical-slice',
    'cqrs',
    'Une tranche, une commande ou une requête',
    'Chaque tranche verticale correspond naturellement à une commande (qui modifie) ou à une requête (qui lit). C’est pour cela que les deux sont souvent présentés ensemble dans l’écosystème .NET.',
  ),
  link(
    'monolithe',
    'monolithe-modulaire',
    'Même déploiement, frontières en plus',
    'Les deux sont déployés d’un seul bloc. Le monolithe modulaire ajoute des modules qui possèdent leurs données et n’exposent qu’une API publique, avec des tests qui font respecter ces frontières.',
  ),
  link(
    'monolithe-modulaire',
    'microservices',
    'Extraire un module quand le besoin est réel',
    'Un module bien isolé peut devenir un service le jour où il doit être déployé ou mis à l’échelle séparément. Sans modules, on découpe au hasard et on obtient un monolithe distribué. Le monolithe modulaire est souvent l’étape qui évite des microservices prématurés.',
  ),
  link(
    'microservices',
    'architecture-evenementielle',
    'Moins d’appels en cascade',
    'Des services qui s’appellent tous en synchrone voient leur disponibilité chuter avec chaque maillon. Publier des événements laisse chaque service réagir à son rythme, au prix d’une cohérence à terme et d’un outillage de suivi des messages.',
  ),
  link(
    'architecture-evenementielle',
    'event-sourcing',
    'Communiquer avec des événements ou stocker des événements',
    'L’architecture orientée événements utilise les événements pour communiquer entre composants. L’Event Sourcing les utilise comme source de vérité pour stocker l’état. Les événements internes d’un agrégat ne doivent pas être publiés tels quels : on publie des événements d’intégration, pensés comme un contrat public.',
  ),
  link(
    'serverless',
    'architecture-evenementielle',
    'Des fonctions déclenchées par des événements',
    'Une fonction serverless est presque toujours déclenchée par un événement : requête HTTP, fichier déposé, message dans une file. Le serverless est une façon d’exécuter une architecture orientée événements sans gérer de serveurs.',
  ),
  link(
    'microservices',
    'serverless',
    'Des services aux fonctions',
    'Le serverless pousse le découpage plus loin que les microservices : l’unité de déploiement devient la fonction et l’infrastructure est déléguée au fournisseur. Les deux se combinent souvent : des services toujours allumés pour le cœur, des fonctions pour les traitements ponctuels.',
  ),
  link(
    'microkernel',
    'pipes-and-filters',
    'Deux façons d’assembler des composants indépendants',
    'Le microkernel ajoute des fonctionnalités par plugins autour d’un noyau ; pipes and filters enchaîne des étapes de traitement. Les deux reposent sur un contrat simple et stable entre composants. Beaucoup d’outils de build combinent les deux : des plugins qui ajoutent des étapes à un pipeline.',
  ),
  link(
    'pipes-and-filters',
    'architecture-evenementielle',
    'Du pipeline local au flux distribué',
    'Quand chaque filtre devient un service et que les pipes deviennent des topics d’un broker (Kafka par exemple), un pipeline devient une architecture orientée événements de type flux (streaming).',
  ),

  // Secteurs et architectures
  link(
    'site-vitrine',
    'mvc',
    'Un CMS est une application MVC',
    'WordPress, Drupal ou un site Symfony séparent les contenus (modèle), les gabarits (vue) et le traitement des requêtes (contrôleur ou hooks). Comprendre MVC aide à savoir où placer une personnalisation sans casser les mises à jour.',
  ),
  link(
    'site-vitrine',
    'monolithe',
    'Le monolithe le plus simple',
    'Un site vitrine est un monolithe : un seul code, une seule base, un seul déploiement. C’est le bon choix : la complexité d’une architecture distribuée n’apporterait rien à quelques pages de contenu.',
  ),
  link(
    'e-commerce',
    'monolithe-modulaire',
    'Une boutique découpée en modules',
    'Catalogue, panier, commandes, paiement et stock ont des règles distinctes. Les ranger en modules aux frontières claires permet à plusieurs développeurs de travailler sans se gêner, tout en gardant un seul déploiement simple à exploiter pendant les pics de trafic.',
  ),
  link(
    'e-commerce',
    'architecture-evenementielle',
    'Une commande, plusieurs réactions',
    'Une commande payée déclenche la réservation du stock, la facture, l’e-mail de confirmation et l’envoi à l’ERP. Publier un événement « commande payée » garde le tunnel de commande rapide et permet d’ajouter une réaction sans le modifier.',
  ),
  link(
    'e-commerce',
    'cqrs',
    'Un catalogue très lu, des commandes très contrôlées',
    'Le catalogue est consulté des milliers de fois pour une modification ; les commandes doivent respecter des règles strictes. Séparer lecture (cache, moteur de recherche) et écriture (modèle métier des commandes) suit l’idée de CQRS, même sans le nommer.',
  ),
  link(
    'saas-b2b',
    'monolithe-modulaire',
    'L’architecture par défaut d’un SaaS qui grandit',
    'Un SaaS B2B doit livrer vite avec plusieurs équipes : facturation, utilisateurs, cœur produit. Le monolithe modulaire donne l’autonomie des équipes sans le coût d’exploitation des microservices, et prépare l’extraction des rares modules qui le justifieront.',
  ),
  link(
    'saas-b2b',
    'microkernel',
    'Intégrations et extensions',
    'Les clients entreprise demandent des connecteurs (CRM, SSO, messagerie) et des personnalisations. Les exposer comme des extensions autour d’un cœur stable évite de mélanger les besoins de chaque client dans le code principal.',
  ),
  link(
    'banque-fintech',
    'event-sourcing',
    'Un relevé de compte est déjà une liste d’événements',
    'Une banque ne modifie jamais une opération passée : elle passe une écriture de correction. Le métier raisonne donc déjà en événements historisés, et l’audit est une exigence réglementaire. L’Event Sourcing reprend exactement ce modèle : le solde se recalcule à partir des opérations.',
  ),
  link(
    'banque-fintech',
    'hexagonale',
    'Isoler le métier des systèmes externes',
    'Une banque dépend de nombreux systèmes externes ou historiques : réseaux de paiement, partenaires, systèmes centraux, outils de conformité. Les placer derrière des ports permet de tester les règles sans eux et de les remplacer progressivement.',
  ),
  link(
    'banque-fintech',
    'microservices',
    'Découper par domaine bancaire',
    'Comptes, paiements, cartes, crédit et conformité ont des équipes, des réglementations et des exigences de disponibilité différentes. Les grandes banques et plusieurs néobanques ont décrit publiquement des architectures en nombreux services, rendues possibles par une forte culture d’exploitation.',
  ),
];
