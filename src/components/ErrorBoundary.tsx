import React from 'react';
import { clearSavedGame } from '../game/savedGame';
import { t } from '../i18n';

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last line of defence: if rendering throws, show a way out instead of a
 * blank screen. Progress (stars, records, skins) is never touched here; only
 * the run in progress can be discarded, since a broken save could be the cause.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('AnimalPuzzle crashed:', error, info.componentStack);
  }

  private reload = (): void => {
    window.location.reload();
  };

  private discardRunAndReload = (): void => {
    clearSavedGame();
    window.location.reload();
  };

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        data-testid="error-screen"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1018] p-4"
      >
        <div className="ui-panel w-full max-w-md space-y-4 p-4 text-center">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#D4002A]">
            {t('Något gick fel')}
          </div>
          <h1 className="font-display text-2xl font-extrabold">
            {t('Spelet råkade ut för ett fel')}
          </h1>
          <p className="text-sm font-medium leading-snug text-[#333333]">
            {t('Dina stjärnor, rekord och djur-skins är sparade. Ladda om för att fortsätta spela.')}
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={this.reload}
              className="ui-btn ui-btn-green w-full px-4 py-1.5 font-display text-lg"
            >
              {t('Ladda om spelet')}
            </button>
            <button
              type="button"
              onClick={this.discardRunAndReload}
              className="ui-btn w-full px-3 py-1.5 text-sm !whitespace-normal"
            >
              {t('Kasta pågående parti och ladda om')}
            </button>
          </div>
          <p className="break-words font-mono-num text-[10px] text-[#50545A]">{error.message}</p>
        </div>
      </div>
    );
  }
}
