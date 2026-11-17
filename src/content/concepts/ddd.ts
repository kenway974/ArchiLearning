import type { ConceptSheet } from '../schema';

export const ddd: ConceptSheet = {
  id: 'ddd',
  kind: 'concept',
  title: 'Domain-Driven Design (DDD)',
  summary: 'Le code parle la langue du métier : on modélise le domaine avec les experts, on le découpe en contextes délimités et on y place les règles.',
  problem:
    'Les logiciels complexes échouent souvent parce que le code ne reflète pas le métier. Le DDD, décrit par Eric Evans (2003), aligne vocabulaire, modèle et découpage du code sur le domaine : langage omniprésent, contextes délimités (bounded contexts), agrégats, objets valeur.',
  whenToUse: [
    'Domaine complexe où l’essentiel de la valeur est dans les règles : assurance, banque, logistique, tarification.',
    'Accès réel aux experts métier.',
    'Pour découper un système en modules ou services cohérents (contextes délimités).',
  ],
  whenToAvoid: [
    'CRUD et sites de contenu : les patterns tactiques (agrégats, dépôts) n’apportent rien.',
    'Pas d’accès aux experts métier : on modélise des suppositions.',
    'Quand on n’en retient que le vocabulaire technique (Entity, Repository) sans le travail de modélisation.',
  ],
  teamSize: 'De 5 à plusieurs centaines de développeurs ; le découpage stratégique sert surtout quand plusieurs équipes travaillent sur le même système.',
  tree: [
    {
      name: 'src/main/kotlin/fr/assureur',
      kind: 'dir',
      role: 'Un dossier par contexte délimité, pas par couche technique.',
      children: [
        {
          name: 'souscription',
          kind: 'dir',
          role: 'Contexte « Souscription » : devis et contrats, avec son propre vocabulaire.',
          children: [
            {
              name: 'domaine',
              kind: 'dir',
              role: 'Modèle du contexte : agrégats, objets valeur, événements.',
              children: [
                { name: 'Contrat.kt', kind: 'file', role: 'Agrégat Contrat : protège ses invariants (dates, garanties).' },
                { name: 'Prime.kt', kind: 'file', role: 'Objet valeur Prime : montant et devise, immuable.' },
                { name: 'ContratRepository.kt', kind: 'file', role: 'Interface de dépôt : charger et sauver un agrégat entier.' },
              ],
            },
            { name: 'application', kind: 'dir', role: 'Cas d’usage du contexte (souscrire, résilier).', children: [
              { name: 'Souscrire.kt', kind: 'file', role: 'Cas d’usage qui crée un Contrat à partir d’un devis.' },
            ] },
          ],
        },
        {
          name: 'sinistres',
          kind: 'dir',
          role: 'Contexte « Sinistres » : un « contrat » y est vu autrement, avec seulement les infos utiles.',
          children: [{ name: 'domaine/Declaration.kt', kind: 'file', role: 'Agrégat Déclaration de sinistre.' }],
        },
      ],
    },
    { name: 'build.gradle.kts', kind: 'file', role: 'Build Gradle en Kotlin : dépendances et plugins.' },
  ],
  code: {
    language: 'kotlin',
    filename: 'souscription/domaine/Contrat.kt',
    source: `// Objet valeur : défini par sa valeur, immuable, valide dès sa création
@JvmInline
value class Prime(val centimes: Long) {
    init { require(centimes > 0) { "Une prime est positive" } }
}

// Agrégat : la seule porte d'entrée pour modifier un contrat
class Contrat private constructor(
    val id: ContratId,
    private val garanties: MutableSet<Garantie>,
    var statut: Statut,
) {
    // Le langage du métier : « ajouter une garantie », pas « setGaranties »
    fun ajouterGarantie(garantie: Garantie) {
        check(statut == Statut.ACTIF) { "Contrat résilié : modification impossible" }
        garanties += garantie // l'invariant est protégé ici, nulle part ailleurs
    }

    fun resilier(motif: MotifResiliation): ContratResilie {
        statut = Statut.RESILIE
        return ContratResilie(id, motif) // événement du domaine
    }

    companion object {
        fun souscrire(devis: Devis): Contrat =
            Contrat(ContratId.nouveau(), devis.garanties.toMutableSet(), Statut.ACTIF)
    }
}`,
  },
  pitfalls: [
    'Le « DDD de vocabulaire » : des classes nommées Aggregate et Repository autour d’un modèle anémique.',
    'Un modèle unique pour toute l’entreprise : un « Client » ne veut pas dire la même chose en facturation et au support.',
    'Des agrégats trop gros qui chargent la moitié de la base et se bloquent entre eux.',
    'Sauter la partie stratégique (contextes, langage) pour ne garder que les patterns de code.',
  ],
  neighbors: ['hexagonale', 'cqrs', 'monolithe-modulaire'],
  prerequisites: [
    { id: 'architecture-en-couches', reason: 'Le DDD remplit la couche métier : il faut savoir ce qu’est une couche métier anémique pour voir ce qu’il apporte.' },
  ],
  nextSteps: [
    { id: 'cqrs', reason: 'Quand un agrégat sert mal les écrans de lecture, CQRS sépare écriture et lecture.' },
    { id: 'monolithe-modulaire', reason: 'Les contextes délimités donnent les frontières naturelles des modules.' },
    { id: 'hexagonale', reason: 'L’hexagonale protège le modèle du domaine de la technique.' },
  ],
  quiz: [
    {
      question: 'Qu’est-ce qu’un contexte délimité (bounded context) ?',
      choices: [
        'Un serveur dédié',
        'Une frontière à l’intérieur de laquelle un modèle et son vocabulaire sont cohérents',
        'Un schéma de base de données',
        'Une équipe Scrum',
      ],
      answer: 1,
      explanation: '« Contrat » peut avoir un sens en souscription et un autre en sinistres : chaque contexte a son modèle.',
    },
    {
      question: 'Quel est le rôle d’un agrégat ?',
      choices: [
        'Faire des statistiques',
        'Garantir les invariants d’un groupe d’objets modifiés ensemble',
        'Remplacer la base de données',
        'Exposer une API REST',
      ],
      answer: 1,
      explanation: 'On ne modifie l’agrégat que par sa racine, qui vérifie les règles.',
    },
    {
      question: 'Un objet valeur se caractérise par :',
      choices: ['Un identifiant unique', 'Sa valeur et son immutabilité', 'Sa table en base', 'Son cycle de vie long'],
      answer: 1,
      explanation: 'Deux primes de 100 € sont égales ; on remplace la valeur au lieu de la modifier.',
    },
    {
      question: 'Quand le DDD est-il un mauvais investissement ?',
      choices: ['Assurance', 'Tarification complexe', 'Site vitrine', 'Logistique multi-entrepôts'],
      answer: 2,
      explanation: 'Sans complexité métier, la modélisation n’a rien à capturer.',
    },
    {
      question: 'Le langage omniprésent (ubiquitous language), c’est :',
      choices: [
        'Utiliser l’anglais partout',
        'Le même vocabulaire métier dans les échanges et dans le code',
        'Un langage de programmation unique',
        'Une documentation exhaustive',
      ],
      answer: 1,
      explanation: 'Si l’expert dit « résilier », le code a une méthode resilier(), pas updateStatus(3).',
    },
  ],
  linkedinPost:
    'Le DDD n’est pas un dossier « domain » avec des classes Aggregate. C’est d’abord une conversation : « que veut dire “contrat” pour vous ? » Et la réponse change selon le service. C’est ça, un bounded context. Le code vient après.',
};
