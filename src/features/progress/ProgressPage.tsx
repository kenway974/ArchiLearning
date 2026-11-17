import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { content } from '../../content/index';
import { getSheet } from '../../content/lookup';
import { useProgress } from './ProgressContext';
import { summarize } from './progress';

export function ProgressPage() {
  const { progress, read, reset } = useProgress();
  const [confirming, setConfirming] = useState(false);
  const summary = summarize(progress, content);
  const scoresId = useId();
  const pathId = useId();
  const dialogTitle = useId();
  const active = progress.activePath;
  const nextStep = active?.steps.find((id) => !read.has(id)) ?? active?.target;
  const scores = Object.entries(progress.bestScores).filter(([id]) => getSheet(id));

  return (
    <div className="page narrow">
      <h1>Ma progression</h1>

      <div className="stats">
        <div className="stat">
          <span className="stat-label">Fiches lues</span>
          <span className="stat-value" data-testid="progress-total">
            {summary.read} / {summary.total}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Concepts</span>
          <span className="stat-value" data-testid="progress-concepts">
            {summary.concepts.read} / {summary.concepts.total}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Secteurs</span>
          <span className="stat-value" data-testid="progress-sectors">
            {summary.sectors.read} / {summary.sectors.total}
          </span>
        </div>
      </div>

      {summary.read === 0 && (
        <p>
          Rien de lu pour l’instant. <Link to="/cours">Voir les cours</Link> ou <Link to="/carte">ouvrir la mindmap</Link>.
        </p>
      )}

      {active && nextStep && (
        <section aria-labelledby={pathId} className="callout callout-next">
          <h2 id={pathId}>Parcours en cours</h2>
          <p>
            Sujet : <strong>{getSheet(active.target)?.title}</strong> · Étape {active.steps.indexOf(nextStep) + 1} /{' '}
            {active.steps.length}
          </p>
          <Link to={`/cours/${nextStep}`} className="btn btn-primary">
            Reprendre
          </Link>
        </section>
      )}

      {scores.length > 0 && (
        <section aria-labelledby={scoresId}>
          <h2 id={scoresId}>Meilleurs scores</h2>
          <ul className="scores">
            {scores.map(([id, s]) => (
              <li key={id}>
                <Link to={`/cours/${id}`}>{getSheet(id)?.title}</Link>
                <span>
                  {s.correct} / {s.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p>
        <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
          Réinitialiser ma progression
        </button>
      </p>

      {confirming && (
        <div className="modal-backdrop">
          <div role="alertdialog" aria-modal="true" aria-labelledby={dialogTitle} className="modal">
            <h2 id={dialogTitle}>Tout effacer ?</h2>
            <p>Les fiches lues, les scores et le parcours en cours seront supprimés. Le thème choisi est conservé.</p>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setConfirming(false)} autoFocus>
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  reset();
                  setConfirming(false);
                }}
              >
                Tout effacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
