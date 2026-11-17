import type { ConceptSheet } from '../schema';

export const mvc: ConceptSheet = {
  id: 'mvc',
  kind: 'concept',
  title: 'MVC',
  summary: 'Le modèle porte les données, la vue les affiche, le contrôleur reçoit la requête et fait le lien entre les deux.',
  problem:
    'Séparer l’interface de la logique pour qu’un designer modifie un template sans toucher au code qui calcule. Né dans les interfaces Smalltalk à la fin des années 1970, MVC est devenu le modèle des frameworks web côté serveur (Rails, Symfony, Laravel, ASP.NET MVC, Spring MVC).',
  whenToUse: [
    'Applications web rendues côté serveur : sites, back-offices, CMS.',
    'Quand on suit un framework qui l’impose : on gagne ses conventions.',
  ],
  whenToAvoid: [
    'Comme architecture de toute l’application : MVC organise la présentation, pas le métier.',
    'Quand les contrôleurs grossissent avec des règles métier (« fat controllers ») : sortir la logique dans des services ou un domaine.',
  ],
  teamSize: 'Toutes tailles : du freelance qui monte un site Symfony aux grandes équipes sur Rails ou ASP.NET.',
  tree: [
    {
      name: 'src',
      kind: 'dir',
      role: 'Code PHP de l’application Symfony.',
      children: [
        {
          name: 'Controller',
          kind: 'dir',
          role: 'Les C de MVC : une méthode par route.',
          children: [{ name: 'ArticleController.php', kind: 'file', role: 'Affiche la liste et le détail des articles.' }],
        },
        {
          name: 'Entity',
          kind: 'dir',
          role: 'Le M de MVC : objets mappés sur la base par Doctrine.',
          children: [{ name: 'Article.php', kind: 'file', role: 'Entité Article : titre, contenu, date de publication.' }],
        },
        {
          name: 'Repository',
          kind: 'dir',
          role: 'Requêtes de lecture sur les entités.',
          children: [{ name: 'ArticleRepository.php', kind: 'file', role: 'Requête « articles publiés, du plus récent au plus ancien ».' }],
        },
      ],
    },
    {
      name: 'templates',
      kind: 'dir',
      role: 'Le V de MVC : templates Twig, sans logique métier.',
      children: [{ name: 'article/index.html.twig', kind: 'file', role: 'Affiche la liste des articles reçue du contrôleur.' }],
    },
    { name: 'config/routes.yaml', kind: 'file', role: 'Déclare l’import des routes définies par attributs dans les contrôleurs.' },
    { name: 'composer.json', kind: 'file', role: 'Manifeste PHP : version de Symfony, bundles, autoload PSR-4.' },
  ],
  code: {
    language: 'php',
    filename: 'src/Controller/ArticleController.php',
    source: `<?php
namespace App\\Controller;

use App\\Repository\\ArticleRepository;
use Symfony\\Bundle\\FrameworkBundle\\Controller\\AbstractController;
use Symfony\\Component\\HttpFoundation\\Response;
use Symfony\\Component\\Routing\\Attribute\\Route;

final class ArticleController extends AbstractController
{
    // Le contrôleur : reçoit la requête, demande les données, choisit la vue.
    #[Route('/articles', name: 'article_index')]
    public function index(ArticleRepository $articles): Response
    {
        // Modèle : les données viennent du repository
        $publies = $articles->findPublishedNewestFirst();

        // Vue : le template ne fait qu'afficher
        return $this->render('article/index.html.twig', [
            'articles' => $publies,
        ]);
    }
}`,
  },
  pitfalls: [
    'Le contrôleur obèse : calculs de prix, envoi d’e-mails et règles de gestion dans les actions.',
    'De la logique dans les templates (conditions métier en Twig ou Blade).',
    'Croire que MVC suffit à structurer une application qui grossit : il faut organiser le M (services, domaine, modules).',
  ],
  neighbors: ['architecture-en-couches'],
  prerequisites: [
    { id: 'transaction-script', reason: 'Une action de contrôleur est souvent un Transaction Script : mieux vaut connaître ce point de départ.' },
  ],
  nextSteps: [
    { id: 'architecture-en-couches', reason: 'MVC range la présentation ; les couches rangent le reste de l’application.' },
    { id: 'site-vitrine', reason: 'Un site vitrine est le cas d’usage le plus direct de MVC côté serveur.' },
  ],
  quiz: [
    {
      question: 'Dans MVC, qui reçoit la requête HTTP ?',
      choices: ['Le modèle', 'La vue', 'Le contrôleur', 'La base de données'],
      answer: 2,
      explanation: 'Le contrôleur reçoit la requête, sollicite le modèle et choisit la vue à rendre.',
    },
    {
      question: 'Où ne doit-on pas mettre de règle métier ?',
      choices: ['Dans un service', 'Dans le template', 'Dans une entité', 'Dans un objet du domaine'],
      answer: 1,
      explanation: 'La vue affiche ; une règle dans un template est invisible pour les tests et dupliquée.',
    },
    {
      question: 'MVC est avant tout un pattern :',
      choices: ['De présentation', 'De déploiement', 'De base de données', 'De messagerie'],
      answer: 0,
      explanation: 'Il organise l’interface. Le reste de l’application a besoin d’une autre structure.',
    },
    {
      question: 'Dans Symfony, le « M » correspond le plus souvent à :',
      choices: ['Les fichiers YAML', 'Les entités Doctrine et les services', 'Les templates Twig', 'Le routeur'],
      answer: 1,
      explanation: 'Les entités, repositories et services forment le modèle ; Twig est la vue.',
    },
  ],
  linkedinPost:
    '« On est en MVC » ne dit presque rien de votre architecture. MVC range l’écran : contrôleur, modèle, vue. Mais où sont vos règles de remise, vos statuts de commande, vos droits ? Si la réponse est « dans les contrôleurs », vous avez un Transaction Script avec des templates.',
};
