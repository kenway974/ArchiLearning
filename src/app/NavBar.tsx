import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '../shared/Icon';
import { useProgress } from '../features/progress/ProgressContext';
import { useResolvedTheme } from '../shared/theme';

const LINKS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Accueil', icon: 'home', end: true },
  { to: '/cours', label: 'Cours', icon: 'list' },
  { to: '/carte', label: 'Mindmap', icon: 'map' },
  { to: '/comparer', label: 'Comparer', icon: 'compare' },
  { to: '/progression', label: 'Progression', icon: 'progress' },
];

export function NavBar() {
  const { setTheme } = useProgress();
  const theme = useResolvedTheme();
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <nav className="navbar" aria-label="Navigation principale">
      <NavLink to="/" className="brand" aria-hidden="true" tabIndex={-1}>
        Archi Map
      </NavLink>
      <ul className="navbar-links">
        {LINKS.map((l) => (
          <li key={l.to}>
            <NavLink to={l.to} end={l.end ?? false} className="navbar-link">
              <Icon name={l.icon} />
              <span>{l.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="navbar-theme"
        onClick={() => setTheme(next)}
        aria-label={next === 'dark' ? 'Passer au thème sombre' : 'Passer au thème clair'}
        title={next === 'dark' ? 'Passer au thème sombre' : 'Passer au thème clair'}
      >
        <Icon name={next === 'dark' ? 'moon' : 'sun'} />
      </button>
    </nav>
  );
}
