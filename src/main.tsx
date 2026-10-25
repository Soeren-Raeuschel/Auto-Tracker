import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import './ui/theme/tokens.css';
import './ui/theme/global.css';
import { registerSW } from 'virtual:pwa-register';
import App from './App';

// T9.3: Service Worker registrieren (autoUpdate).
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
