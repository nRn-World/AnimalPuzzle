import React, { useEffect, useId, useRef } from 'react';
import { soundEngine } from '../game/audio';
import { isHapticsSupported, vibrate } from '../game/haptics';
import { remindersSupported, requestReminders } from '../game/reminders';
import { Settings, updateSettings } from '../game/settings';
import { GemColor } from '../game/types';
import { useSettings } from '../hooks/useSettings';
import { LANGUAGES, loadLanguage, t } from '../i18n';
import { UiIcon } from './UiIcon';
import { GemSvg } from './GemSvg';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const PREVIEW_COLORS: GemColor[] = ['ruby', 'rose', 'cobalt', 'violet', 'emerald', 'lime'];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h3 className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#D4002A]">
      {title}
    </h3>
    <div className="space-y-2">{children}</div>
  </section>
);

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  testId: string;
  onChange: (next: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  description,
  checked,
  disabled = false,
  testId,
  onChange,
}) => {
  const descId = useId();
  return (
    <div className="ui-inset flex items-center justify-between gap-3 px-3 py-2">
      <div className="min-w-0">
        <div className={`text-sm font-bold ${disabled ? 'text-[#62666D]' : 'text-[#111111]'}`}>
          {label}
        </div>
        {description && (
          <p id={descId} className="mt-0.5 text-[11px] font-medium leading-snug text-[#4B4B4B]">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={description ? descId : undefined}
        data-testid={testId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-md border-2 transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#2F9FD7] ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        } ${checked ? 'border-[#111111] bg-[#7CFC6A]' : 'border-[#111111] bg-[#AEB3BB]'}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded border-2 border-[#111111] bg-[#DDE1E7] transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

interface SliderRowProps {
  label: string;
  value: number;
  disabled?: boolean;
  testId: string;
  onChange: (next: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({ label, value, disabled = false, testId, onChange }) => {
  const id = useId();
  const pct = Math.round(value * 100);
  return (
    <div className="ui-inset px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className={`text-sm font-bold ${disabled ? 'text-[#62666D]' : 'text-[#111111]'}`}
        >
          {label}
        </label>
        <span className="font-mono-num text-xs font-bold text-[#D4002A]">{pct}%</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={pct}
        disabled={disabled}
        data-testid={testId}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="mt-2 block h-6 w-full cursor-pointer accent-[#FF2E4D] disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const settings = useSettings();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const hapticsSupported = isHapticsSupported();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const set = (patch: Partial<Settings>) => updateSettings(patch);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      data-testid="settings-modal"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-[#111111]/70"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ui-panel flex w-full max-w-md max-h-[calc(100dvh-1.5rem)] flex-col">
        <div className="flex items-center justify-between gap-4 border-b-2 border-[#111111] px-2 pb-2 sm:px-3">
          <h2 id="settings-modal-title" className="inline-flex items-center gap-2 font-display text-xl font-extrabold">
            <UiIcon name="gear" className="w-5 h-5 text-[#D4002A]" />
            {t('Inställningar')}
          </h2>
          <button
            ref={closeRef}
            type="button"
            data-testid="close-settings-btn"
            onClick={onClose}
            className="ui-btn ui-btn-red shrink-0 px-2 py-1 text-xs sm:text-sm"
          >
            <UiIcon name="cross" className="w-3 h-3" />
            {t('Stäng')}
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto overscroll-contain px-2 pt-3 pb-1 sm:px-3">
          <Section title={t('Ljud')}>
            <ToggleRow
              label={t('Ljud på')}
              checked={!settings.muted}
              testId="setting-sound"
              onChange={(on) => {
                set({ muted: !on });
                if (on) soundEngine.playClick();
              }}
            />
            <SliderRow
              label={t('Ljudeffekter')}
              value={settings.sfxVolume}
              disabled={settings.muted}
              testId="setting-sfx-volume"
              onChange={(v) => {
                set({ sfxVolume: v });
                soundEngine.playClick();
              }}
            />
            <SliderRow
              label={t('Musik')}
              value={settings.musicVolume}
              disabled={settings.muted}
              testId="setting-music-volume"
              onChange={(v) => set({ musicVolume: v })}
            />
          </Section>

          <Section title={t('Känsla')}>
            <ToggleRow
              label={t('Vibration')}
              description={
                hapticsSupported
                  ? t('Korta vibrationer vid matchningar, specialdjur och ogiltiga drag.')
                  : t('Den här enheten eller webbläsaren stöder inte vibration.')
              }
              checked={hapticsSupported && settings.haptics}
              disabled={!hapticsSupported}
              testId="setting-haptics"
              onChange={(on) => {
                set({ haptics: on });
                if (on) vibrate('special');
              }}
            />
          </Section>

          <Section title={t('Påminnelser')}>
            <ToggleRow
              label={t('Notis när liven är fulla')}
              description={
                remindersSupported()
                  ? t('Fungerar medan spelet ligger öppet i bakgrunden, till exempel som installerad app.')
                  : t('Den här enheten eller webbläsaren stöder inte notiser.')
              }
              checked={remindersSupported() && settings.reminders}
              disabled={!remindersSupported()}
              testId="setting-reminders"
              onChange={(on) => {
                if (!on) {
                  set({ reminders: false });
                  return;
                }
                void requestReminders().then((granted) => set({ reminders: granted }));
              }}
            />
          </Section>

          <Section title={t('Tillgänglighet')}>
            <ToggleRow
              label={t('Reducerad rörelse')}
              description={t(
                'Stänger av skakningar, lutning och menyanimationer. Systemets inställning följs alltid.'
              )}
              checked={settings.reduceMotion}
              testId="setting-reduce-motion"
              onChange={(on) => set({ reduceMotion: on })}
            />
            <ToggleRow
              label={t('Symboler på djuren')}
              description={t(
                'Varje djur får en egen form i hörnet, så att färgen aldrig är det enda som skiljer dem åt.'
              )}
              checked={settings.symbols}
              testId="setting-symbols"
              onChange={(on) => set({ symbols: on })}
            />
            <div
              aria-hidden="true"
              className="flex items-center justify-center gap-1.5 rounded border-2 border-[#111111] bg-[#22307A] px-2 py-2"
            >
              {PREVIEW_COLORS.map((color, i) => (
                <GemSvg
                  key={color}
                  color={color}
                  special="none"
                  animationSeed={i * 57 + 11}
                  className="h-10 w-10 sm:h-11 sm:w-11"
                />
              ))}
            </div>
          </Section>

          <Section title={t('Språk')}>
            <div
              role="radiogroup"
              aria-label={t('Språk')}
              className="grid grid-cols-3 gap-1.5"
            >
              {LANGUAGES.map((lang) => {
                const active = settings.language === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    lang={lang.id}
                    data-testid={`setting-language-${lang.id}`}
                    onClick={() => void loadLanguage(lang.id).then(() => set({ language: lang.id }))}
                    className={`ui-btn px-2 text-xs sm:text-sm ${
                      active ? 'ui-btn-wood py-0.5' : 'py-1.5'
                    }`}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title={t('Tack')}>
            <ul data-testid="settings-credits" className="ui-inset space-y-1.5 px-3 py-2 text-xs leading-snug">
              <li>
                <strong>Kenney</strong> (kenney.nl) – {t('ikonerna i menyerna och de inspelade ljudeffekterna')} · CC0
              </li>
              <li>
                <strong>Vernon Adams</strong> – {t('typsnittet Bangers')} · SIL OFL
              </li>
              <li>
                <strong>Tyler Finck</strong> – {t('typsnittet Grandstander')} · SIL OFL
              </li>
              <li>
                <strong>JetBrains</strong> – {t('typsnittet JetBrains Mono')} · SIL OFL
              </li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
};
