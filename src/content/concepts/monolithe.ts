import type { ConceptSheet } from '../schema';

export const monolithe: ConceptSheet = {
  id: 'monolithe',
  kind: 'concept',
  title: 'Monolithe',
  summary: 'Toute l’application est une seule unité de code, construite et déployée d’un bloc, avec en général une seule base de données.',
  problem:
    'Livrer et faire évoluer un produit avec le moins de complexité opérationnelle possible : un dépôt, un build, un déploiement, des appels de fonction au lieu d’appels réseau, des transactions simples.',
  whenToUse: [
    'Démarrage d’un produit : on ne connaît pas encore les bonnes frontières.',
    'Une seule équipe (ou quelques-unes) sur le même produit.',
    'Quand la simplicité d’exploitation compte plus que la mise à l’échelle indépendante de chaque partie.',
  ],
  whenToAvoid: [
    'Plusieurs équipes qui se bloquent mutuellement sur le même déploiement.',
    'Parties du système aux besoins de charge très différents qui doivent passer à l’échelle séparément.',
    'Le « grand plat de spaghettis » : un monolithe sans frontières internes devient impossible à faire évoluer ; passer alors au monolithe modulaire.',
  ],
  teamSize: 'De 1 à une vingtaine de développeurs sans difficulté ; au-delà, il faut des frontières internes fortes (monolithe modulaire).',
  tree: [
    {
      name: 'app',
      kind: 'dir',
      role: 'Code de l’application Laravel, toutes fonctionnalités confondues.',
      children: [
        { name: 'Http/Controllers', kind: 'dir', role: 'Contrôleurs de toutes les pages et API.', children: [
          { name: 'CommandeController.php', kind: 'file', role: 'Pages et actions liées aux commandes.' },
        ] },
        { name: 'Models', kind: 'dir', role: 'Modèles Eloquent : une classe par table.', children: [
          { name: 'Commande.php', kind: 'file', role: 'Modèle Eloquent de la table commandes.' },
        ] },
        { name: 'Jobs', kind: 'dir', role: 'Tâches exécutées en arrière-plan par la file Laravel.', children: [
          { name: 'EnvoyerFacture.php', kind: 'file', role: 'Génère et envoie la facture après paiement.' },
        ] },
      ],
    },
    { name: 'routes/web.php', kind: 'file', role: 'Toutes les routes de l’application, au même endroit.' },
    { name: 'database/migrations', kind: 'dir', role: 'Évolutions du schéma de l’unique base de données.', children: [
      { name: '2024_01_10_000000_create_commandes_table.php', kind: 'file', role: 'Migration qui crée la table commandes.' },
    ] },
    { name: 'composer.json', kind: 'file', role: 'Manifeste PHP : version de Laravel et dépendances.' },
    { name: 'artisan', kind: 'file', role: 'Ligne de commande Laravel : migrations, files, tâches.' },
  ],
  code: {
    language: 'php',
    filename: 'app/Http/Controllers/CommandeController.php',
    source: `<?php
namespace App\\Http\\Controllers;

use App\\Jobs\\EnvoyerFacture;
use App\\Models\\Commande;
use Illuminate\\Support\\Facades\\DB;

class CommandeController extends Controller
{
    public function payer(Commande $commande)
    {
        // Dans un monolithe, stock, paiement et facture partagent la même base :
        // une transaction suffit à garder tout cohérent.
        DB::transaction(function () use ($commande) {
            $commande->update(['statut' => 'payee']);
            foreach ($commande->lignes as $ligne) {
                $ligne->produit->decrement('stock', $ligne->quantite);
            }
        });

        // Le travail lent part en file d'attente… dans le même code, le même déploiement
        EnvoyerFacture::dispatch($commande);

        return redirect()->route('commandes.show', $commande);
    }
}`,
  },
  pitfalls: [
    'Confondre monolithe et mauvais code : le problème n’est pas le déploiement unique, c’est l’absence de frontières internes.',
    'Laisser tous les modules lire toutes les tables : chaque refonte devient risquée.',
    'Passer aux microservices pour « faire moderne » au lieu de structurer d’abord le monolithe.',
  ],
  neighbors: ['monolithe-modulaire'],
  prerequisites: [
    { id: 'architecture-en-couches', reason: 'Un monolithe est presque toujours organisé en couches : c’est la base sur laquelle on raisonne.' },
  ],
  nextSteps: [
    { id: 'monolithe-modulaire', reason: 'Le monolithe modulaire garde un seul déploiement mais impose des frontières internes.' },
    { id: 'site-vitrine', reason: 'Un site vitrine est un monolithe dans sa forme la plus simple.' },
  ],
  quiz: [
    {
      question: 'Qu’est-ce qui définit un monolithe ?',
      choices: [
        'Un code mal écrit',
        'Une seule unité construite et déployée d’un bloc',
        'Une application sans base de données',
        'Une application en PHP',
      ],
      answer: 1,
      explanation: 'C’est une propriété de déploiement, pas de qualité.',
    },
    {
      question: 'Quel avantage a un monolithe face aux microservices ?',
      choices: [
        'La mise à l’échelle indépendante',
        'Des transactions simples et pas d’appels réseau internes',
        'Un déploiement par équipe',
        'Des langages différents par module',
      ],
      answer: 1,
      explanation: 'Un appel de fonction et une transaction en base remplacent le réseau et la cohérence à terme.',
    },
    {
      question: 'Quel signal pousse à structurer le monolithe ?',
      choices: [
        'L’arrivée d’un second développeur',
        'Plusieurs équipes qui se bloquent et des changements qui cassent des parties éloignées',
        'Un nouveau logo',
        'Le passage à PHP 8',
      ],
      answer: 1,
      explanation: 'Le couplage interne est le vrai problème : on ajoute des modules avant de penser microservices.',
    },
  ],
  linkedinPost:
    '« On a un monolithe » est souvent dit avec honte. À tort. Un monolithe, c’est un déploiement. Le problème, c’est le monolithe sans frontières, où tout le monde lit toutes les tables. Avant de découper en services, découpez en modules.',
};
