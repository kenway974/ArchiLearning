import type { ConceptSheet } from '../schema';

export const microservices: ConceptSheet = {
  id: 'microservices',
  kind: 'concept',
  title: 'Microservices',
  summary: 'Le système est découpé en services indépendants, chacun avec ses données, déployé séparément et maintenu par une équipe.',
  problem:
    'Permettre à de nombreuses équipes de livrer sans se coordonner sur un déploiement commun, et faire passer à l’échelle chaque partie selon sa charge. Le prix : un système distribué, avec réseau, pannes partielles, cohérence à terme et observabilité à mettre en place.',
  whenToUse: [
    'Plusieurs équipes autonomes, chacune responsable d’un domaine.',
    'Parties du système aux besoins de charge, de disponibilité ou de cycle de livraison très différents.',
    'Organisation capable d’exploiter un système distribué (CI/CD, supervision, traçage, astreinte).',
  ],
  whenToAvoid: [
    'Petite équipe ou produit en démarrage : le coût opérationnel dépasse le gain.',
    'Frontières métier encore floues : on fige de mauvais découpages dans le réseau.',
    'Quand tous les services doivent être déployés ensemble (« monolithe distribué »).',
  ],
  teamSize: 'Plutôt au-delà de quelques équipes (dizaines ou centaines de développeurs) ; Netflix, Amazon ou la banque en ligne Monzo ont décrit publiquement des architectures à base de nombreux services.',
  tree: [
    {
      name: 'services',
      kind: 'dir',
      role: 'Un dossier (souvent un dépôt) par service, chacun déployable seul.',
      children: [
        {
          name: 'paiements',
          kind: 'dir',
          role: 'Service Paiements : sa propre base, sa propre API.',
          children: [
            { name: 'cmd/server/main.go', kind: 'file', role: 'Point d’entrée : démarre le serveur HTTP du service.' },
            { name: 'internal/paiement/handler.go', kind: 'file', role: 'Handlers HTTP du service.' },
            { name: 'go.mod', kind: 'file', role: 'Module Go du service : son nom et ses dépendances, versionnés à part.' },
            { name: 'Dockerfile', kind: 'file', role: 'Image du service, déployée indépendamment.' },
          ],
        },
        {
          name: 'commandes',
          kind: 'dir',
          role: 'Service Commandes : appelle Paiements par le réseau.',
          children: [
            { name: 'internal/client/paiements.go', kind: 'file', role: 'Client HTTP vers Paiements, avec délai maximal.' },
            { name: 'go.mod', kind: 'file', role: 'Module Go du service Commandes.' },
          ],
        },
      ],
    },
    { name: 'deploy/k8s', kind: 'dir', role: 'Manifestes Kubernetes : un déploiement par service.', children: [
      { name: 'paiements.yaml', kind: 'file', role: 'Déploiement, service et réplicas du service Paiements.' },
    ] },
  ],
  code: {
    language: 'go',
    filename: 'services/commandes/internal/client/paiements.go',
    source: `package client

import (
	"context"
	"fmt"
	"net/http"
	"time"
)

// Appeler un autre service = un appel réseau qui peut échouer ou traîner.
type Paiements struct {
	baseURL string
	http    *http.Client
}

func NewPaiements(baseURL string) *Paiements {
	// Toujours un délai maximal : sans lui, une panne de Paiements bloque Commandes.
	return &Paiements{baseURL: baseURL, http: &http.Client{Timeout: 2 * time.Second}}
}

func (p *Paiements) Statut(ctx context.Context, paiementID string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		fmt.Sprintf("%s/paiements/%s", p.baseURL, paiementID), nil)
	if err != nil {
		return "", err
	}
	res, err := p.http.Do(req)
	if err != nil {
		// Panne partielle : à gérer (nouvelle tentative, valeur par défaut, erreur claire)
		return "", fmt.Errorf("service paiements indisponible: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("paiements a répondu %d", res.StatusCode)
	}
	return "payé", nil // décodage JSON omis pour la lisibilité
}`,
  },
  pitfalls: [
    'Le monolithe distribué : des services qui doivent être déployés ensemble et s’appellent en chaîne.',
    'Une base partagée entre services : on garde le couplage et on ajoute le réseau.',
    'Pas d’observabilité (traces, logs corrélés) : un incident devient une enquête dans dix services.',
    'Découper trop tôt, avant de connaître les frontières métier.',
    'Les appels synchrones en cascade : la disponibilité de l’ensemble chute à chaque service ajouté.',
  ],
  neighbors: ['monolithe-modulaire', 'architecture-evenementielle', 'serverless'],
  prerequisites: [
    { id: 'monolithe-modulaire', reason: 'On extrait un service d’un module bien délimité : sans modules, on découpe au hasard.' },
    { id: 'ddd', reason: 'Les contextes délimités du DDD donnent les frontières des services.' },
  ],
  nextSteps: [
    { id: 'architecture-evenementielle', reason: 'Les événements réduisent le couplage entre services par rapport aux appels synchrones.' },
    { id: 'serverless', reason: 'Le serverless pousse le découpage jusqu’à la fonction, en déléguant l’infrastructure.' },
    { id: 'banque-fintech', reason: 'Les néobanques sont un exemple public d’architectures en microservices.' },
  ],
  quiz: [
    {
      question: 'Quelle règle sur les données est essentielle ?',
      choices: [
        'Une base partagée par tous',
        'Chaque service possède ses données',
        'Pas de base du tout',
        'Une base par développeur',
      ],
      answer: 1,
      explanation: 'Une base partagée recrée le couplage que les services devaient supprimer.',
    },
    {
      question: 'Qu’est-ce qu’un « monolithe distribué » ?',
      choices: [
        'Un monolithe hébergé dans le cloud',
        'Des services qu’on ne peut déployer qu’ensemble',
        'Un monolithe modulaire',
        'Un service par pays',
      ],
      answer: 1,
      explanation: 'On a les inconvénients des deux : couplage du monolithe et complexité du réseau.',
    },
    {
      question: 'Pourquoi un délai maximal (timeout) sur chaque appel ?',
      choices: [
        'Pour réduire la facture',
        'Pour qu’une panne d’un service ne bloque pas les autres',
        'Pour chiffrer les échanges',
        'C’est imposé par Go',
      ],
      answer: 1,
      explanation: 'Sans timeout, les requêtes s’accumulent et la panne se propage.',
    },
    {
      question: 'Quand les microservices sont-ils un mauvais choix ?',
      choices: [
        'Plusieurs équipes autonomes',
        'Une équipe de trois personnes qui démarre un produit',
        'Des charges très différentes selon les domaines',
        'Des cycles de livraison indépendants',
      ],
      answer: 1,
      explanation: 'Le coût d’exploitation d’un système distribué écrase les bénéfices à cette taille.',
    },
    {
      question: 'Quel outil devient indispensable ?',
      choices: ['Un traitement de texte', 'Le traçage distribué et des logs corrélés', 'Un CMS', 'Un ORM'],
      answer: 1,
      explanation: 'Pour suivre une requête à travers plusieurs services lors d’un incident.',
    },
  ],
  linkedinPost:
    'Les microservices résolvent un problème d’organisation avant un problème technique : permettre à 20 équipes de livrer sans se marcher dessus. Vous êtes 4 ? Vous venez d’acheter un problème de système distribué pour résoudre un problème que vous n’avez pas.',
};
