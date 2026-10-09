import { Link, NavLink, Outlet, ScrollRestoration, useNavigation } from 'react-router-dom';
import { useFavourites } from '../features/favourites/favourites';
import styles from './Layout.module.css';

export function Layout() {
  const navigation = useNavigation();
  const savedCount = useFavourites().size;

  return (
    <>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo}>
            Casita <span>Stays</span>
          </Link>
          <NavLink to="/saved" className={styles.navLink}>
            Saved{savedCount > 0 && ` (${savedCount})`}
          </NavLink>
        </div>
        {navigation.state === 'loading' && <div className={styles.progress} aria-hidden="true" />}
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
      <ScrollRestoration />
    </>
  );
}
