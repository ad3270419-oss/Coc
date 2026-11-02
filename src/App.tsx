/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useOnlineStatus, usePWAInstall } from './usePWAInstall';

interface BuilderTime {
  d: string;
  h: string;
  m: string;
}

interface CalculatedItem {
  builderLabel: string;
  formattedDate: string;
  realDays: number;
  realHours: number;
  realMins: number;
}

interface SavedState {
  mode: 'single' | 'multi';
  numBuilders: number;
  builders: BuilderTime[];
  potions: string;
}

const STORAGE_KEY = 'coc_builder_potion_saved_v1';

const DEFAULT_BUILDERS: BuilderTime[] = Array.from({ length: 7 }, () => ({
  d: '',
  h: '',
  m: '',
}));

function loadSavedState(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        mode: 'single',
        numBuilders: 2,
        builders: DEFAULT_BUILDERS,
        potions: '',
      };
    }
    const parsed = JSON.parse(raw) as Partial<SavedState>;
    const builders = Array.from({ length: 7 }, (_, idx) => ({
      d: parsed.builders?.[idx]?.d ?? '',
      h: parsed.builders?.[idx]?.h ?? '',
      m: parsed.builders?.[idx]?.m ?? '',
    }));
    return {
      mode: parsed.mode === 'multi' ? 'multi' : 'single',
      numBuilders:
        typeof parsed.numBuilders === 'number' && parsed.numBuilders >= 1 && parsed.numBuilders <= 7
          ? parsed.numBuilders
          : 2,
      builders,
      potions: typeof parsed.potions === 'string' ? parsed.potions : '',
    };
  } catch {
    return {
      mode: 'single',
      numBuilders: 2,
      builders: DEFAULT_BUILDERS,
      potions: '',
    };
  }
}

function calcRealTime(totalBuilderHours: number, potions: number): number {
  if (totalBuilderHours === 0) return 0;
  const maxPotionCoverageHours = potions * 10;
  // Potion cuts 10 builder hours into 1 real hour.
  if (totalBuilderHours <= maxPotionCoverageHours) {
    return totalBuilderHours / 10;
  } else {
    return totalBuilderHours - potions * 9;
  }
}

