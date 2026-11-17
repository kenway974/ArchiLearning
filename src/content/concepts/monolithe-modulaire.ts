import type { ConceptSheet } from '../schema';

export const monolitheModulaire: ConceptSheet = {
  id: 'monolithe-modulaire',
  kind: 'concept',
  title: 'Monolithe modulaire',
  summary: 'Un seul déploiement, mais découpé en modules métier aux frontières strictes : chacun a son API publique et ses données, les autres n’y touchent pas.',
  problem:
    'Obtenir l’essentiel des bénéfices des microservices (équipes autonomes, code découplé) sans leur coût opérationnel (réseau, déploiements multiples, cohérence distribuée). Si un module doit un jour devenir un service, ses frontières sont déjà là.',
  whenToUse: [
    'Produit qui grandit avec plusieurs équipes, mais sans besoin réel de déploiements séparés.',
    'Quand on veut préparer une éventuelle extraction en services sans la payer tout de suite.',
    'Pour remettre de l’ordre dans un monolithe existant, module par module.',
  ],
  whenToAvoid: [
    'Très petite application : un monolithe simple suffit.',
    'Quand des parties doivent vraiment être déployées ou mises à l’échelle séparément (charge très différente, exigences de disponibilité distinctes).',
  ],
  teamSize: 'De 5 à plusieurs dizaines de développeurs. Shopify a documenté publiquement son choix de modulariser son monolithe Rails plutôt que de passer aux microservices.',
  tree: [
    {
      name: 'src/main/java/fr/boutique',
      kind: 'dir',
      role: 'Un paquet par module métier ; Spring Modulith vérifie les frontières.',
      children: [
        {
          name: 'commandes',
          kind: 'dir',
          role: 'Module Commandes : seul son paquet racine est visible des autres modules.',
          children: [
            { name: 'CommandeService.java', kind: 'file', role: 'API publique du module (paquet racine).' },
            { name: 'CommandePassee.java', kind: 'file', role: 'Événement publié pour les autres modules.' },
            { name: 'internal/CommandeRepository.java', kind: 'file', role: 'Détail interne : invisible hors du module.' },
          ],
        },
        {
          name: 'stock',
          kind: 'dir',
          role: 'Module Stock : réagit aux commandes par événement, sans appeler leurs classes internes.',
          children: [{ name: 'ReservationStock.java', kind: 'file', role: 'Écoute CommandePassee et réserve le stock.' }],
        },
        { name: 'BoutiqueApplication.java', kind: 'file', role: 'Point d’entrée Spring Boot unique.' },
      ],
    },
    {
      name: 'src/test/java/fr/boutique/ArchitectureTest.java',
      kind: 'file',
      role: 'Test qui échoue si un module utilise les classes internes d’un autre.',
    },
    { name: 'pom.xml', kind: 'file', role: 'Manifeste Maven : Spring Boot et Spring Modulith.' },
  ],
  code: {
    language: 'java',
    filename: 'src/test/java/fr/boutique/ArchitectureTest.java',
    source: `// Le test qui fait respecter les frontières entre modules (Spring Modulith)
class ArchitectureTest {

    @Test
    void lesModulesRespectentLeursFrontieres() {
        // Échoue si « stock » importe fr.boutique.commandes.internal.*
        ApplicationModules.of(BoutiqueApplication.class).verify();
    }
}

// Module « stock » : il réagit à un événement public du module « commandes ».
@Component
class ReservationStock {

    private final StockRepository stock;

    ReservationStock(StockRepository stock) {
        this.stock = stock;
    }

    @ApplicationModuleListener // exécuté après le commit de la transaction des commandes
    void quandCommandePassee(CommandePassee evenement) {
        evenement.lignes().forEach(l -> stock.reserver(l.produitId(), l.quantite()));
    }
}`,
  },
  pitfalls: [
    'Des modules qui partagent les mêmes tables : la frontière n’existe que dans les dossiers.',
    'Aucun outil pour vérifier les frontières : elles s’érodent en quelques mois.',
    'Découper par couche technique au lieu de découper par domaine métier.',
  ],
  neighbors: ['monolithe', 'microservices', 'ddd'],
  prerequisites: [
    { id: 'monolithe', reason: 'Le monolithe modulaire est un monolithe auquel on ajoute des frontières : il faut connaître le point de départ.' },
  ],
  nextSteps: [
    { id: 'microservices', reason: 'Un module bien isolé peut devenir un service si un vrai besoin apparaît.' },
    { id: 'architecture-evenementielle', reason: 'Les modules communiquent mieux par événements que par appels directs.' },
    { id: 'saas-b2b', reason: 'Le SaaS B2B est un secteur où le monolithe modulaire est souvent le meilleur compromis.' },
  ],
  quiz: [
    {
      question: 'Combien de déploiements pour un monolithe modulaire ?',
      choices: ['Un par module', 'Un seul', 'Un par équipe', 'Un par table'],
      answer: 1,
      explanation: 'C’est un seul déploiement : la modularité est dans le code, pas dans l’infrastructure.',
    },
    {
      question: 'Comment un module accède-t-il aux données d’un autre ?',
      choices: [
        'En lisant directement ses tables',
        'Par son API publique ou par ses événements',
        'En copiant son code',
        'Par un fichier partagé',
      ],
      answer: 1,
      explanation: 'Les données d’un module lui appartiennent ; les autres passent par son interface.',
    },
    {
      question: 'Pourquoi un test d’architecture ?',
      choices: [
        'Pour mesurer la performance',
        'Pour empêcher qu’un module utilise les détails internes d’un autre',
        'Pour générer la documentation',
        'Pour déployer plus vite',
      ],
      answer: 1,
      explanation: 'Sans vérification automatique, les frontières s’érodent.',
    },
    {
      question: 'Quel avantage par rapport aux microservices ?',
      choices: [
        'Mise à l’échelle indépendante de chaque module',
        'Pas d’appels réseau ni de transactions distribuées',
        'Un langage par module',
        'Une base par module obligatoire',
      ],
      answer: 1,
      explanation: 'On garde la simplicité d’exploitation du monolithe.',
    },
  ],
  linkedinPost:
    'Entre le monolithe « plat de spaghettis » et 80 microservices, il existe une option sous-estimée : le monolithe modulaire. Un déploiement, des modules aux frontières vérifiées par des tests. Shopify en a fait un sujet public. La plupart des équipes devraient commencer là.',
};
