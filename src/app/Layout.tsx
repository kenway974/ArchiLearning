import { Outlet, useLocation } from 'react-router-dom';
import { NavBar } from './NavBar';
import { useApplyTheme } from '../shared/theme';

export function Layout() {
  useApplyTheme();
  const { pathname } = useLocation();
  const isMap = pathname === '/carte' || pathname.startsWith('/carte/');

  return (
    <div className={isMap ? 'shell shell-map' : 'shell'}>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <NavBar />
      <main id="contenu" className={isMap ? 'main-map' : 'main-page'} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
