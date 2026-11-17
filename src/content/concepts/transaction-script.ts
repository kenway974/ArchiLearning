import type { ConceptSheet } from '../schema';

export const transactionScript: ConceptSheet = {
  id: 'transaction-script',
  kind: 'concept',
  title: 'Transaction Script',
  summary: 'Une procédure par action utilisateur, qui fait tout du début à la fin : lire, vérifier, calculer, écrire.',
  problem:
    'Livrer vite des fonctionnalités simples sans inventer de modèle : chaque cas d’usage (« passer une commande », « envoyer un formulaire ») devient une fonction lisible de haut en bas. Le terme vient de Martin Fowler (Patterns of Enterprise Application Architecture, 2002).',
  whenToUse: [
    'Logique métier mince : formulaires, CRUD, back-offices simples.',
    'Prototype ou MVP dont on n’est pas sûr qu’il survivra.',
    'Scripts de traitement par lots ou tâches planifiées.',
  ],
  whenToAvoid: [
    'Quand les mêmes règles métier se retrouvent copiées dans plusieurs scripts.',
    'Quand les règles se croisent (remises, statuts, droits) et qu’un changement casse un autre script.',
    'Domaine riche et durable : préférer un modèle de domaine (DDD).',
  ],
  teamSize: 'Un à trois développeurs, startups au stade MVP, agences, outils internes. Reste courant dans les grandes entreprises pour les scripts et petits services.',
  tree: [
    {
      name: 'public',
      kind: 'dir',
      role: 'Seul dossier exposé par le serveur web : les points d’entrée HTTP.',
      children: [
        { name: 'index.php', kind: 'file', role: 'Routeur minimal : choisit le script à exécuter selon l’URL.' },
      ],
    },
    {
      name: 'scripts',
      kind: 'dir',
      role: 'Un fichier par action utilisateur : c’est le cœur du pattern.',
      children: [
        { name: 'passer_commande.php', kind: 'file', role: 'Toute la transaction « passer une commande », de la validation à l’e-mail.' },
        { name: 'annuler_commande.php', kind: 'file', role: 'Toute la transaction « annuler une commande ».' },
      ],
    },
    {
      name: 'lib',
      kind: 'dir',
      role: 'Fonctions partagées techniques (connexion base, envoi d’e-mail), sans règle métier.',
      children: [{ name: 'db.php', kind: 'file', role: 'Ouvre la connexion PDO réutilisée par les scripts.' }],
    },
    { name: 'composer.json', kind: 'file', role: 'Manifeste PHP : dépendances (ex. PHPMailer) et autoload.' },
  ],
  code: {
    language: 'php',
    filename: 'scripts/passer_commande.php',
    source: `<?php
// Transaction Script : toute l'action « passer une commande » tient dans une procédure.
function passerCommande(PDO $db, int $clientId, array $lignes): int
{
    // 1. Vérifier les entrées
    if ($lignes === []) {
        throw new InvalidArgumentException('Panier vide');
    }

    $db->beginTransaction(); // une action utilisateur = une transaction base
    try {
        // 2. Calculer : la règle métier est écrite ici, en ligne
        $total = 0;
        foreach ($lignes as $ligne) {
            $prix = $db->prepare('SELECT prix FROM produit WHERE id = ?');
            $prix->execute([$ligne['produitId']]);
            $total += (int) $prix->fetchColumn() * $ligne['quantite'];
        }

        // 3. Écrire
        $db->prepare('INSERT INTO commande (client_id, total) VALUES (?, ?)')
           ->execute([$clientId, $total]);
        $commandeId = (int) $db->lastInsertId();

        $db->commit();
        return $commandeId;
    } catch (Throwable $e) {
        $db->rollBack(); // tout ou rien
        throw $e;
    }
}`,
  },
  pitfalls: [
    'La duplication : le calcul du total finit copié dans « passer », « modifier » et « facturer », puis diverge.',
    'Les scripts géants de plusieurs centaines de lignes, impossibles à tester sans base de données.',
    'Garder ce style trop longtemps : le passage à un modèle de domaine coûte plus cher à chaque mois.',
  ],
  neighbors: ['architecture-en-couches'],
  prerequisites: [],
  nextSteps: [
    { id: 'architecture-en-couches', reason: 'Quand les scripts grossissent, on sépare l’affichage, la logique et l’accès aux données : ce sont les couches.' },
    { id: 'mvc', reason: 'MVC range le code d’une application web autour des requêtes, juste au-dessus des scripts.' },
    { id: 'pipes-and-filters', reason: 'Un traitement par lots, c’est souvent une suite de scripts chaînés : c’est le point de départ de pipes and filters.' },
  ],
  quiz: [
    {
      question: 'Qu’est-ce qui caractérise un Transaction Script ?',
      choices: [
        'Une procédure par action utilisateur, qui contient toute la logique',
        'Un objet métier par table de la base',
        'Un service par équipe',
        'Un événement par changement d’état',
      ],
      answer: 0,
      explanation: 'Chaque cas d’usage est une procédure lue de haut en bas : validation, calcul, écriture.',
    },
    {
      question: 'Quel signal indique qu’il faut quitter ce style ?',
      choices: [
        'Le site a plus de dix pages',
        'La même règle métier est copiée dans plusieurs scripts',
        'On utilise une base relationnelle',
        'On déploie sur un serveur mutualisé',
      ],
      answer: 1,
      explanation: 'La duplication des règles est le symptôme principal : elles divergent et créent des bugs.',
    },
    {
      question: 'Pourquoi ouvrir une transaction base de données dans le script ?',
      choices: [
        'Pour accélérer les requêtes',
        'Pour que l’action réussisse ou échoue en entier',
        'Pour éviter d’écrire du SQL',
        'C’est obligatoire en PHP',
      ],
      answer: 1,
      explanation: 'Une action utilisateur doit être atomique : si une écriture échoue, on annule tout (rollback).',
    },
    {
      question: 'Dans quel contexte ce pattern reste-t-il un bon choix ?',
      choices: ['Un cœur bancaire', 'Un MVP au métier simple', 'Un moteur de règles d’assurance', 'Un système de trading'],
      answer: 1,
      explanation: 'Avec peu de règles et un avenir incertain, la simplicité l’emporte.',
    },
  ],
  linkedinPost:
    'Le pattern le plus utilisé au monde n’a pas de logo : le Transaction Script. Une action = une fonction qui fait tout. Ce n’est pas du « mauvais code » : c’est le bon choix tant que le métier est simple. Le vrai signal pour changer ? Quand vous copiez la même règle dans un troisième fichier.',
};
