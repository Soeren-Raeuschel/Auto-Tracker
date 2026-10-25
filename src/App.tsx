import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { createContainer } from './composition/container';
import { ROUTES } from './ui/routes';
import { AppShell } from './ui/components/AppShell';
import { CarDetailPage } from './ui/pages/CarDetailPage';
import { ComparePage } from './ui/pages/ComparePage';
import { NewsPage } from './ui/pages/NewsPage';
import { RankingPage } from './ui/pages/RankingPage';
import { SettingsPage } from './ui/pages/SettingsPage';
import { WatchlistPage } from './ui/pages/WatchlistPage';

const container = createContainer();

/**
 * Routing (T2.1). HashRouter statt BrowserRouter: GitHub Pages (T7.8) liefert
 * keinen SPA-Fallback, und `base: './'` hält die App portabel.
 * AppShell (T10.3) legt Sidebar/TabBar um alle Seiten.
 */
export default function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path={ROUTES.ranking} element={<RankingPage container={container} />} />
          <Route path={ROUTES.settings} element={<SettingsPage container={container} />} />
          <Route path={ROUTES.carDetail} element={<CarDetailPage />} />
          <Route path={ROUTES.compare} element={<ComparePage />} />
          <Route path={ROUTES.news} element={<NewsPage />} />
          <Route path={ROUTES.watchlist} element={<WatchlistPage />} />
          <Route path="*" element={<Navigate to={ROUTES.ranking} replace />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
