import type { SectorSheet } from '../schema';

export const eCommerce: SectorSheet = {
  id: 'e-commerce',
  kind: 'sector',
  title: 'E-commerce',
  summary: 'Vendre en ligne : catalogue, panier, paiement, stock, livraison, avec des pics de trafic et des intégrations nombreuses.',
  context:
    'Une boutique en ligne combine un front très consulté (catalogue, recherche) et un back-office aux règles nombreuses (prix, promotions, taxes, stock, retours). Les pics sont prévisibles (soldes, Black Friday) mais brutaux. Les intégrations sont la norme : prestataire de paiement, transporteurs, ERP, marketplaces, outils marketing.',
  constraints: [
    'Pics de trafic saisonniers sur le catalogue et le tunnel de commande.',
    'Paiement : déléguer la saisie de carte à un prestataire certifié PCI DSS.',
    'Cohérence du stock entre site, magasins et marketplaces.',
    'Règles de prix et de promotions qui changent souvent.',
    'Intégrations avec ERP, transporteurs, comptabilité.',
    'Droit de la consommation (rétractation, mentions) et TVA selon les pays.',
  ],
  bySize: {
    small: {
      architecture: 'Solution SaaS (Shopify, PrestaShop hébergé) ou monolithe e-commerce open source',
      why: 'Le catalogue, le paiement et l’hébergement sont fournis : l’équipe se concentre sur les produits et le marketing.',
    },
    medium: {
      architecture: 'Monolithe modulaire sur un framework e-commerce (Sylius sur Symfony)',
      why: 'Des règles métier propres (tarifs B2B, configurateur, logistique) demandent du code sur mesure ; des modules clairs (catalogue, commandes, paiement, stock) gardent l’ensemble maintenable.',
    },
    large: {
      architecture: 'Monolithe modulaire ou services par domaine, reliés par événements, avec catalogue et recherche séparés en lecture',
      why: 'Plusieurs équipes, plusieurs canaux de vente et des charges très différentes entre le catalogue (lecture massive) et les commandes (écriture critique).',
    },
  },
  stack: {
    language: 'php',
    framework: 'Symfony (avec Sylius)',
    why: 'PHP reste très présent dans le e-commerce (Magento/Adobe Commerce, PrestaShop, WooCommerce, Sylius). Symfony apporte une base solide (injection de dépendances, Messenger pour l’asynchrone, Doctrine) et Sylius, construit sur Symfony, fournit les briques e-commerce (panier, commandes, paiement, promotions) tout en restant du code Symfony qu’on étend.',
  },
  tree: [
    {
      name: 'src',
      kind: 'dir',
      role: 'Code de la boutique, rangé par module métier.',
      children: [
        {
          name: 'Commandes',
          kind: 'dir',
          role: 'Module Commandes : tunnel, validation, statut.',
          children: [
            { name: 'PasserCommandeHandler.php', kind: 'file', role: 'Valide la commande et publie l’événement CommandePassee.' },
            { name: 'CommandePassee.php', kind: 'file', role: 'Message publié aux autres modules après validation.' },
          ],
        },
        {
          name: 'Stock',
          kind: 'dir',
          role: 'Module Stock : réservations et synchronisation avec l’ERP.',
          children: [{ name: 'ReserverStockHandler.php', kind: 'file', role: 'Réagit à CommandePassee et réserve le stock.' }],
        },
        {
          name: 'Paiement',
          kind: 'dir',
          role: 'Intégration du prestataire de paiement (jamais de numéro de carte stocké ici).',
          children: [{ name: 'WebhookPaiementController.php', kind: 'file', role: 'Reçoit la confirmation de paiement du prestataire et vérifie sa signature.' }],
        },
      ],
    },
    {
      name: 'config',
      kind: 'dir',
      role: 'Configuration Symfony (services, routes, bundles).',
      children: [
        { name: 'packages/messenger.yaml', kind: 'file', role: 'Routage des messages : quels messages partent en file asynchrone.' },
        { name: 'packages/sylius_shop.yaml', kind: 'file', role: 'Configuration de la boutique Sylius.' },
      ],
    },
    { name: 'templates', kind: 'dir', role: 'Gabarits Twig de la boutique (surcharge des templates Sylius).', children: [
      { name: 'bundles/SyliusShopBundle/Product/show.html.twig', kind: 'file', role: 'Surcharge de la fiche produit fournie par Sylius.' },
    ] },
    { name: 'migrations', kind: 'dir', role: 'Migrations Doctrine du schéma de base.', children: [
      { name: 'Version20240115093000.php', kind: 'file', role: 'Une migration : ajoute une colonne ou une table.' },
    ] },
    { name: 'composer.json', kind: 'file', role: 'Manifeste PHP : Symfony, Sylius, SDK du prestataire de paiement.' },
    { name: '.env', kind: 'file', role: 'Valeurs par défaut des variables d’environnement (les secrets réels sont ailleurs).' },
  ],
  code: {
    language: 'php',
    filename: 'src/Stock/ReserverStockHandler.php',
    source: `<?php
namespace App\\Stock;

use App\\Commandes\\CommandePassee;
use Symfony\\Component\\Messenger\\Attribute\\AsMessageHandler;

// Le module Stock réagit à un message du module Commandes, sans connaître son code interne.
#[AsMessageHandler]
final class ReserverStockHandler
{
    public function __construct(private readonly StockRepository $stock) {}

    public function __invoke(CommandePassee $message): void
    {
        // Idempotence : un message peut être relivré après une erreur ; ne pas réserver deux fois
        if ($this->stock->dejaReserve($message->commandeId)) {
            return;
        }

        foreach ($message->lignes as $ligne) {
            // Lève une exception si le stock est insuffisant : le message est réessayé
            // ou envoyé dans la file d'échec selon la configuration de Messenger.
            $this->stock->reserver($ligne->sku, $ligne->quantite, $message->commandeId);
        }
    }
}

// config/packages/messenger.yaml :
//   routing: { 'App\\Commandes\\CommandePassee': async }
// Le tunnel de commande répond vite ; la réservation se fait dans un worker.`,
  },
  pitfalls: [
    'Stocker ou faire transiter des numéros de carte : utiliser les champs hébergés du prestataire de paiement.',
    'Le stock survendu : sans réservation atomique, deux clients achètent le dernier article.',
    'Tout calculer en synchrone dans le tunnel de commande (e-mails, ERP, factures) : il devient lent et fragile.',
    'Découper en microservices avant le premier Black Friday : préparer d’abord le cache et la mise à l’échelle du catalogue.',
    'Ne pas vérifier la signature des webhooks de paiement.',
  ],
  examples: [
    {
      name: 'Thé des Collines',
      size: 'small',
      profile: 'Boutique de thés en ligne, 3 salariés, quelques centaines de commandes par mois.',
      team: 'Pas de développeur : la fondatrice gère la boutique, un freelance intervient ponctuellement.',
      practices: [
        'Solution SaaS e-commerce : catalogue, paiement et hébergement fournis.',
        'Un thème du marché personnalisé, quelques applications (avis clients, e-mails).',
        'Expéditions préparées à la main à partir des commandes du jour.',
      ],
    },
    {
      name: 'Outilpro',
      size: 'medium',
      profile: 'Distributeur d’outillage, 80 salariés, vend aux particuliers et aux professionnels.',
      team: '6 développeurs PHP en interne, organisés en une seule équipe.',
      practices: [
        'Boutique Sylius sur Symfony, organisée en modules : catalogue, commandes, stock, paiement.',
        'Tarifs professionnels et remises par client calculés dans le module de prix.',
        'Tâches lentes (factures, e-mails, envoi à l’ERP) en file asynchrone avec Symfony Messenger.',
        'Moteur de recherche dédié pour le catalogue et cache devant les pages produits.',
      ],
    },
    {
      name: 'Maisonéo',
      size: 'large',
      profile: 'Enseigne d’équipement de la maison, 3 000 salariés, site, application et magasins.',
      team: '10 équipes produit, chacune responsable d’un domaine (catalogue, panier, livraison…).',
      practices: [
        'Catalogue et recherche séparés des commandes, mis à l’échelle indépendamment.',
        'Commandes, stock et livraison échangent des événements via un broker de messages.',
        'Stock unifié entre site, magasins et marketplaces.',
        'Tests de charge avant chaque période de soldes et de fêtes.',
      ],
    },
  ],
  prerequisites: [
    { id: 'monolithe-modulaire', reason: 'Une boutique sur mesure est d’abord un monolithe à bien découper en modules : catalogue, commandes, stock, paiement.' },
    { id: 'mvc', reason: 'Le front d’une boutique Symfony est une application MVC classique.' },
  ],
  nextSteps: [
    { id: 'saas-b2b', reason: 'Le SaaS B2B ajoute la multi-location et les abonnements à ces problématiques.' },
    { id: 'architecture-evenementielle', reason: 'Commande, stock, facturation et e-mails sont un cas d’école de communication par événements.' },
  ],
  quiz: [
    {
      question: 'Pourquoi passer la réservation du stock en asynchrone ?',
      choices: [
        'Pour réserver deux fois',
        'Pour garder un tunnel de commande rapide et absorber les pics',
        'Parce que Symfony l’impose',
        'Pour éviter la base de données',
      ],
      answer: 1,
      explanation: 'Le client n’attend pas les traitements secondaires ; un worker les fait.',
    },
    {
      question: 'Comment gérer les données de carte bancaire ?',
      choices: [
        'Les chiffrer dans la base',
        'Les confier aux champs hébergés d’un prestataire certifié PCI DSS',
        'Les stocker dans un fichier',
        'Les envoyer par e-mail',
      ],
      answer: 1,
      explanation: 'Le site ne voit jamais le numéro : la conformité PCI DSS est grandement réduite.',
    },
    {
      question: 'Pourquoi le handler vérifie-t-il « déjà réservé » ?',
      choices: [
        'Pour la performance',
        'Parce qu’un message peut être relivré : le traitement doit être idempotent',
        'Pour les statistiques',
        'C’est inutile',
      ],
      answer: 1,
      explanation: 'Après une erreur, Messenger réessaie : sans ce contrôle, le stock serait réservé deux fois.',
    },
    {
      question: 'Pour une boutique de taille moyenne avec des règles propres, quelle architecture ?',
      choices: ['Microservices', 'Monolithe modulaire sur un framework e-commerce', 'Serverless pur', 'Site statique'],
      answer: 1,
      explanation: 'Du code sur mesure dans des modules clairs, sans le coût d’un système distribué.',
    },
    {
      question: 'Quelle partie subit le plus de lectures ?',
      choices: ['La comptabilité', 'Le catalogue et la recherche', 'Les retours', 'Le back-office'],
      answer: 1,
      explanation: 'D’où l’intérêt d’un cache, d’un moteur de recherche dédié, voire de CQRS sur le catalogue.',
    },
  ],
  linkedinPost:
    'Black Friday ne teste pas vos microservices, il teste votre cache et votre tunnel de commande. Une boutique bien rangée en modules (catalogue, commandes, stock, paiement) avec l’asynchrone au bon endroit tient la charge bien avant d’avoir besoin de 30 services.',
};
