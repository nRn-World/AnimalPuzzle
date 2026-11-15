import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { prepareLanguage } from './game/settings';
import { registerServiceWorker } from './registerServiceWorker';

// German, Spanish, French and Turkish are separate files, fetched before the first frame.
void prepareLanguage().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
});

registerServiceWorker();
