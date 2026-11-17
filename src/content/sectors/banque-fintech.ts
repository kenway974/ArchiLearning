import type { SectorSheet } from '../schema';

export const banqueFintech: SectorSheet = {
  id: 'banque-fintech',
  kind: 'sector',
  title: 'Banque / fintech',
  summary: 'Comptes, paiements, crédits : des opérations financières sous forte réglementation, où chaque centime doit être traçable et chaque écriture exacte.',
  context:
    'Le secteur bancaire est réglementé (agrément, lutte contre le blanchiment, protection des données, résilience opérationnelle avec DORA dans l’Union européenne, DSP2 pour les paiements). Les systèmes doivent être disponibles en permanence, auditables, et ne jamais perdre ni dupliquer une opération. Les banques historiques combinent souvent des systèmes centraux anciens (mainframes, COBOL) et des applications récentes ; les néobanques sont parties de zéro avec des architectures modernes.',
  constraints: [
    'Exactitude : pas d’opération perdue ni dupliquée, montants exacts (jamais de nombres à virgule flottante).',
    'Traçabilité et audit de chaque opération.',
    'Réglementation : LCB-FT (lutte contre le blanchiment), DSP2, DORA, RGPD.',
    'Disponibilité élevée et plans de reprise.',
    'Sécurité : authentification forte, séparation des droits, chiffrement.',
    'Intégration avec des systèmes existants et des réseaux de paiement (SEPA, cartes).',
  ],
  bySize: {
    small: {
      architecture: 'Monolithe modulaire au cœur hexagonal, adossé à un partenaire bancaire (Banking as a Service)',
      why: 'Une jeune fintech s’appuie sur un établissement agréé pour la tenue de comptes ; son code se concentre sur son métier, isolé des API du partenaire par des ports.',
    },
    medium: {
      architecture: 'Modules ou services par domaine (comptes, paiements, conformité), Event Sourcing sur le grand livre',
      why: 'L’historique inaltérable des opérations est une exigence ; les domaines ont des équipes et des contraintes différentes.',
    },
    large: {
      architecture: 'Microservices par domaine, communication par événements, intégration progressive des systèmes centraux existants',
      why: 'De nombreuses équipes, des systèmes historiques à remplacer pas à pas et des exigences de disponibilité très élevées.',
    },
  },
  stack: {
    language: 'java',
    framework: 'Spring Boot',
    why: 'Java et l’écosystème Spring sont très répandus dans les banques et assurances : maturité, outillage, sécurité (Spring Security), transactions, nombreux développeurs disponibles. BigDecimal évite les erreurs d’arrondi des nombres à virgule flottante. Kotlin et Go sont aussi présents, notamment chez les néobanques.',
  },
  tree: [
    { name: 'pom.xml', kind: 'file', role: 'POM parent Maven : liste les modules et fixe les versions communes (Spring Boot).' },
    {
      name: 'comptes',
      kind: 'dir',
      role: 'Module Maven du domaine Comptes, organisé en hexagone.',
      children: [
        { name: 'pom.xml', kind: 'file', role: 'Dépendances propres au module Comptes.' },
        {
          name: 'src/main/java/fr/banque/comptes/domaine',
          kind: 'dir',
          role: 'Cœur métier : agrégat Compte et ses événements, sans Spring.',
          children: [
            { name: 'Compte.java', kind: 'file', role: 'Agrégat event-sourcé : décide des événements et applique les règles (découvert, blocage).' },
            { name: 'Montant.java', kind: 'file', role: 'Objet valeur Montant (BigDecimal + devise), jamais de double.' },
            { name: 'evenements/FondsDebites.java', kind: 'file', role: 'Événement : des fonds ont été débités.' },
          ],
        },
        {
          name: 'src/main/java/fr/banque/comptes/application',
          kind: 'dir',
          role: 'Cas d’usage et ports (stockage des événements, notifications).',
          children: [
            { name: 'DebiterCompte.java', kind: 'file', role: 'Cas d’usage : charge le compte, débite, enregistre les événements.' },
            { name: 'JournalEvenements.java', kind: 'file', role: 'Port : lire et ajouter les événements d’un compte.' },
          ],
        },
        {
          name: 'src/main/java/fr/banque/comptes/adaptateurs',
          kind: 'dir',
          role: 'Adaptateurs : API REST, stockage PostgreSQL, publication Kafka.',
          children: [
            { name: 'JournalPostgres.java', kind: 'file', role: 'Implémente le port avec une table d’événements en ajout seul.' },
            { name: 'CompteController.java', kind: 'file', role: 'API REST, protégée par Spring Security.' },
          ],
        },
      ],
    },
    { name: 'paiements', kind: 'dir', role: 'Module Maven du domaine Paiements (virements SEPA, cartes).', children: [
      { name: 'pom.xml', kind: 'file', role: 'Dépendances propres au module Paiements.' },
    ] },
  ],
  code: {
    language: 'java',
    filename: 'comptes/.../domaine/Compte.java',
    source: `// Agrégat event-sourcé : l'état est reconstruit à partir des événements.
public final class Compte {

    private final CompteId id;
    private Montant solde = Montant.zero(Devise.EUR);
    private Montant decouvertAutorise = Montant.zero(Devise.EUR);
    private boolean bloque;
    private final List<EvenementCompte> nouveaux = new ArrayList<>();

    public static Compte depuis(CompteId id, List<EvenementCompte> historique) {
        Compte compte = new Compte(id);
        historique.forEach(compte::appliquer); // rejouer le passé
        return compte;
    }

    // Une décision métier : vérifier les règles, puis produire un événement
    public void debiter(Montant montant, String reference) {
        if (bloque) throw new CompteBloque(id);
        // BigDecimal dans Montant : aucune erreur d'arrondi, contrairement à double
        if (solde.moins(montant).estInferieurA(decouvertAutorise.negatif())) {
            throw new ProvisionInsuffisante(id, montant);
        }
        enregistrer(new FondsDebites(id, montant, reference, Instant.now()));
    }

    private void enregistrer(EvenementCompte e) {
        appliquer(e);
        nouveaux.add(e); // seront ajoutés au journal, jamais modifiés
    }

    private void appliquer(EvenementCompte e) {
        switch (e) {
            case FondsCredites c -> solde = solde.plus(c.montant());
            case FondsDebites d -> solde = solde.moins(d.montant());
            case CompteBloqueEvt b -> bloque = true;
        }
    }

    private Compte(CompteId id) { this.id = id; }
    public List<EvenementCompte> nouveauxEvenements() { return List.copyOf(nouveaux); }
}`,
  },
  pitfalls: [
    'Utiliser double ou float pour des montants : les erreurs d’arrondi s’accumulent.',
    'Modifier une opération passée au lieu de passer une écriture de correction.',
    'Ne pas gérer l’idempotence des paiements : une nouvelle tentative réseau débite deux fois.',
    'Laisser le code métier dépendre directement de l’API d’un partenaire bancaire ou d’un système central.',
    'Réécrire le système central d’un coup au lieu de le remplacer progressivement, domaine par domaine.',
  ],
  examples: [
    {
      name: 'Kapio',
      size: 'small',
      profile: 'Compte pro pour indépendants, 15 salariés, s’appuie sur une banque partenaire.',
      team: '6 développeurs Kotlin et Spring.',
      practices: [
        'Tenue des comptes déléguée à un partenaire bancaire (Banking as a Service).',
        'Monolithe modulaire au cœur hexagonal : l’API du partenaire est un adaptateur derrière un port.',
        'Vérification d’identité des clients confiée à un prestataire spécialisé.',
        'Clé d’idempotence sur chaque virement envoyé au partenaire.',
      ],
    },
    {
      name: 'Crédisol',
      size: 'medium',
      profile: 'Établissement de paiement, 200 salariés, cartes et virements pour des PME.',
      team: '8 équipes, dont une équipe conformité et une équipe sécurité.',
      practices: [
        'Modules par domaine : comptes, paiements, cartes, conformité.',
        'Grand livre en Event Sourcing : chaque opération est un événement conservé.',
        'API ouverte aux agrégateurs, conformément à DSP2.',
        'Contrôles anti-blanchiment déclenchés par les événements de paiement.',
      ],
    },
    {
      name: 'Banque Hexa',
      size: 'large',
      profile: 'Banque régionale historique, 5 000 salariés, plusieurs millions de clients.',
      team: 'Des dizaines d’équipes, en interne et chez des prestataires.',
      practices: [
        'Système central ancien (mainframe) conservé pour la tenue de comptes.',
        'Nouveaux services (application mobile, crédit en ligne) construits autour, derrière une passerelle d’API.',
        'Remplacement progressif du système central, domaine par domaine.',
        'Plans de reprise et tests de résilience exigés par la réglementation.',
      ],
    },
  ],
  prerequisites: [
    { id: 'event-sourcing', reason: 'Les banques ont besoin d’un historique inaltérable des opérations : l’Event Sourcing en fait le cœur du stockage.' },
    { id: 'hexagonale', reason: 'Isoler le métier des partenaires, réseaux de paiement et systèmes historiques est vital dans ce secteur.' },
  ],
  nextSteps: [
    { id: 'microservices', reason: 'Les grandes banques et néobanques découpent par domaine : voir les conditions pour que ce soit rentable.' },
  ],
  quiz: [
    {
      question: 'Quel type utiliser pour un montant en Java ?',
      choices: ['double', 'float', 'BigDecimal (dans un objet valeur Montant)', 'int en euros'],
      answer: 2,
      explanation: 'Les flottants binaires ne représentent pas exactement 0,10 € ; BigDecimal si.',
    },
    {
      question: 'Pourquoi l’Event Sourcing est-il naturel en banque ?',
      choices: [
        'Il est plus rapide en lecture',
        'Le métier raisonne déjà en opérations historisées et l’audit est obligatoire',
        'Il évite d’avoir une base de données',
        'Il est imposé par la loi',
      ],
      answer: 1,
      explanation: 'Un relevé de compte est déjà une liste d’événements ; aucune loi n’impose cette technique.',
    },
    {
      question: 'Comment éviter qu’une nouvelle tentative réseau débite deux fois ?',
      choices: [
        'Désactiver les nouvelles tentatives',
        'Une clé d’idempotence par opération, vérifiée côté serveur',
        'Augmenter le délai maximal',
        'Utiliser du double',
      ],
      answer: 1,
      explanation: 'La même clé rejouée renvoie le résultat déjà enregistré sans refaire l’opération.',
    },
    {
      question: 'Pourquoi un cœur hexagonal chez une fintech qui s’appuie sur un partenaire bancaire ?',
      choices: [
        'Pour la mode',
        'Pour pouvoir changer de partenaire ou le simuler en test sans réécrire le métier',
        'Pour éviter Spring',
        'Pour avoir plus de fichiers',
      ],
      answer: 1,
      explanation: 'L’API du partenaire est un adaptateur derrière un port.',
    },
    {
      question: 'Quelle réglementation européenne porte sur la résilience opérationnelle numérique du secteur financier ?',
      choices: ['DORA', 'HTML5', 'ISO 9001', 'WCAG'],
      answer: 0,
      explanation: 'DORA (Digital Operational Resilience Act) s’applique aux entités financières de l’UE.',
    },
    {
      question: 'Comment corriger une opération erronée ?',
      choices: [
        'UPDATE sur la ligne',
        'DELETE de la ligne',
        'Une nouvelle opération de correction',
        'Restaurer une sauvegarde',
      ],
      answer: 2,
      explanation: 'Comme en comptabilité : on contre-passe, on n’efface pas.',
    },
  ],
  linkedinPost:
    '0.1 + 0.2 = 0.30000000000000004. Une ligne qui fait peur à toute équipe bancaire. En fintech, l’architecture commence par des choses très concrètes : BigDecimal, idempotence de chaque paiement, journal d’opérations en ajout seul. L’Event Sourcing n’y est pas une mode : c’est la forme naturelle d’un relevé de compte.',
};
