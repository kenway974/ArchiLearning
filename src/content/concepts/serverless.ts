import type { ConceptSheet } from '../schema';

export const serverless: ConceptSheet = {
  id: 'serverless',
  kind: 'concept',
  title: 'Serverless',
  summary: 'On écrit des fonctions déclenchées par des événements (requête HTTP, fichier, message) ; le fournisseur cloud gère serveurs, montée en charge et facturation à l’usage.',
  problem:
    'Ne plus gérer de serveurs pour des charges irrégulières ou des traitements ponctuels : la plateforme (AWS Lambda, Azure Functions, Google Cloud Functions…) démarre des instances à la demande et peut descendre à zéro quand rien ne se passe.',
  whenToUse: [
    'Charge irrégulière ou faible : webhooks, tâches planifiées, traitements de fichiers.',
    'Glue entre services managés (stockage, files, bases).',
    'Petite équipe qui veut éviter l’exploitation de serveurs.',
  ],
  whenToAvoid: [
    'Charge forte et constante : un service toujours allumé peut coûter moins cher.',
    'Latence très stricte : le démarrage à froid ajoute un délai sur certaines requêtes.',
    'Traitements longs : les plateformes imposent une durée maximale d’exécution par appel.',
    'Forte contrainte de portabilité entre fournisseurs.',
  ],
  teamSize: 'Très adapté aux petites équipes et aux startups ; utilisé aussi par de grandes entreprises pour des traitements ciblés.',
  tree: [
    {
      name: 'src',
      kind: 'dir',
      role: 'Une fonction par déclencheur.',
      children: [
        {
          name: 'handlers',
          kind: 'dir',
          role: 'Points d’entrée appelés par la plateforme.',
          children: [
            { name: 'miniatures.ts', kind: 'file', role: 'Déclenchée quand une image est déposée dans le stockage : crée une miniature.' },
            { name: 'webhookPaiement.ts', kind: 'file', role: 'Reçoit les notifications HTTP du prestataire de paiement.' },
          ],
        },
        { name: 'lib/images.ts', kind: 'file', role: 'Code métier sans dépendance à la plateforme, testable localement.' },
      ],
    },
    { name: 'template.yaml', kind: 'file', role: 'Infrastructure en code (AWS SAM) : fonctions, déclencheurs, droits.' },
    { name: 'package.json', kind: 'file', role: 'Manifeste Node : dépendances (SDK AWS, sharp) et scripts.' },
  ],
  code: {
    language: 'typescript',
    filename: 'src/handlers/miniatures.ts',
    source: `import type { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { creerMiniature } from '../lib/images';

// Créé une fois par instance et réutilisé entre les appels (démarrage à chaud)
const s3 = new S3Client({});

// La plateforme appelle cette fonction à chaque image déposée : pas de serveur à gérer.
export const handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
    if (key.startsWith('miniatures/')) continue; // évite de se redéclencher soi-même

    const original = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const image = await original.Body!.transformToByteArray();

    // La logique métier est dans une fonction pure, testable sans AWS
    const miniature = await creerMiniature(image, 200);

    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: \`miniatures/\${key}\`, Body: miniature }));
  }
};`,
  },
  pitfalls: [
    'La boucle infinie : une fonction qui écrit là où elle est déclenchée se relance sans fin (et la facture suit).',
    'Mettre la logique métier dans le handler : elle devient impossible à tester hors du cloud.',
    'Ignorer le démarrage à froid sur des parcours sensibles à la latence.',
    'Des dizaines de fonctions sans infrastructure en code : personne ne sait plus ce qui est déployé.',
  ],
  neighbors: ['architecture-evenementielle', 'microservices'],
  prerequisites: [
    { id: 'architecture-evenementielle', reason: 'Une fonction serverless réagit à un événement : il faut d’abord comprendre ce modèle.' },
  ],
  nextSteps: [
    { id: 'pipes-and-filters', reason: 'Plusieurs fonctions chaînées forment un pipeline : c’est pipes and filters.' },
    { id: 'site-vitrine', reason: 'Un formulaire de contact de site vitrine est un cas d’usage serverless typique.' },
  ],
  quiz: [
    {
      question: 'Qui gère les serveurs en serverless ?',
      choices: ['L’équipe de développement', 'Le fournisseur cloud', 'Personne, il n’y en a pas', 'Le client final'],
      answer: 1,
      explanation: 'Il y a toujours des serveurs, mais c’est la plateforme qui les gère.',
    },
    {
      question: 'Qu’est-ce que le démarrage à froid ?',
      choices: [
        'Un redémarrage planifié',
        'Le délai pour créer une nouvelle instance quand aucune n’est prête',
        'Une panne du fournisseur',
        'Un mode d’économie d’énergie du poste',
      ],
      answer: 1,
      explanation: 'La première requête sur une instance neuve est plus lente.',
    },
    {
      question: 'Quand le serverless peut-il coûter plus cher ?',
      choices: [
        'Charge très faible',
        'Charge forte et constante',
        'Tâches planifiées une fois par jour',
        'Webhooks occasionnels',
      ],
      answer: 1,
      explanation: 'Facturé à l’appel, il devient coûteux face à un serveur toujours plein.',
    },
    {
      question: 'Pourquoi sortir la logique du handler ?',
      choices: [
        'Pour réduire la taille du fichier',
        'Pour la tester sans la plateforme cloud',
        'C’est obligatoire',
        'Pour éviter TypeScript',
      ],
      answer: 1,
      explanation: 'Le handler adapte l’événement ; la logique reste une fonction pure testable.',
    },
  ],
  linkedinPost:
    'Serverless ne veut pas dire « sans serveur », ça veut dire « sans serveur à gérer ». Parfait pour un webhook appelé 200 fois par jour. Discutable pour une API à 5 000 requêtes par seconde, 24h/24. Le bon choix dépend de la courbe de charge, pas de la mode.',
};
