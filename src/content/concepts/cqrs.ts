import type { ConceptSheet } from '../schema';

export const cqrs: ConceptSheet = {
  id: 'cqrs',
  kind: 'concept',
  title: 'CQRS',
  summary: 'Séparer le modèle qui écrit (les commandes) du modèle qui lit (les requêtes), chacun optimisé pour son usage.',
  problem:
    'Un même modèle sert mal deux usages opposés : l’écriture doit protéger des règles, la lecture doit assembler vite des écrans riches. CQRS (Command Query Responsibility Segregation, terme popularisé par Greg Young) les sépare : des commandes passent par le modèle métier, des requêtes lisent des vues taillées pour l’affichage.',
  whenToUse: [
    'Écrans de lecture très différents du modèle d’écriture (tableaux de bord, recherches, listes agrégées).',
    'Forte asymétrie lecture / écriture (beaucoup plus de lectures).',
    'Avec l’Event Sourcing, où les lectures se font sur des projections.',
  ],
  whenToAvoid: [
    'CRUD simple : deux modèles pour la même forme de données doublent le travail.',
    'Quand l’équipe n’est pas prête à gérer des lectures en cohérence à terme (si les vues sont mises à jour en asynchrone).',
  ],
  teamSize: 'De 3 à 30 développeurs ; souvent appliqué à une partie du système seulement, pas à toute l’application.',
  tree: [
    {
      name: 'src/Commandes.Api',
      kind: 'dir',
      role: 'Projet ASP.NET Core qui expose commandes et requêtes.',
      children: [
        {
          name: 'Ecriture',
          kind: 'dir',
          role: 'Côté commandes : intentions qui modifient l’état, via le modèle métier.',
          children: [
            { name: 'PasserCommande.cs', kind: 'file', role: 'Commande + handler : vérifie les règles et enregistre.' },
            { name: 'AnnulerCommande.cs', kind: 'file', role: 'Commande + handler d’annulation.' },
          ],
        },
        {
          name: 'Lecture',
          kind: 'dir',
          role: 'Côté requêtes : lectures directes, sans passer par le modèle métier.',
          children: [
            { name: 'HistoriqueClient.cs', kind: 'file', role: 'Requête + handler qui lit une vue SQL dénormalisée.' },
          ],
        },
        { name: 'Program.cs', kind: 'file', role: 'Enregistre MediatR et les routes HTTP.' },
        { name: 'Commandes.Api.csproj', kind: 'file', role: 'Projet .NET : dépendances (MediatR, EF Core, Dapper).' },
      ],
    },
    { name: 'sql/vue_historique_client.sql', kind: 'file', role: 'Vue de lecture qui assemble commandes, lignes et statut pour l’écran.' },
  ],
  code: {
    language: 'csharp',
    filename: 'Ecriture/PasserCommande.cs',
    source: `// CÔTÉ ÉCRITURE : une commande exprime une intention et passe par le métier.
public record PasserCommande(Guid ClientId, IReadOnlyList<Ligne> Lignes) : IRequest<Guid>;

public class PasserCommandeHandler : IRequestHandler<PasserCommande, Guid>
{
    private readonly BoutiqueDbContext _db;
    public PasserCommandeHandler(BoutiqueDbContext db) => _db = db;

    public async Task<Guid> Handle(PasserCommande cmd, CancellationToken ct)
    {
        var commande = Commande.Passer(cmd.ClientId, cmd.Lignes); // règles métier
        _db.Commandes.Add(commande);
        await _db.SaveChangesAsync(ct);
        return commande.Id; // une commande renvoie au plus un identifiant
    }
}

// CÔTÉ LECTURE : une requête ne modifie rien et lit une vue taillée pour l'écran.
public record HistoriqueClient(Guid ClientId) : IRequest<IReadOnlyList<LigneHistorique>>;

public class HistoriqueClientHandler : IRequestHandler<HistoriqueClient, IReadOnlyList<LigneHistorique>>
{
    private readonly IDbConnection _sql;
    public HistoriqueClientHandler(IDbConnection sql) => _sql = sql;

    public async Task<IReadOnlyList<LigneHistorique>> Handle(HistoriqueClient q, CancellationToken ct) =>
        (await _sql.QueryAsync<LigneHistorique>( // Dapper, sans passer par les entités
            "SELECT * FROM vue_historique_client WHERE client_id = @ClientId", q)).ToList();
}`,
  },
  pitfalls: [
    'Croire que CQRS impose deux bases de données ou l’Event Sourcing : on peut séparer les modèles sur une seule base.',
    'L’appliquer à tout le système au lieu des seules parties où lecture et écriture divergent.',
    'Oublier l’impact sur l’interface quand les vues sont mises à jour en asynchrone (l’utilisateur ne voit pas tout de suite son changement).',
    'Confondre CQRS avec l’usage d’une bibliothèque de médiateur.',
  ],
  neighbors: ['event-sourcing', 'ddd', 'vertical-slice'],
  prerequisites: [
    { id: 'ddd', reason: 'Les commandes CQRS portent des intentions métier et s’appuient sur des agrégats : le DDD donne ce vocabulaire.' },
  ],
  nextSteps: [
    { id: 'event-sourcing', reason: 'L’Event Sourcing pousse la séparation jusqu’au stockage : on écrit des événements et on lit des projections.' },
    { id: 'e-commerce', reason: 'Le catalogue d’une boutique en ligne est un cas concret où lecture et écriture n’ont pas les mêmes besoins.' },
  ],
  quiz: [
    {
      question: 'Que sépare CQRS ?',
      choices: [
        'Le front et le back',
        'Le modèle d’écriture (commandes) et le modèle de lecture (requêtes)',
        'Les environnements de test et de production',
        'Les microservices entre eux',
      ],
      answer: 1,
      explanation: 'Les commandes modifient via le métier, les requêtes lisent des vues dédiées.',
    },
    {
      question: 'CQRS impose-t-il deux bases de données ?',
      choices: ['Oui, toujours', 'Non, on peut séparer les modèles sur une seule base', 'Oui, avec Kafka', 'Seulement en .NET'],
      answer: 1,
      explanation: 'Une vue SQL dans la même base suffit souvent. Deux bases sont une option, pas la règle.',
    },
    {
      question: 'Une commande doit en principe :',
      choices: [
        'Renvoyer une liste de résultats',
        'Modifier l’état et renvoyer au plus un accusé ou un identifiant',
        'Ne rien modifier',
        'Lire directement la vue de lecture',
      ],
      answer: 1,
      explanation: 'Les commandes changent l’état ; les lectures passent par les requêtes.',
    },
    {
      question: 'Quel risque apparaît si les vues de lecture sont mises à jour en asynchrone ?',
      choices: [
        'Une perte de données',
        'L’utilisateur peut ne pas voir immédiatement sa modification',
        'Une faille de sécurité',
        'Une compilation plus lente',
      ],
      answer: 1,
      explanation: 'C’est la cohérence à terme : il faut l’assumer dans l’interface (message, rafraîchissement).',
    },
    {
      question: 'Où CQRS est-il le plus utile ?',
      choices: [
        'Formulaire de contact',
        'Tableau de bord qui agrège beaucoup de données métier',
        'Page « mentions légales »',
        'Script de migration',
      ],
      answer: 1,
      explanation: 'Quand l’écran de lecture est très différent du modèle qui écrit.',
    },
  ],
  linkedinPost:
    'CQRS en une phrase : le code qui écrit n’a pas à ressembler au code qui lit. Pas besoin de Kafka, ni de deux bases, ni d’Event Sourcing pour commencer. Une vue SQL pour vos écrans et un modèle métier pour vos écritures, c’est déjà du CQRS.',
};