export default function App() {
  const initial = loadSavedState();
  const [currentMode, setCurrentMode] = useState<'single' | 'multi'>(initial.mode);
  const [numBuilders, setNumBuilders] = useState<number>(initial.numBuilders);
  const [builders, setBuilders] = useState<BuilderTime[]>(initial.builders);
  const [potionsInput, setPotionsInput] = useState<string>(initial.potions);

  const [results, setResults] = useState<CalculatedItem[]>([]);
  const [savedText, setSavedText] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(false);
  const [animKey, setAnimKey] = useState<number>(0);

  // Android / PWA / Pop-up window states
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isCompactWindow, setIsCompactWindow] = useState<boolean>(false);

  // Save last put items automatically to localStorage
  useEffect(() => {
    try {
      const stateToSave: SavedState = {
        mode: currentMode,
        numBuilders,
        builders,
        potions: potionsInput,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore storage quota errors
    }
  }, [currentMode, numBuilders, builders, potionsInput]);

  // Listen for storage changes across pop-up / main window and detect compact POCO floating window dimensions
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const synced = loadSavedState();
        setCurrentMode(synced.mode);
        setNumBuilders(synced.numBuilders);
        setBuilders(synced.builders);
        setPotionsInput(synced.potions);
      }
    };

    const checkWindowSize = () => {
      // POCO / Xiaomi MIUI & HyperOS floating windows typically run at < 420px width or < 560px height
      setIsCompactWindow(window.innerHeight < 580 || window.innerWidth < 360);
    };

    checkWindowSize();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('resize', checkWindowSize);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('resize', checkWindowSize);
    };
  }, []);

  const setMode = (mode: 'single' | 'multi') => {
    setCurrentMode(mode);
    setShowResult(false);
  };

  const handleBuilderTimeChange = (index: number, field: keyof BuilderTime, value: string) => {
    setBuilders((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const calculateTime = () => {
    const potions = Math.max(0, parseInt(potionsInput, 10) || 0);
    const activeBuildersCount = currentMode === 'single' ? 1 : numBuilders;
    const now = new Date();
    const computedResults: CalculatedItem[] = [];

    for (let i = 1; i <= activeBuildersCount; i++) {
      const b = builders[i - 1];
      const d = Math.max(0, parseInt(b.d, 10) || 0);
      const h = Math.max(0, parseInt(b.h, 10) || 0);
      const m = Math.max(0, parseInt(b.m, 10) || 0);

      const totalBuilderHours = d * 24 + h + m / 60;
      if (totalBuilderHours === 0) continue;

      const realTimeHours = calcRealTime(totalBuilderHours, potions);
      const totalRealMinutes = Math.round(realTimeHours * 60);

      const completionDate = new Date(now.getTime() + totalRealMinutes * 60 * 1000);
      const formattedDate = completionDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const realDays = Math.floor(totalRealMinutes / (24 * 60));
      const remainMinsAfterDays = totalRealMinutes % (24 * 60);
      const realHours = Math.floor(remainMinsAfterDays / 60);
      const realMins = remainMinsAfterDays % 60;

      const builderLabel = currentMode === 'single' ? 'Upgrade' : `Builder ${i}`;

      computedResults.push({
        builderLabel,
        formattedDate,
        realDays,
        realHours,
        realMins,
      });
    }

    if (computedResults.length === 0) return;

    const totalSavedHoursAllBuilders = potions * 9 * activeBuildersCount;
    const savedDays = Math.floor(totalSavedHoursAllBuilders / 24);
    const savedHours = totalSavedHoursAllBuilders % 24;

    let computedSavedText = '';
    if (potions === 0) {
      computedSavedText = '0h';
    } else {
      if (savedDays > 0) computedSavedText += `${savedDays}d `;
      if (savedHours > 0 || savedDays === 0) computedSavedText += `${savedHours}h`;
    }

    // Re-trigger exact original slideUpFade animation
    setShowResult(false);
    setResults(computedResults);
    setSavedText(computedSavedText);
    setAnimKey((prev) => prev + 1);
    requestAnimationFrame(() => {
      setShowResult(true);
    });
  };

  // Launch floating pop-up window (Document Picture-in-Picture API where supported, or guide modal)
  const togglePopupWindow = async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    const docPip = (window as unknown as {
      documentPictureInPicture?: {
        requestWindow: (options: { width: number; height: number }) => Promise<Window>;
      };
    }).documentPictureInPicture;

    if (docPip) {
      try {
        const win = await docPip.requestWindow({ width: 360, height: 540 });
        // Copy stylesheets to the floating pop-up window
        Array.from(document.styleSheets).forEach((styleSheet) => {
          try {
            const cssRules = Array.from(styleSheet.cssRules)
              .map((rule) => rule.cssText)
              .join('');
            const style = win.document.createElement('style');
            style.textContent = cssRules;
            win.document.head.appendChild(style);
          } catch {
            if (styleSheet.href) {
              const link = win.document.createElement('link');
              link.rel = 'stylesheet';
              link.href = styleSheet.href;
              win.document.head.appendChild(link);
            }
          }
        });
        win.document.body.className = 'flex items-center justify-center p-2';
        win.addEventListener('pagehide', () => {
          setPipWindow(null);
        });
        setPipWindow(win);
        return;
      } catch {
        // Fallback to Android / POCO Floating Window guide modal
      }
    }

    setShowGuideModal(true);
  };

  const activeBuildersToRender = currentMode === 'single' ? 1 : numBuilders;

  const calculatorCard = (
    <div className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-8 relative overflow-hidden my-auto">
      {/* Decorative glowing orbs behind the content */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500 rounded-full mix-blend-screen filter blur-[50px] opacity-40 pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-500 rounded-full mix-blend-screen filter blur-[50px] opacity-30 pointer-events-none"></div>

      {/* Header */}
      <div className="text-center mb-6 relative z-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">
          Builder <span className="text-elixir">Potion</span>
        </h1>
        <p className="text-gray-300 text-sm mt-1 uppercase tracking-widest text-gold text-xs font-semibold">
          Hammer Jam Calculator
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-black/40 rounded-xl p-1 mb-6 border border-white/10 relative z-10">
        <button
          id="btn-mode-single"
          type="button"
          onClick={() => setMode('single')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            currentMode === 'single'
              ? 'bg-white/20 text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Single Builder
        </button>
        <button
          id="btn-mode-multi"
          type="button"
          onClick={() => setMode('multi')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            currentMode === 'multi'
              ? 'bg-white/20 text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All Builders
        </button>
      </div>

      {/* Inputs Section */}
      <div className="space-y-6 relative z-10">
        {/* Builders Slider (Hidden in single mode) */}
        <div
          id="multi-builders-config"
          className={`${
            currentMode === 'single' ? 'hidden' : ''
          } bg-black/20 p-4 rounded-2xl border border-white/5`}
        >
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm text-gray-300 font-medium">Active Builders</label>
            <div className="text-gold font-bold bg-black/40 px-3 py-1 rounded-lg shadow-inner">
              <span id="builders-count-label">{numBuilders}</span> 👷
            </div>
          </div>
          <input
            type="range"
            id="input-builders"
            min="1"
            max="7"
            value={numBuilders}
            onChange={(e) => setNumBuilders(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#EC4899]"
          />
        </div>

        {/* Time Inputs Container */}
        <div id="time-inputs-container" className="space-y-4">
          {Array.from({ length: activeBuildersToRender }, (_, idx) => {
            const i = idx + 1;
            const label =
              currentMode === 'single'
                ? 'Remaining Upgrade Time'
                : `Builder ${i} Remaining Time`;
            const builderVal = builders[idx] || { d: '', h: '', m: '' };

            return (
              <div key={i} className={i > 1 ? 'pt-2 border-t border-white/10 mt-2' : ''}>
                <label className="block text-sm text-gray-300 mb-2 font-medium">{label}</label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col">
                    <input
                      type="number"
                      id={`input-d-${i}`}
                      inputMode="numeric"
                      value={builderVal.d}
                      onChange={(e) => handleBuilderTimeChange(idx, 'd', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="glass-input w-full rounded-xl py-3 px-2 text-center text-xl font-semibold placeholder-gray-500"
                    />
                    <span className="text-xs text-gray-400 text-center mt-1">Days</span>
                  </div>
                  <div className="flex flex-col">
                    <input
                      type="number"
                      id={`input-h-${i}`}
                      inputMode="numeric"
                      value={builderVal.h}
                      onChange={(e) => handleBuilderTimeChange(idx, 'h', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="glass-input w-full rounded-xl py-3 px-2 text-center text-xl font-semibold placeholder-gray-500"
                    />
                    <span className="text-xs text-gray-400 text-center mt-1">Hours</span>
                  </div>
                  <div className="flex flex-col">
                    <input
                      type="number"
                      id={`input-m-${i}`}
                      inputMode="numeric"
                      value={builderVal.m}
                      onChange={(e) => handleBuilderTimeChange(idx, 'm', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="glass-input w-full rounded-xl py-3 px-2 text-center text-xl font-semibold placeholder-gray-500"
                    />
                    <span className="text-xs text-gray-400 text-center mt-1">Mins</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Potions Input */}
        <div>
          <label className="block text-sm text-gray-300 mb-2 font-medium flex justify-between items-end">
            <span>Potions Used</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-lg">🧪</span>
            </div>
            <input
              type="number"
              id="input-potions"
              inputMode="numeric"
              value={potionsInput}
              onChange={(e) => setPotionsInput(e.target.value)}
              placeholder="0"
              min="0"
              className="glass-input w-full rounded-xl py-3 pl-10 pr-3 text-lg font-semibold placeholder-gray-500"
            />
          </div>
        </div>

        {/* Calculate Button */}
        <button
          type="button"
          onClick={calculateTime}
          className="btn-calculate w-full text-white font-bold text-lg rounded-xl py-4 mt-4 tracking-wide shadow-lg cursor-pointer"
        >
          Calculate Finish Time
        </button>
      </div>

      {/* Results Section (Animated) */}
      <div
        key={animKey}
        id="results-container"
        className={`${
          showResult ? 'show-result' : 'hidden-result'
        } mt-8 pt-6 border-t border-white/10 relative z-10`}
      >
        <div id="results-content" className="space-y-3">
          {results.map((item, idx) => (
            <div
              key={idx}
              className="bg-black/30 rounded-2xl p-4 border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-2"
            >
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                  {item.builderLabel} Completes On
                </p>
                <div className="text-base font-bold text-gold">{item.formattedDate}</div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                  Actual Wait
                </p>
                <div className="text-white flex items-baseline justify-start sm:justify-end gap-1">
                  {item.realDays > 0 && (
                    <>
                      <span className="text-xl">{item.realDays}</span>
                      <span className="text-xs text-gray-400 mr-1">d</span>
                    </>
                  )}
                  {(item.realHours > 0 || item.realDays > 0) && (
                    <>
                      <span className="text-xl">{item.realHours}</span>
                      <span className="text-xs text-gray-400 mr-1">h</span>
                    </>
                  )}
                  <span className="text-xl">{item.realMins}</span>
                  <span className="text-xs text-gray-400">m</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-black/30 rounded-2xl p-4 mt-4 border border-white/5 flex justify-between items-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Time Saved</p>
          <div id="result-saved" className="text-lg font-bold text-elixir">
            {savedText}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto overflow-x-hidden">
      {/* Subtle Android APK / Pop-up Floating Window bar — auto-hides inside compact POCO Floating Windows so only the calculator shows */}
      {!isCompactWindow && !pipWindow && (
        <div className="w-full max-w-md mb-2.5 flex items-center justify-end gap-2 px-1">
          {!isOnline && (
            <span className="mr-auto inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 px-2.5 py-1 text-[11px] font-medium text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Offline
            </span>
          )}

          {!isInstalled && (
            <button
              type="button"
              onClick={async () => {
                if (isInstallable) {
                  await install();
                } else {
                  setShowGuideModal(true);
                }
              }}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-[#FACC15]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {isIOS ? 'Install on iOS' : 'Install Android App'}
            </button>
          )}

          <button
            type="button"
            onClick={togglePopupWindow}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:text-white transition cursor-pointer"
            title="Pop-up / Floating Window Mode"
          >
            <svg className="w-3.5 h-3.5 text-[#EC4899]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Pop-up Mode
          </button>
        </div>
      )}

      {/* Render either inside the Picture-in-Picture Floating Window or directly in the main viewport */}
      {pipWindow ? (
        <>
          {createPortal(calculatorCard, pipWindow.document.body)}
          <div className="glass-card w-full max-w-md rounded-3xl p-6 text-center space-y-4">
            <p className="text-sm text-gray-300">
              Running in <span className="text-elixir font-semibold">Pop-up Window</span>
            </p>
            <button
              type="button"
              onClick={() => {
                pipWindow.close();
                setPipWindow(null);
              }}
              className="btn-calculate text-white font-semibold text-sm rounded-xl px-5 py-2.5 cursor-pointer"
            >
              Restore to Main Window
            </button>
          </div>
        </>
      ) : (
        calculatorCard
      )}

      {/* Android APK & POCO Floating Window Guide Modal */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="glass-card w-full max-w-sm rounded-3xl p-6 border border-white/15 space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Android App &amp; <span className="text-elixir">POCO Pop-up</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-gray-400 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <div className="bg-black/30 rounded-2xl p-3.5 border border-white/5">
                <p className="text-gold font-semibold mb-1">1. Install Native Android WebAPK</p>
                {isIOS ? (
                  <p>
                    Tap <strong>Share</strong> in Safari and select{' '}
                    <strong>Add to Home Screen</strong> for full offline access.
                  </p>
                ) : (
                  <p>
                    Open in Chrome on Android, tap the <strong>⋮ menu → Install app</strong>. Android
                    compiles and installs this calculator as a lightweight native APK that works 100%
                    offline and auto-saves your last inputs.
                  </p>
                )}
              </div>

              <div className="bg-black/30 rounded-2xl p-3.5 border border-white/5">
                <p className="text-elixir font-semibold mb-1">
                  2. POCO / Xiaomi Floating Window (Pop-up)
                </p>
                <p>
                  Once installed, open <strong>Recents</strong> on your POCO phone, long-press{' '}
                  <strong>CoC Potion</strong>, and tap the <strong>Floating Window</strong> icon — or
                  open it directly from the <strong>Game Turbo / Smart Sidebar</strong> while playing
                  Clash of Clans!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="btn-calculate w-full text-white font-bold text-sm rounded-xl py-3 cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
