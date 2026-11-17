import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page narrow">
      <h1>Introuvable</h1>
      <p>Cette page n’existe pas, ou la fiche a changé de nom.</p>
      <ul className="inline-links">
        <li>
          <Link to="/" className="btn">Accueil</Link>
        </li>
        <li>
          <Link to="/cours" className="btn">Cours</Link>
        </li>
        <li>
          <Link to="/carte" className="btn">Mindmap</Link>
        </li>
      </ul>
    </div>
  );
}
