import type { Principle } from './schema';

/** Principes partagés par plusieurs concepts. Chaque concept qui l'applique dit comment. */
export const principles: Principle[] = [
  {
    id: 'separation-des-responsabilites',
    title: 'Séparation des responsabilités',
    summary: 'Chaque partie du code a une seule raison de changer : l’affichage, les règles métier et l’accès aux données ne se mélangent pas.',
    why: 'Quand une modification de l’interface oblige à toucher au SQL, chaque changement devient risqué. Séparer les responsabilités limite la portée d’un changement et permet à plusieurs personnes de travailler en parallèle.',
    color: '#2b59c3',
    applications: [
      { concept: 'architecture-en-couches', how: 'Une couche par responsabilité : présentation, métier, accès aux données.' },
      { concept: 'mvc', how: 'Le contrôleur reçoit la requête, le modèle porte les données, la vue affiche.' },
      { concept: 'hexagonale', how: 'Le métier au centre, la technique dans des adaptateurs autour.' },
      { concept: 'clean-onion', how: 'Des anneaux distincts : entités, cas d’usage, interfaces, infrastructure.' },
    ],
  },
  {
    id: 'inversion-des-dependances',
    title: 'Inversion des dépendances',
    summary: 'Le code important ne dépend pas des détails : il définit une interface, et ce sont les détails qui s’y conforment.',
    why: 'Si le métier dépend de la base ou d’un fournisseur, changer de base ou tester sans elle devient difficile. En inversant la dépendance, on remplace un détail sans toucher au cœur.',
    color: '#7a2fb5',
    applications: [
      { concept: 'hexagonale', how: 'Le domaine définit des ports ; les adaptateurs (base, HTTP) les implémentent.' },
      { concept: 'clean-onion', how: 'Les dépendances du code source pointent toujours vers le centre.' },
      { concept: 'microkernel', how: 'Le noyau définit le contrat de plugin ; les plugins s’y conforment, jamais l’inverse.' },
    ],
  },
  {
    id: 'decoupage-par-domaine',
    title: 'Découpage par domaine métier',
    summary: 'Les frontières du code suivent celles du métier (commandes, stock, facturation), pas celles de la technique.',
    why: 'Un découpage par couche technique oblige à tout modifier pour chaque fonctionnalité. Un découpage par domaine garde ensemble ce qui change ensemble et permet à une équipe de posséder un domaine.',
    color: '#0b6b3a',
    applications: [
      { concept: 'ddd', how: 'Les contextes délimités fixent les frontières, chacun avec son propre modèle.' },
      { concept: 'monolithe-modulaire', how: 'Un module par domaine, avec ses données et une API publique.' },
      { concept: 'microservices', how: 'Un service par domaine, déployé et maintenu par une équipe.' },
    ],
  },
  {
    id: 'decoupage-par-cas-dusage',
    title: 'Découpage par cas d’usage',
    summary: 'Chaque action utilisateur (passer une commande, annuler) est un bloc de code complet et autonome.',
    why: 'Le code d’une fonctionnalité est trouvé et modifié à un seul endroit, sans risque de casser les autres. C’est simple à lire, au prix d’un risque de duplication des règles communes.',
    color: '#a3214f',
    applications: [
      { concept: 'transaction-script', how: 'Une procédure par action, de la validation à l’écriture en base.' },
      { concept: 'vertical-slice', how: 'Une tranche par fonctionnalité, de la route HTTP à la base.' },
      { concept: 'cqrs', how: 'Chaque commande et chaque requête a son propre handler.' },
    ],
  },
  {
    id: 'separer-lecture-ecriture',
    title: 'Séparer lecture et écriture',
    summary: 'Le modèle qui modifie les données n’est pas celui qui les affiche : chacun est optimisé pour son usage.',
    why: 'Écrire demande de protéger des règles, lire demande d’assembler vite des écrans. Un seul modèle fait mal les deux ; les séparer simplifie chacun.',
    color: '#8a4b08',
    applications: [
      { concept: 'cqrs', how: 'Des commandes qui passent par le métier, des requêtes qui lisent des vues dédiées.' },
      { concept: 'event-sourcing', how: 'On écrit des événements ; on lit des projections construites à partir d’eux.' },
    ],
  },
  {
    id: 'communication-par-evenements',
    title: 'Communication par événements',
    summary: 'Un composant annonce ce qui s’est passé (« commande passée ») ; les autres réagissent sans qu’il les connaisse.',
    why: 'L’émetteur n’a pas à connaître ni à attendre ceux qui réagissent : on ajoute une réaction sans le modifier, et une panne d’un abonné ne bloque pas l’émetteur.',
    color: '#0e7490',
    applications: [
      { concept: 'architecture-evenementielle', how: 'C’est son principe central : publier des événements, s’y abonner.' },
      { concept: 'event-sourcing', how: 'Les événements sont la source de vérité, et peuvent aussi être publiés.' },
      { concept: 'serverless', how: 'Chaque fonction est déclenchée par un événement (requête, fichier, message).' },
      { concept: 'microservices', how: 'Les services échangent des événements pour limiter les appels en cascade.' },
    ],
  },
  {
    id: 'composition-dunites',
    title: 'Composition d’unités indépendantes',
    summary: 'Le système est un assemblage de petites pièces qui font une seule chose et respectent un contrat simple.',
    why: 'Des pièces indépendantes se remplacent, se réordonnent et se testent séparément ; ajouter une capacité revient à ajouter une pièce.',
    color: '#4d7c0f',
    applications: [
      { concept: 'pipes-and-filters', how: 'Des filtres indépendants enchaînés par des canaux.' },
      { concept: 'microkernel', how: 'Des plugins indépendants branchés sur un noyau minimal.' },
      { concept: 'serverless', how: 'Des fonctions courtes, chacune pour un traitement.' },
    ],
  },
  {
    id: 'coherence-a-terme',
    title: 'Cohérence à terme',
    summary: 'Toutes les données ne sont pas à jour au même instant : elles le deviennent après un court délai.',
    why: 'Accepter un délai permet de découpler les composants et de tenir la charge, mais l’interface et le métier doivent l’assumer (un utilisateur peut ne pas voir tout de suite son changement).',
    color: '#b45309',
    applications: [
      { concept: 'cqrs', how: 'Les vues de lecture peuvent être mises à jour après l’écriture.' },
      { concept: 'architecture-evenementielle', how: 'Les abonnés traitent l’événement après sa publication.' },
      { concept: 'microservices', how: 'Chaque service a ses données ; elles se synchronisent par messages, pas par transaction commune.' },
    ],
  },
  {
    id: 'un-seul-deploiement',
    title: 'Un seul déploiement',
    summary: 'Toute l’application est construite et mise en production d’un bloc.',
    why: 'Un build, un déploiement, des transactions simples et des appels de fonction au lieu d’appels réseau : l’exploitation reste simple tant qu’une équipe ou quelques-unes travaillent dessus.',
    color: '#475569',
    applications: [
      { concept: 'monolithe', how: 'C’est sa définition : une seule unité déployée.' },
      { concept: 'monolithe-modulaire', how: 'Un seul déploiement, mais des modules aux frontières strictes à l’intérieur.' },
    ],
  },
];
