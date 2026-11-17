import { useEffect } from 'react';
import { Link } from 'react-router-dom';

type Theme = {
  title: string;
  /** Ce qu'on apprend vraiment en entreprise. */
  points: string[];
  /** Pourquoi les formations le couvrent mal. */
  school: string;
  /** Comment l'apprendre plus vite. */
  progress: string;
};

const THEMES: Theme[] = [
  {
    title: 'Lire et faire évoluer du code qui existe déjà',
    points: [
      'Comprendre un code écrit par d’autres, parfois il y a dix ans, sans documentation à jour.',
      'Modifier sans tout casser : poser des tests autour du comportement actuel avant de toucher au code.',
      'Remplacer petit à petit plutôt que tout réécrire (le « strangler fig »).',
      'Lire l’historique Git pour comprendre pourquoi une ligne existe.',
    ],
    school: 'Les projets de formation partent d’une page blanche et durent quelques semaines : on écrit beaucoup, on relit peu.',
    progress: 'Lire le code d’un projet open source connu, corriger un petit bug dedans, et toujours commencer par un test qui reproduit le problème.',
  },
  {
    title: 'Mettre en production et faire tourner',
    points: [
      'Déployer sans coupure, revenir en arrière vite (rollback) quand ça casse.',
      'Faire évoluer un schéma de base de données qui contient déjà des millions de lignes.',
      'Activer une fonctionnalité pour une partie des utilisateurs (feature flags).',
      'Lire des logs, des métriques et des traces pour comprendre un incident.',
    ],
    school: 'En formation, le projet s’arrête au moment où il marche sur la machine du développeur. La vie en production, avec de vrais utilisateurs, n’existe pas.',
    progress: 'Déployer soi-même un petit projet avec une base de données, le surveiller, puis y faire une migration de schéma sans l’arrêter.',
  },
  {
    title: 'Gérer les incidents',
    points: [
      'Garder son calme, limiter les dégâts d’abord, chercher la cause ensuite.',
      'Communiquer pendant l’incident : qui fait quoi, quand on donne des nouvelles.',
      'Écrire un post-mortem sans chercher de coupable, et en tirer des actions concrètes.',
    ],
    school: 'On ne peut pas simuler la pression d’un site en panne un vendredi soir devant des clients qui appellent.',
    progress: 'Lire les post-mortems publiés par de grandes entreprises tech et se demander à chaque étape : « qu’aurais-je fait ? »',
  },
  {
    title: 'Travailler en équipe sur le même code',
    points: [
      'Faire des revues de code utiles, et recevoir des critiques sans les prendre personnellement.',
      'Découper une fonctionnalité en petites livraisons qui se relisent bien.',
      'Écrire un ticket, une description de pull request ou une décision d’architecture (ADR) que les autres comprennent.',
      'Suivre des conventions communes même quand on ferait autrement.',
    ],
    school: 'Les projets de groupe sont courts et chacun garde souvent « sa » partie : peu de code partagé, peu de revues.',
    progress: 'Proposer des pull requests à un projet open source : la revue par des inconnus exigeants est une excellente école.',
  },
  {
    title: 'Comprendre le métier avant le code',
    points: [
      'Trouver le vrai besoin derrière la demande (« on veut un export Excel » cache souvent un autre problème).',
      'Parler avec des experts métier et reprendre leur vocabulaire dans le code.',
      'Dire non ou proposer plus simple quand une demande coûte plus qu’elle ne rapporte.',
    ],
    school: 'Les sujets de formation sont déjà spécifiés : le besoin est donné, on ne l’explore jamais.',
    progress: 'Avant chaque tâche, écrire en une phrase le problème de l’utilisateur, et le faire valider par quelqu’un du métier.',
  },
  {
    title: 'Faire des compromis',
    points: [
      'Livrer « assez bien » à temps plutôt que parfait trop tard, en sachant ce qu’on laisse de côté.',
      'Accepter une dette technique en connaissance de cause, et la noter pour la rembourser.',
      'Choisir une technologie ennuyeuse et éprouvée plutôt que la plus récente.',
      'Tenir compte du coût : serveurs, licences, temps de l’équipe.',
    ],
    school: 'En formation, la note récompense souvent la solution la plus complète ou la plus technique, pas le meilleur compromis.',
    progress: 'Pour chaque choix technique, écrire deux options, leurs coûts et pourquoi on en retient une : c’est exactement ce que fait un ADR.',
  },
  {
    title: 'Les données réelles',
    points: [
      'La volumétrie : une requête rapide sur 100 lignes peut s’effondrer sur 10 millions (index, requêtes N+1).',
      'Les données sales : doublons, champs vides, encodages, dates dans tous les formats.',
      'Les données personnelles : RGPD, droit à l’oubli, qui a le droit de voir quoi.',
    ],
    school: 'Les jeux de données de formation sont petits, propres et inventés.',
    progress: 'Charger un vrai jeu de données public de plusieurs millions de lignes et mesurer ses requêtes avec EXPLAIN.',
  },
  {
    title: 'La sécurité au quotidien',
    points: [
      'Ne jamais mettre un secret dans le code, faire tourner les clés.',
      'Mettre à jour les dépendances vulnérables sans casser l’application.',
      'Vérifier les droits à chaque accès (un utilisateur ne doit pas lire les données d’un autre).',
    ],
    school: 'La sécurité est souvent un module théorique à part, pas une habitude appliquée à chaque ligne de code.',
    progress: 'Relire son propre projet avec la liste OWASP Top 10 à côté, et activer les alertes de dépendances sur ses dépôts.',
  },
  {
    title: 'Choisir et faire évoluer une architecture',
    points: [
      'Partir simple (monolithe bien rangé) et découper seulement quand un vrai besoin apparaît.',
      'Repérer les frontières métier avant de créer des modules ou des services.',
      'Vivre avec les choix passés : on hérite plus souvent d’une architecture qu’on n’en conçoit une.',
    ],
    school: 'Les formations présentent les architectures comme un catalogue ; on ne voit jamais l’une d’elles évoluer sur plusieurs années.',
    progress: 'Pour chaque architecture de cette app, chercher dans quelle entreprise ou quel projet open source elle est utilisée, et lire comment elle a évolué.',
  },
];

export function TerrainPage() {
  useEffect(() => {
    document.title = 'Ce qui s’apprend en entreprise · Archi Map';
  }, []);

  return (
    <div className="page narrow">
      <h1>Ce qui s’apprend en entreprise</h1>
      <p className="lead">
        Les formations de développeurs enseignent bien les langages, les frameworks et les bases de l’algorithmique.
        D’autres compétences s’apprennent surtout en pratiquant, sur un vrai produit, avec une vraie équipe et de vrais
        utilisateurs. Voici les principales, et comment les apprendre plus vite.
      </p>
      <div className="terrain">
        {THEMES.map((t) => (
          <article key={t.title} className="card terrain-card">
            <h2>{t.title}</h2>
            <ul className="bullets">
              {t.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p>
              <strong>En formation : </strong>
              {t.school}
            </p>
            <p>
              <strong>Pour progresser : </strong>
              {t.progress}
            </p>
          </article>
        ))}
      </div>
      <p>
        <Link to="/carte" className="btn">
          Voir la mindmap des architectures
        </Link>
      </p>
    </div>
  );
}
