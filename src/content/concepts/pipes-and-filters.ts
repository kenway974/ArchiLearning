import type { ConceptSheet } from '../schema';

export const pipesAndFilters: ConceptSheet = {
  id: 'pipes-and-filters',
  kind: 'concept',
  title: 'Pipes and filters',
  summary: 'Un traitement est découpé en étapes indépendantes (filtres) reliées par des canaux (pipes) : chaque étape lit une entrée, la transforme et la passe à la suivante.',
  problem:
    'Rendre un traitement de données lisible, réutilisable et parallélisable : chaque filtre fait une seule chose, on les réordonne ou on en ajoute sans toucher aux autres. C’est l’idée des pipes Unix (cat | grep | sort), des pipelines ETL et des chaînes de compilation.',
  whenToUse: [
    'Traitements de données en étapes : import, nettoyage, enrichissement, export.',
    'Flux continus (logs, capteurs) à transformer au fil de l’eau.',
    'Chaînes de build, compilateurs, traitements d’images ou de médias.',
  ],
  whenToAvoid: [
    'Logique interactive avec beaucoup d’allers-retours entre étapes.',
    'Quand les étapes ont besoin d’un état partagé important : elles ne sont plus indépendantes.',
  ],
  teamSize: 'Toutes tailles ; de la commande shell d’un développeur aux plateformes de données de grandes entreprises.',
  tree: [
    {
      name: 'cmd/import-ventes/main.go',
      kind: 'file',
      role: 'Assemble le pipeline : lecture → nettoyage → enrichissement → écriture.',
    },
    {
      name: 'internal/filtres',
      kind: 'dir',
      role: 'Un fichier par filtre ; chacun lit un canal et écrit dans un autre.',
      children: [
        { name: 'lire.go', kind: 'file', role: 'Source : lit le fichier CSV ligne par ligne.' },
        { name: 'nettoyer.go', kind: 'file', role: 'Filtre : écarte les lignes invalides.' },
        { name: 'convertir.go', kind: 'file', role: 'Filtre : convertit les montants en centimes.' },
      ],
    },
    { name: 'go.mod', kind: 'file', role: 'Module Go : nom du module et version de Go.' },
  ],
  code: {
    language: 'go',
    filename: 'cmd/import-ventes/main.go',
    source: `package main

import (
	"fmt"
	"strings"
)

// Un filtre : lit un canal d'entrée, écrit dans un canal de sortie, ne connaît rien d'autre.
func nettoyer(entree <-chan string) <-chan string {
	sortie := make(chan string)
	go func() {
		defer close(sortie) // fermer le canal signale la fin au filtre suivant
		for ligne := range entree {
			if strings.TrimSpace(ligne) != "" {
				sortie <- ligne
			}
		}
	}()
	return sortie
}

func enMajuscules(entree <-chan string) <-chan string {
	sortie := make(chan string)
	go func() {
		defer close(sortie)
		for ligne := range entree {
			sortie <- strings.ToUpper(ligne)
		}
	}()
	return sortie
}

func main() {
	source := make(chan string)
	go func() {
		defer close(source)
		for _, l := range []string{"vente a", "", "vente b"} {
			source <- l
		}
	}()

	// Le pipeline se lit comme une phrase : chaque étape tourne en parallèle.
	for ligne := range enMajuscules(nettoyer(source)) {
		fmt.Println(ligne)
	}
}`,
  },
  pitfalls: [
    'Des filtres qui partagent un état caché : on perd l’indépendance et le parallélisme.',
    'Pas de stratégie d’erreur : une ligne invalide bloque tout le flux ou disparaît sans trace.',
    'Oublier la contre-pression : un filtre rapide inonde un filtre lent et la mémoire explose.',
  ],
  neighbors: ['microkernel', 'architecture-evenementielle'],
  prerequisites: [
    { id: 'transaction-script', reason: 'Un pipeline remplace un long script de traitement par lots : il faut connaître ce point de départ.' },
  ],
  nextSteps: [
    { id: 'architecture-evenementielle', reason: 'Quand les filtres deviennent des services reliés par un broker, on passe à l’architecture orientée événements.' },
    { id: 'serverless', reason: 'Chaque filtre peut devenir une fonction serverless déclenchée par l’étape précédente.' },
  ],
  quiz: [
    {
      question: 'Que fait un filtre ?',
      choices: [
        'Il stocke les données définitivement',
        'Il lit une entrée, la transforme et produit une sortie',
        'Il affiche une interface',
        'Il gère les droits d’accès',
      ],
      answer: 1,
      explanation: 'Chaque filtre fait une transformation et ignore le reste du pipeline.',
    },
    {
      question: 'Quel exemple célèbre illustre ce style ?',
      choices: ['Les pipes Unix (cat | grep | sort)', 'Un formulaire HTML', 'Une base relationnelle', 'Un contrôleur MVC'],
      answer: 0,
      explanation: 'Chaque commande est un filtre, le | est le pipe.',
    },
    {
      question: 'Qu’est-ce que la contre-pression (backpressure) ?',
      choices: [
        'Un type de chiffrement',
        'Ralentir les étapes rapides pour ne pas saturer une étape lente',
        'Une compression des données',
        'Une méthode de test',
      ],
      answer: 1,
      explanation: 'Sans elle, les données s’accumulent en mémoire entre deux filtres.',
    },
  ],
  linkedinPost:
    'cat logs.txt | grep ERROR | sort | uniq -c. Une ligne, quatre filtres, zéro couplage. Le pattern pipes and filters a plus de 50 ans et il structure encore nos pipelines de données, nos chaînes de build et nos compilateurs. Les bonnes idées ne vieillissent pas.',
};
