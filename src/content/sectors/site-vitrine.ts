import type { SectorSheet } from '../schema';

export const siteVitrine: SectorSheet = {
  id: 'site-vitrine',
  kind: 'sector',
  title: 'Site vitrine',
  summary: 'Un site de présentation (entreprise, artisan, association) : quelques pages, un formulaire de contact, des contenus modifiés par un non-développeur.',
  context:
    'Le site vitrine est le projet web le plus courant. Peu de logique métier, peu de trafic dans la plupart des cas, mais des attentes fortes sur le référencement, la vitesse d’affichage, l’accessibilité et la facilité d’édition par le client. Le budget et la maintenance dans la durée comptent plus que l’architecture.',
  constraints: [
    'Édition des contenus par le client, sans développeur.',
    'Référencement naturel et performances (Core Web Vitals).',
    'Coût d’hébergement et de maintenance faible.',
    'Mises à jour de sécurité régulières (CMS et extensions).',
    'RGPD : consentement aux cookies, données du formulaire de contact.',
  ],
  bySize: {
    small: {
      architecture: 'CMS monolithique (WordPress) ou générateur de site statique',
      why: 'Un CMS donne l’édition au client sans développement ; un site statique est plus rapide et plus sûr quand les contenus changent peu.',
    },
    medium: {
      architecture: 'CMS monolithique structuré (Bedrock, thème sur mesure) ou CMS headless + site statique',
      why: 'Versionner le code, gérer les dépendances avec Composer et séparer configuration et contenu rend la maintenance prévisible.',
    },
    large: {
      architecture: 'CMS headless + front statique ou rendu côté serveur, derrière un CDN',
      why: 'Plusieurs sites, langues et équipes éditoriales partagent les mêmes contenus ; le front est servi depuis un CDN pour tenir les pics de trafic.',
    },
  },
  stack: {
    language: 'php',
    framework: 'WordPress (structuré avec Bedrock)',
    why: 'WordPress domine le marché des CMS : le client trouve facilement des prestataires et des tutoriels. Bedrock (projet open source de Roots) le range comme une application PHP moderne : dépendances via Composer, configuration par variables d’environnement, cœur de WordPress isolé du code du projet.',
  },
  tree: [
    {
      name: 'config',
      kind: 'dir',
      role: 'Configuration par environnement, versionnée sans aucun secret.',
      children: [
        { name: 'application.php', kind: 'file', role: 'Configuration principale : lit les variables d’environnement (base, URL, clés).' },
        { name: 'environments/development.php', kind: 'file', role: 'Réglages propres au développement (affichage des erreurs).' },
      ],
    },
    {
      name: 'web',
      kind: 'dir',
      role: 'Racine publique servie par le serveur web.',
      children: [
        {
          name: 'app',
          kind: 'dir',
          role: 'Équivalent de wp-content : le code propre au projet.',
          children: [
            { name: 'themes/agence', kind: 'dir', role: 'Thème sur mesure : gabarits, styles et scripts du site.', children: [
              { name: 'functions.php', kind: 'file', role: 'Déclare les menus, tailles d’images et types de contenu du thème.' },
              { name: 'front-page.php', kind: 'file', role: 'Gabarit de la page d’accueil.' },
            ] },
            { name: 'mu-plugins', kind: 'dir', role: 'Extensions toujours actives, impossibles à désactiver depuis l’administration.', children: [
              { name: 'formulaire-contact.php', kind: 'file', role: 'Traitement du formulaire de contact (validation, e-mail, anti-spam).' },
            ] },
          ],
        },
        { name: 'wp', kind: 'dir', role: 'Cœur de WordPress installé par Composer : jamais modifié à la main.', children: [
          { name: 'wp-login.php', kind: 'file', role: 'Page de connexion fournie par WordPress (non versionnée dans le projet).' },
        ] },
        { name: 'index.php', kind: 'file', role: 'Point d’entrée qui charge WordPress.' },
      ],
    },
    { name: '.env.example', kind: 'file', role: 'Modèle des variables d’environnement à renseigner (le vrai .env n’est pas versionné).' },
    { name: 'composer.json', kind: 'file', role: 'Manifeste PHP : version de WordPress, extensions et thème installés comme dépendances.' },
    { name: 'composer.lock', kind: 'file', role: 'Versions exactes installées : garantit le même site sur chaque serveur.' },
  ],
  code: {
    language: 'php',
    filename: 'web/app/mu-plugins/formulaire-contact.php',
    source: `<?php
/**
 * Plugin Name: Formulaire de contact
 * Traitement du formulaire de contact, en extension « must-use » toujours active.
 */

add_action('admin_post_nopriv_contact', 'agence_traiter_contact');
add_action('admin_post_contact', 'agence_traiter_contact');

function agence_traiter_contact(): void
{
    // 1. Sécurité : jeton anti-CSRF généré par wp_nonce_field() dans le formulaire
    if (!wp_verify_nonce($_POST['_wpnonce'] ?? '', 'contact')) {
        wp_die('Requête invalide', 403);
    }

    // 2. Nettoyer les entrées avec les fonctions de WordPress
    $email   = sanitize_email($_POST['email'] ?? '');
    $message = sanitize_textarea_field($_POST['message'] ?? '');
    if (!is_email($email) || $message === '') {
        wp_safe_redirect(home_url('/contact?erreur=1'));
        exit;
    }

    // 3. Envoyer : l'adresse de destination vient de la configuration, pas du code
    wp_mail(get_option('admin_email'), 'Nouveau message du site', $message, [
        'Reply-To: ' . $email,
    ]);

    wp_safe_redirect(home_url('/contact?envoye=1'));
    exit;
}`,
  },
  pitfalls: [
    'Installer des dizaines d’extensions pour des besoins simples : autant de failles et de mises à jour.',
    'Modifier le cœur de WordPress ou un thème parent : la prochaine mise à jour efface le travail.',
    'Pas de mises à jour de sécurité : les sites WordPress abandonnés sont une cible fréquente.',
    'Versionner les identifiants de base de données dans le code.',
    'Choisir une architecture headless coûteuse pour cinq pages qui changent deux fois par an.',
  ],
  companies: [],
  prerequisites: [
    { id: 'mvc', reason: 'Un CMS sépare contenus, gabarits et traitement des requêtes : MVC donne les bases pour s’y retrouver.' },
  ],
  nextSteps: [
    { id: 'e-commerce', reason: 'Le e-commerce ajoute au site vitrine un vrai métier : catalogue, stock, paiement.' },
    { id: 'serverless', reason: 'Sur un site statique, le formulaire de contact peut être une simple fonction serverless.' },
  ],
  quiz: [
    {
      question: 'Quelle est la contrainte principale d’un site vitrine ?',
      choices: [
        'La montée en charge à des millions de transactions',
        'L’édition des contenus par le client et la maintenance à faible coût',
        'La cohérence transactionnelle distribuée',
        'La latence en microsecondes',
      ],
      answer: 1,
      explanation: 'Peu de logique métier : ce qui compte, c’est l’autonomie du client, le référencement et la maintenance.',
    },
    {
      question: 'Que fait Bedrock pour un projet WordPress ?',
      choices: [
        'Il remplace WordPress',
        'Il gère WordPress et les extensions avec Composer et sépare la configuration du code',
        'Il transforme WordPress en microservices',
        'Il héberge le site',
      ],
      answer: 1,
      explanation: 'Le cœur et les extensions deviennent des dépendances versionnées.',
    },
    {
      question: 'Pourquoi mettre le formulaire de contact dans un « mu-plugin » ?',
      choices: [
        'Pour qu’il soit plus rapide',
        'Pour qu’il ne puisse pas être désactivé par erreur depuis l’administration',
        'Pour le cacher aux moteurs de recherche',
        'C’est obligatoire pour envoyer des e-mails',
      ],
      answer: 1,
      explanation: 'Les extensions « must-use » sont toujours actives.',
    },
    {
      question: 'Quand un générateur de site statique est-il préférable à un CMS ?',
      choices: [
        'Quand le client publie plusieurs articles par jour sans développeur',
        'Quand les contenus changent rarement et que la vitesse et la sécurité priment',
        'Quand il faut un back-office complexe',
        'Jamais',
      ],
      answer: 1,
      explanation: 'Sans base ni code serveur, il y a moins de surface d’attaque et l’affichage est plus rapide.',
    },
    {
      question: 'Quel est le rôle de composer.lock ?',
      choices: [
        'Bloquer l’accès au site',
        'Figer les versions exactes des dépendances installées',
        'Stocker les mots de passe',
        'Configurer le serveur web',
      ],
      answer: 1,
      explanation: 'Chaque environnement installe exactement les mêmes versions.',
    },
  ],
  linkedinPost:
    'L’architecture d’un site vitrine ne se juge pas à son élégance mais à une question : dans 3 ans, qui fera les mises à jour ? Un WordPress propre (Composer, configuration hors du code, peu d’extensions) bat souvent un front headless que plus personne ne sait maintenir.',
};
