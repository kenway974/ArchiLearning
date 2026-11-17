import type { ConceptSheet } from '../schema';

export const verticalSlice: ConceptSheet = {
  id: 'vertical-slice',
  kind: 'concept',
  title: 'Vertical Slice Architecture',
  summary: 'Le code est découpé par fonctionnalité : chaque « tranche » contient tout ce qu’il faut pour un cas d’usage, de la requête HTTP à la base.',
  problem:
    'Dans une architecture en couches, une fonctionnalité est éparpillée dans trois dossiers et tout le monde touche aux mêmes fichiers. Le découpage vertical, popularisé dans l’écosystème .NET par Jimmy Bogard, regroupe le code qui change ensemble et laisse chaque tranche choisir sa complexité (simple requête SQL ici, modèle riche là).',
  whenToUse: [
    'Applications avec beaucoup de cas d’usage indépendants (API, back-offices).',
    'Équipe qui veut ajouter une fonctionnalité sans toucher au reste.',
    'Avec CQRS : une tranche = une commande ou une requête.',
  ],
  whenToAvoid: [
    'Quand les règles métier sont fortement partagées entre fonctionnalités : sans domaine commun, elles se dupliquent.',
    'Équipe qui n’est pas à l’aise pour repérer la duplication et extraire du code partagé au bon moment.',
  ],
  teamSize: 'De 2 à 20 développeurs ; très adapté aux équipes qui livrent fonctionnalité par fonctionnalité.',
  tree: [
    {
      name: 'src/Formations.Api',
      kind: 'dir',
      role: 'Projet ASP.NET Core découpé par fonctionnalité.',
      children: [
        {
          name: 'Features',
          kind: 'dir',
          role: 'Un dossier par fonctionnalité métier.',
          children: [
            {
              name: 'Inscriptions',
              kind: 'dir',
              role: 'Tout ce qui concerne les inscriptions aux formations.',
              children: [
                { name: 'InscrireApprenant.cs', kind: 'file', role: 'Tranche complète : route, validation, handler, accès base.' },
                { name: 'ListerInscriptions.cs', kind: 'file', role: 'Tranche de lecture : route et requête SQL directe.' },
              ],
            },
            {
              name: 'Sessions',
              kind: 'dir',
              role: 'Planification des sessions de formation.',
              children: [{ name: 'PlanifierSession.cs', kind: 'file', role: 'Tranche complète de planification.' }],
            },
          ],
        },
        { name: 'Infrastructure/AppDbContext.cs', kind: 'file', role: 'Accès base partagé par les tranches (EF Core).' },
        { name: 'Program.cs', kind: 'file', role: 'Démarrage : enregistre les routes de chaque tranche.' },
        { name: 'Formations.Api.csproj', kind: 'file', role: 'Projet .NET et ses dépendances (EF Core, FluentValidation).' },
      ],
    },
  ],
  code: {
    language: 'csharp',
    filename: 'Features/Inscriptions/InscrireApprenant.cs',
    source: `// Une tranche verticale : tout le cas d'usage dans un fichier.
public static class InscrireApprenant
{
    public record Requete(Guid SessionId, string Email);

    // Validation propre à cette fonctionnalité
    public class Validateur : AbstractValidator<Requete>
    {
        public Validateur() => RuleFor(r => r.Email).EmailAddress();
    }

    // Route HTTP déclarée à côté de sa logique
    public static void Map(IEndpointRouteBuilder app) =>
        app.MapPost("/sessions/{sessionId}/inscriptions", Traiter);

    private static async Task<IResult> Traiter(Requete req, AppDbContext db)
    {
        var session = await db.Sessions.FindAsync(req.SessionId);
        if (session is null) return Results.NotFound();
        if (session.EstComplete()) return Results.Conflict("Session complète");

        db.Inscriptions.Add(new Inscription(req.SessionId, req.Email));
        await db.SaveChangesAsync();
        return Results.Created($"/sessions/{req.SessionId}/inscriptions", null);
    }
}`,
  },
  pitfalls: [
    'Copier la même règle métier dans dix tranches : quand une règle est partagée, elle va dans le domaine.',
    'Des tranches qui s’appellent entre elles : elles doivent rester indépendantes.',
    'Croire qu’il n’y a plus besoin de conception : chaque tranche doit quand même rester propre.',
  ],
  neighbors: ['clean-onion', 'cqrs'],
  prerequisites: [
    { id: 'architecture-en-couches', reason: 'Le découpage vertical se comprend en opposition au découpage horizontal par couches.' },
  ],
  nextSteps: [
    { id: 'cqrs', reason: 'Une tranche correspond naturellement à une commande ou à une requête.' },
    { id: 'monolithe-modulaire', reason: 'Les tranches se regroupent en modules quand l’application grandit.' },
  ],
  quiz: [
    {
      question: 'Selon quel axe le code est-il découpé ?',
      choices: ['Par couche technique', 'Par fonctionnalité', 'Par développeur', 'Par table'],
      answer: 1,
      explanation: 'Chaque tranche regroupe tout ce qui sert une fonctionnalité.',
    },
    {
      question: 'Quel est l’avantage principal ?',
      choices: [
        'Moins de tests',
        'Une fonctionnalité se modifie à un seul endroit, sans toucher les autres',
        'Pas de base de données',
        'Déploiement en microservices automatique',
      ],
      answer: 1,
      explanation: 'Le code qui change ensemble est rangé ensemble.',
    },
    {
      question: 'Quel est le risque principal ?',
      choices: ['La lenteur', 'La duplication de règles métier partagées', 'L’impossibilité de tester', 'Le verrouillage fournisseur'],
      answer: 1,
      explanation: 'Une règle commune doit être extraite dans un modèle partagé au bon moment.',
    },
    {
      question: 'Avec quel concept se combine-t-il naturellement ?',
      choices: ['CQRS', 'Serverless uniquement', 'Microkernel', 'Pipes and filters'],
      answer: 0,
      explanation: 'Une tranche = une commande ou une requête.',
    },
  ],
  linkedinPost:
    'Pour ajouter un champ à un formulaire, combien de dossiers ouvrez-vous ? Controllers, Services, Repositories, DTOs, Mappers… Le découpage vertical pose une question simple : et si le code qui change ensemble était rangé ensemble ?',
};
