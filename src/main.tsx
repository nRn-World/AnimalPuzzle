import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { notifyLanguageLoaded, prepareLanguage } from './game/settings';
import { registerServiceWorker } from './registerServiceWorker';

// Render first, translate second. German, Spanish, French and Turkish are
// separate chunks; waiting for one before the first frame meant that a slow or
// blocked chunk left the player with a blank page forever.
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

void prepareLanguage().then((loaded) => {
  if (loaded) notifyLanguageLoaded();
});

registerServiceWorker();
