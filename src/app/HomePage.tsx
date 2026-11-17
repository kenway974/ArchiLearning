import { Link } from 'react-router-dom';
import { content } from '../content/index';
import { useProgress } from '../features/progress/ProgressContext';
import { summarize } from '../features/progress/progress';
import { Icon } from '../shared/Icon';

export function HomePage() {
  const { progress } = useProgress();
  const summary = summarize(progress, content);

  return (
    <div className="page home">
      <header className="home-hero">
        <h1>Archi Map</h1>
        <div data-testid="presentation" className="home-intro">
          <p>
            Quelle architecture choisir pour une banque, une boutique en ligne ou un SaaS ? Et pourquoi pas une autre ?
          </p>
          <p>
            Chaque fiche explique une architecture ou un secteur avec du vrai code, des arborescences commentées, les pièges
            à éviter et un quiz pour vérifier.
          </p>
        </div>
        <p className="home-count">
          {content.concepts.length} concepts, {content.sectors.length} secteurs, {content.links.length} liens entre eux
        </p>
        <div className="home-actions">
          <Link to="/carte" className="btn btn-primary btn-large">
            <Icon name="map" /> Voir la mindmap
          </Link>
          <Link to="/cours" className="btn btn-large">
            <Icon name="list" /> Liste des cours
          </Link>
        </div>
      </header>

      <section className="home-cards" aria-label="Comment ça marche">
        <div className="card">
          <h2>1. Choisis un sujet</h2>
          <p>Sur la mindmap ou dans la liste : une architecture (CQRS, hexagonale…) ou un secteur (banque, e-commerce…).</p>
        </div>
        <div className="card">
          <h2>2. Suis le parcours</h2>
          <p>Si le sujet demande des bases, la fiche te propose de commencer par elles, dans le bon ordre.</p>
        </div>
        <div className="card">
          <h2>3. Vérifie avec le quiz</h2>
          <p>Chaque fiche se termine par un quiz ; les fiches lues sont cochées sur la carte.</p>
        </div>
      </section>

      <section className="callout" aria-label="Au-delà des formations">
        <p className="callout-title">Au-delà des formations</p>
        <p>
          Revues de code, mises en production, incidents, compromis : ce que les formations enseignent peu et qui
          s’apprend en pratiquant.
        </p>
        <Link to="/terrain" className="btn">
          Ce qui s’apprend en entreprise
        </Link>
      </section>

      <p className="home-progress">
        <Link to="/progression" className="btn">
          <Icon name="progress" /> Ma progression
        </Link>
        <span className="muted">
          {summary.read} / {summary.total} fiches lues
        </span>
      </p>
    </div>
  );
}
