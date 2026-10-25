import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { createContainer } from './composition/container';
import { ROUTES } from './ui/routes';
import { CarDetailPage } from './ui/pages/CarDetailPage';
import { ComparePage } from './ui/pages/ComparePage';
import { RankingPage } from './ui/pages/RankingPage';
import { SettingsPage } from './ui/pages/SettingsPage';

const container = createContainer();

/**
 * Routing (T2.1). HashRouter statt BrowserRouter: GitHub Pages (T7.8) liefert
 * keinen SPA-Fallback, und `base: './'` hält die App portabel.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path={ROUTES.ranking} element={<RankingPage container={container} />} />
        <Route path={ROUTES.settings} element={<SettingsPage />} />
        <Route path={ROUTES.carDetail} element={<CarDetailPage />} />
        <Route path={ROUTES.compare} element={<ComparePage />} />
        <Route path="*" element={<Navigate to={ROUTES.ranking} replace />} />
      </Routes>
    </HashRouter>
  );
}
