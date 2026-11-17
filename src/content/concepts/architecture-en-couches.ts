import type { ConceptSheet } from '../schema';

export const architectureEnCouches: ConceptSheet = {
  id: 'architecture-en-couches',
  kind: 'concept',
  title: 'Architecture en couches',
  summary: 'Le code est rangé en couches empilées (présentation, métier, accès aux données) et chaque couche n’appelle que celle du dessous.',
  problem:
    'Éviter que l’affichage, les règles métier et le SQL se mélangent : chaque couche a une responsabilité, on peut changer l’interface sans toucher aux requêtes et répartir le travail dans l’équipe.',
  whenToUse: [
    'Applications de gestion classiques (CRUD avec quelques règles).',
    'Équipes qui débutent : le modèle est connu de tous et outillé par les frameworks.',
    'Point de départ par défaut quand rien ne pousse vers autre chose.',
  ],
  whenToAvoid: [
    'Quand le métier dépend de la base : la couche métier finit par importer des entités ORM et des détails techniques.',
    'Quand chaque fonctionnalité oblige à modifier les trois couches pour une seule règle (« lasagnes »).',
    'Domaines très riches : préférer l’hexagonale ou la Clean Architecture, qui inversent la dépendance vers la base.',
  ],
  teamSize: 'De 2 à 20 développeurs ; PME comme grands groupes. C’est le style par défaut de Spring, Symfony ou ASP.NET.',
  tree: [
    {
      name: 'src/main/java/fr/exemple/boutique',
      kind: 'dir',
      role: 'Racine du code Java, rangée par couche.',
      children: [
        {
          name: 'presentation',
          kind: 'dir',
          role: 'Couche présentation : contrôleurs HTTP, DTO, validation des entrées.',
          children: [{ name: 'CommandeController.java', kind: 'file', role: 'Reçoit la requête HTTP et délègue au service.' }],
        },
        {
          name: 'metier',
          kind: 'dir',
          role: 'Couche métier : les règles et les transactions.',
          children: [{ name: 'CommandeService.java', kind: 'file', role: 'Règles de la commande, ouvre la transaction.' }],
        },
        {
          name: 'donnees',
          kind: 'dir',
          role: 'Couche d’accès aux données : entités et repositories.',
          children: [
            { name: 'CommandeRepository.java', kind: 'file', role: 'Interface Spring Data qui génère les requêtes SQL.' },
            { name: 'Commande.java', kind: 'file', role: 'Entité JPA, image d’une ligne de la table commande.' },
          ],
        },
      ],
    },
    { name: 'src/main/resources/application.yml', kind: 'file', role: 'Configuration Spring : base de données, port, profils.' },
    { name: 'pom.xml', kind: 'file', role: 'Manifeste Maven : dépendances (Spring Boot, JPA) et plugins de build.' },
  ],
  code: {
    language: 'java',
    filename: 'metier/CommandeService.java',
    source: `@Service
public class CommandeService {

    private final CommandeRepository commandes; // couche du dessous uniquement

    public CommandeService(CommandeRepository commandes) {
        this.commandes = commandes;
    }

    @Transactional // la couche métier porte la transaction
    public Commande valider(long commandeId) {
        Commande commande = commandes.findById(commandeId)
            .orElseThrow(() -> new CommandeIntrouvable(commandeId));

        // Règle métier : on ne valide pas une commande vide
        if (commande.getLignes().isEmpty()) {
            throw new CommandeVide(commandeId);
        }
        commande.setStatut(Statut.VALIDEE);
        return commande; // JPA écrit le changement au commit
    }
}

// À éviter : le contrôleur qui appelle directement le repository
// saute la couche métier et disperse les règles.`,
  },
  pitfalls: [
    'Le modèle anémique : des entités sans comportement et des services qui font tout, ce qui revient à des Transaction Scripts déguisés.',
    'La couche métier dépend de la couche données : changer d’ORM ou tester sans base devient difficile.',
    'Les couches « passe-plat » qui n’ajoutent rien et multiplient les fichiers.',
    'Ranger par couche à la racine : dans un gros projet, une fonctionnalité est éparpillée dans trois dossiers éloignés.',
  ],
  neighbors: ['transaction-script', 'hexagonale', 'mvc'],
  prerequisites: [
    { id: 'transaction-script', reason: 'Les couches naissent quand un script fait trop de choses : il faut d’abord voir ce point de départ.' },
  ],
  nextSteps: [
    { id: 'hexagonale', reason: 'L’hexagonale garde l’idée de séparation mais inverse la dépendance : le métier ne dépend plus de la base.' },
    { id: 'ddd', reason: 'Le DDD dit quoi mettre dans la couche métier pour qu’elle ne soit pas anémique.' },
    { id: 'monolithe', reason: 'Une application en couches est presque toujours déployée comme un monolithe : on voit ensuite comment la découper.' },
  ],
  quiz: [
    {
      question: 'Dans une architecture en couches stricte, la couche présentation peut appeler :',
      choices: ['Uniquement la couche métier', 'Directement la base de données', 'N’importe quelle couche', 'Aucune couche'],
      answer: 0,
      explanation: 'Chaque couche n’appelle que celle juste en dessous ; sauter une couche disperse les règles.',
    },
    {
      question: 'Quel est le défaut principal du modèle en couches classique ?',
      choices: [
        'Il est impossible à déployer',
        'La couche métier dépend de la couche d’accès aux données',
        'Il interdit les tests',
        'Il impose des microservices',
      ],
      answer: 1,
      explanation: 'Le métier importe les entités et repositories : il dépend de la technique, ce que l’hexagonale corrige.',
    },
    {
      question: 'Qu’appelle-t-on un modèle anémique ?',
      choices: [
        'Une base sans index',
        'Des objets métier qui ne contiennent que des données, sans comportement',
        'Une couche présentation sans CSS',
        'Un service sans tests',
      ],
      answer: 1,
      explanation: 'Les règles vivent dans les services ; les entités ne sont que des sacs de getters et setters.',
    },
    {
      question: 'Où placer la transaction base de données ?',
      choices: ['Dans le contrôleur', 'Dans la couche métier', 'Dans l’entité', 'Dans le template'],
      answer: 1,
      explanation: 'Le cas d’usage métier définit ce qui doit réussir ou échouer ensemble.',
    },
  ],
  linkedinPost:
    'Controller → Service → Repository. On l’a tous écrit. Le problème n’est pas les couches : c’est le sens de la flèche. Quand votre « métier » importe des entités JPA, c’est la base qui dicte le métier. Petit test : pouvez-vous tester une règle métier sans démarrer de base ?',
};
