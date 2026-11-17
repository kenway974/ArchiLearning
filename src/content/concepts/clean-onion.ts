import type { ConceptSheet } from '../schema';

export const cleanOnion: ConceptSheet = {
  id: 'clean-onion',
  kind: 'concept',
  title: 'Clean / Onion Architecture',
  summary: 'Des cercles concentriques : entités au centre, cas d’usage autour, puis interfaces et infrastructure ; les dépendances pointent toujours vers le centre.',
  problem:
    'Comme l’hexagonale, protéger le métier de la technique, mais avec un découpage explicite en anneaux et une règle unique : rien au centre ne connaît l’extérieur. Onion Architecture a été décrite par Jeffrey Palermo (2008), Clean Architecture par Robert C. Martin (2012).',
  whenToUse: [
    'Applications d’entreprise durables avec plusieurs interfaces (API, tâches, interface web).',
    'Écosystème .NET ou Java où des modèles de projet Clean Architecture sont répandus.',
    'Équipes qui veulent une règle de dépendance vérifiable par le compilateur (un projet par anneau).',
  ],
  whenToAvoid: [
    'Petites applications : quatre projets et des mappings partout pour peu de règles.',
    'Quand l’équipe suit le schéma à la lettre sans comprendre la règle de dépendance.',
  ],
  teamSize: 'De 4 à 30 développeurs ; très présente dans les entreprises .NET et Java.',
  tree: [
    {
      name: 'src',
      kind: 'dir',
      role: 'Un projet .NET par anneau : le compilateur interdit les dépendances vers l’extérieur.',
      children: [
        {
          name: 'Domain',
          kind: 'dir',
          role: 'Anneau central : entités et règles, aucune référence à un autre projet.',
          children: [
            { name: 'Domain.csproj', kind: 'file', role: 'Projet sans dépendance : garantit que le domaine reste pur.' },
            { name: 'Entities/Facture.cs', kind: 'file', role: 'Entité Facture et sa règle d’échéance.' },
          ],
        },
        {
          name: 'Application',
          kind: 'dir',
          role: 'Cas d’usage et interfaces des services externes ; référence Domain uniquement.',
          children: [
            { name: 'Application.csproj', kind: 'file', role: 'Référence le projet Domain.' },
            { name: 'Factures/EmettreFacture.cs', kind: 'file', role: 'Cas d’usage « émettre une facture ».' },
            { name: 'Abstractions/IFactureRepository.cs', kind: 'file', role: 'Interface implémentée par l’infrastructure.' },
          ],
        },
        {
          name: 'Infrastructure',
          kind: 'dir',
          role: 'Détails techniques : Entity Framework, e-mail, fichiers.',
          children: [
            { name: 'Infrastructure.csproj', kind: 'file', role: 'Référence Application et les paquets techniques (EF Core).' },
            { name: 'Persistence/FactureRepository.cs', kind: 'file', role: 'Implémente IFactureRepository avec EF Core.' },
          ],
        },
        {
          name: 'Web',
          kind: 'dir',
          role: 'Anneau extérieur : API ASP.NET Core et composition des dépendances.',
          children: [
            { name: 'Web.csproj', kind: 'file', role: 'Point d’entrée ; référence Application et Infrastructure.' },
            { name: 'Program.cs', kind: 'file', role: 'Enregistre les implémentations dans le conteneur d’injection.' },
          ],
        },
      ],
    },
    { name: 'Facturation.sln', kind: 'file', role: 'Solution .NET qui regroupe les quatre projets.' },
  ],
  code: {
    language: 'csharp',
    filename: 'src/Application/Factures/EmettreFacture.cs',
    source: `// Anneau Application : dépend du Domain, ne connaît ni EF Core ni ASP.NET.
public sealed class EmettreFacture
{
    private readonly IFactureRepository _factures; // interface définie ICI
    private readonly IHorloge _horloge;            // même le temps est abstrait

    public EmettreFacture(IFactureRepository factures, IHorloge horloge)
    {
        _factures = factures;
        _horloge = horloge;
    }

    public async Task<Guid> Executer(Guid clientId, decimal montant)
    {
        // Règle métier portée par l'entité du Domain
        var facture = Facture.Emettre(clientId, montant, _horloge.Aujourdhui());
        await _factures.Ajouter(facture);
        return facture.Id;
    }
}

// Infrastructure/Persistence/FactureRepository.cs implémente IFactureRepository.
// Web/Program.cs : builder.Services.AddScoped<IFactureRepository, FactureRepository>();`,
  },
  pitfalls: [
    'Mapper trois fois le même objet (entité, DTO applicatif, DTO web) sans raison.',
    'Le domaine qui référence un paquet technique « juste pour un attribut » : la règle est cassée.',
    'Confondre Clean Architecture et dossiers : c’est la direction des dépendances qui compte, pas le nom des dossiers.',
  ],
  neighbors: ['hexagonale', 'vertical-slice'],
  prerequisites: [
    { id: 'hexagonale', reason: 'Clean et Onion reprennent l’idée des ports et adaptateurs : l’hexagonale est la version la plus simple à saisir.' },
  ],
  nextSteps: [
    { id: 'vertical-slice', reason: 'Vertical Slice propose l’inverse : découper par fonctionnalité plutôt que par anneau.' },
    { id: 'ddd', reason: 'Le DDD dit comment modéliser l’anneau central.' },
  ],
  quiz: [
    {
      question: 'Quelle est la règle fondamentale de la Clean Architecture ?',
      choices: [
        'Un fichier par classe',
        'Les dépendances du code source pointent vers le centre',
        'Une base de données par anneau',
        'Pas plus de quatre anneaux',
      ],
      answer: 1,
      explanation: 'C’est la règle de dépendance : l’intérieur ne connaît jamais l’extérieur.',
    },
    {
      question: 'Pourquoi un projet .NET par anneau ?',
      choices: [
        'Pour compiler plus vite',
        'Pour que le compilateur interdise les dépendances interdites',
        'Pour déployer chaque anneau séparément',
        'C’est imposé par Visual Studio',
      ],
      answer: 1,
      explanation: 'Si Domain ne référence aucun projet, il est impossible d’y utiliser EF Core par erreur.',
    },
    {
      question: 'Où est définie l’interface IFactureRepository ?',
      choices: ['Infrastructure', 'Application (ou Domain)', 'Web', 'Dans la base'],
      answer: 1,
      explanation: 'L’anneau intérieur définit le besoin ; l’infrastructure l’implémente.',
    },
    {
      question: 'Différence principale avec l’hexagonale ?',
      choices: [
        'Aucune règle commune',
        'Même règle de dépendance, découpage plus détaillé en anneaux',
        'Clean impose des microservices',
        'L’hexagonale interdit les tests',
      ],
      answer: 1,
      explanation: 'Ce sont des cousines : même inversion de dépendance, vocabulaire et découpage différents.',
    },
  ],
  linkedinPost:
    'Hexagonale, Onion, Clean : trois noms, une seule règle. « Le code du centre ne connaît pas le code de l’extérieur. » Le reste, c’est du vocabulaire et du découpage. Si votre projet Domain référence Entity Framework, vous n’avez pas une Clean Architecture, vous avez des dossiers bien nommés.',
};
