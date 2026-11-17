import type { SectorSheet } from '../schema';

export const saasB2b: SectorSheet = {
  id: 'saas-b2b',
  kind: 'sector',
  title: 'SaaS B2B',
  summary: 'Un logiciel vendu sur abonnement à des entreprises : une seule application sert de nombreux clients (multi-location), avec droits, intégrations et facturation.',
  context:
    'Un SaaS B2B sert des centaines ou des milliers d’organisations clientes depuis la même application. Chaque client attend que ses données soient strictement isolées, des rôles et permissions fins, une API et des intégrations (SSO, CRM, Slack…), une disponibilité contractuelle et des évolutions fréquentes sans interruption. Les clients importants posent des questions de sécurité (questionnaires, certifications comme SOC 2 ou ISO 27001).',
  constraints: [
    'Isolation des données entre clients (multi-location).',
    'Rôles, permissions et authentification unique (SSO, SAML/OIDC).',
    'Disponibilité et livraisons fréquentes sans coupure.',
    'API publique stable et intégrations tierces.',
    'Abonnements, quotas et facturation à l’usage.',
    'RGPD et exigences de sécurité des clients entreprise.',
  ],
  bySize: {
    small: {
      architecture: 'Monolithe (bien rangé) avec une base partagée et une colonne tenant_id',
      why: 'Une petite équipe doit itérer vite pour trouver son marché ; un seul déploiement et une seule base limitent l’exploitation.',
    },
    medium: {
      architecture: 'Monolithe modulaire, événements internes, tâches asynchrones',
      why: 'Plusieurs équipes travaillent sur des domaines (facturation, utilisateurs, cœur produit) ; des modules aux frontières vérifiées évitent les blocages sans payer le distribué.',
    },
    large: {
      architecture: 'Services par domaine extraits du monolithe là où c’est justifié, communication par événements',
      why: 'Des domaines aux charges différentes (import de données, notifications, recherche) et des équipes nombreuses justifient des déploiements séparés.',
    },
  },
  stack: {
    language: 'typescript',
    framework: 'NestJS (Node.js) avec PostgreSQL',
    why: 'TypeScript permet un seul langage du front (React, Angular, Vue) au back, avec un typage partagé des contrats d’API. NestJS impose des modules, l’injection de dépendances et des conventions proches de Spring ou Angular, ce qui structure naturellement un monolithe modulaire. PostgreSQL offre la sécurité au niveau des lignes (row level security), utile pour l’isolation des clients.',
  },
  tree: [
    {
      name: 'src',
      kind: 'dir',
      role: 'Code NestJS, un module par domaine métier.',
      children: [
        {
          name: 'tenancy',
          kind: 'dir',
          role: 'Multi-location : identifie le client de chaque requête et l’impose partout.',
          children: [
            { name: 'tenant.middleware.ts', kind: 'file', role: 'Lit le client depuis le jeton et le place dans le contexte de la requête.' },
            { name: 'tenant-context.ts', kind: 'file', role: 'Stocke le client courant pour la durée de la requête (AsyncLocalStorage).' },
          ],
        },
        {
          name: 'projets',
          kind: 'dir',
          role: 'Module du cœur produit (ici, la gestion de projets).',
          children: [
            { name: 'projets.module.ts', kind: 'file', role: 'Déclare ce que le module exporte : le reste est privé.' },
            { name: 'projets.service.ts', kind: 'file', role: 'Règles métier ; chaque requête est filtrée par client.' },
            { name: 'projets.controller.ts', kind: 'file', role: 'Routes HTTP de l’API publique, protégées par les permissions.' },
          ],
        },
        {
          name: 'facturation',
          kind: 'dir',
          role: 'Abonnements et quotas, branchés sur le prestataire de paiement.',
          children: [{ name: 'quotas.guard.ts', kind: 'file', role: 'Refuse une action si le quota du plan est atteint.' }],
        },
        { name: 'app.module.ts', kind: 'file', role: 'Module racine : assemble les modules métier.' },
        { name: 'main.ts', kind: 'file', role: 'Démarre l’application NestJS.' },
      ],
    },
    { name: 'prisma/schema.prisma', kind: 'file', role: 'Schéma de base : chaque table métier porte un tenantId.' },
    { name: 'nest-cli.json', kind: 'file', role: 'Configuration de la CLI NestJS (génération, build).' },
    { name: 'package.json', kind: 'file', role: 'Manifeste Node : NestJS, Prisma, dépendances et scripts.' },
  ],
  code: {
    language: 'typescript',
    filename: 'src/projets/projets.service.ts',
    source: `import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenancy/tenant-context';

@Injectable()
export class ProjetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext, // client de la requête en cours
  ) {}

  // Règle d'or du multi-location : AUCUNE requête sans filtre sur le client.
  async lister() {
    return this.prisma.projet.findMany({
      where: { tenantId: this.tenant.id() },
      orderBy: { creeLe: 'desc' },
    });
  }

  async trouver(id: string) {
    // findFirst avec tenantId, et pas findUnique({ id }) :
    // sinon un client pourrait lire le projet d'un autre en devinant l'identifiant.
    const projet = await this.prisma.projet.findFirst({
      where: { id, tenantId: this.tenant.id() },
    });
    if (!projet) throw new NotFoundException(); // 404 et non 403 : ne pas révéler l'existence
    return projet;
  }
}

// Défense en profondeur possible : activer la row level security de PostgreSQL
// pour que la base elle-même refuse les lignes d'un autre client.`,
  },
  pitfalls: [
    'Oublier le filtre client dans une seule requête : une fuite de données entre clients, l’incident le plus grave d’un SaaS.',
    'Le développement spécifique pour un gros client dans le cœur du code, au lieu de paramètres ou d’extensions.',
    'Une API publique qui expose le modèle interne : chaque refonte casse les intégrations des clients.',
    'Passer aux microservices pour « être prêt à grandir » avant d’avoir trouvé son marché.',
    'Les tâches lourdes (imports, exports) dans les requêtes HTTP au lieu d’une file de tâches.',
  ],
  companies: [],
  prerequisites: [
    { id: 'monolithe-modulaire', reason: 'Le monolithe modulaire est l’architecture par défaut d’un SaaS qui grandit : il faut le connaître avant d’arriver ici.' },
    { id: 'architecture-evenementielle', reason: 'Notifications, intégrations et facturation réagissent à des événements du produit.' },
  ],
  nextSteps: [
    { id: 'banque-fintech', reason: 'La fintech ajoute aux contraintes du SaaS la réglementation et l’exigence d’historique.' },
    { id: 'microkernel', reason: 'Les intégrations et extensions d’un SaaS suivent souvent un modèle de plugins.' },
  ],
  quiz: [
    {
      question: 'Quel est le risque le plus grave dans un SaaS multi-location ?',
      choices: [
        'Un temps de build long',
        'Qu’un client voie les données d’un autre',
        'Un logo mal centré',
        'Trop de tests',
      ],
      answer: 1,
      explanation: 'L’isolation des données est la promesse de base ; une fuite détruit la confiance.',
    },
    {
      question: 'Pourquoi chercher un projet avec id ET tenantId ?',
      choices: [
        'Pour la performance',
        'Pour qu’un client ne puisse pas lire une ressource d’un autre en devinant son identifiant',
        'Parce que Prisma l’impose',
        'Pour trier les résultats',
      ],
      answer: 1,
      explanation: 'C’est la faille classique d’accès direct à un objet (IDOR).',
    },
    {
      question: 'Quelle architecture pour un SaaS B2B en phase de démarrage ?',
      choices: [
        'Cinquante microservices',
        'Un monolithe bien rangé',
        'Une base par client dès le départ',
        'Un microkernel',
      ],
      answer: 1,
      explanation: 'Il faut itérer vite ; l’exploitation doit rester simple.',
    },
    {
      question: 'Pourquoi TypeScript est-il fréquent dans le SaaS ?',
      choices: [
        'Parce qu’il est plus rapide que C',
        'Un langage du front au back, avec des types partagés pour l’API',
        'Parce qu’il est imposé par le cloud',
        'Parce qu’il n’a pas besoin de tests',
      ],
      answer: 1,
      explanation: 'Les contrats d’API typés réduisent les erreurs entre front et back.',
    },
    {
      question: 'Que permet la row level security de PostgreSQL ?',
      choices: [
        'Chiffrer les sauvegardes',
        'Faire refuser par la base les lignes qui n’appartiennent pas au client courant',
        'Accélérer les index',
        'Répliquer la base',
      ],
      answer: 1,
      explanation: 'C’est une seconde barrière si le code oublie un filtre.',
    },
  ],
  linkedinPost:
    'Dans un SaaS B2B, la ligne de code la plus importante n’est pas dans votre cœur produit. C’est where: { tenantId }. Oubliez-la une fois et un client lit les données d’un autre. Middleware de contexte, revue de code, row level security : mettez plusieurs barrières.',
};
