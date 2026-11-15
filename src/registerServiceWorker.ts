/**
 * Registers the offline service worker. It only exists in production builds
 * (the Vite plugin in tools/ generates it), so development is never cached.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((err) => {
      // Offline play is an enhancement; the game works fine without it.
      console.warn('Service worker registration failed:', err);
    });
  });
}
