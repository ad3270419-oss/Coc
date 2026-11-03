/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';

export const COC_NAMES: Record<string | number, string> = {
  // Town Hall & Key Buildings
  1000000: "Army Camp",
  1000001: "Town Hall",
  1000002: "Elixir Collector",
  1000003: "Elixir Storage",
  1000004: "Gold Mine",
  1000005: "Gold Storage",
  1000006: "Barracks",
  1000007: "Laboratory",
  1000008: "Cannon",
  1000009: "Archer Tower",
  1000010: "Wall",
  1000011: "Wizard Tower",
  1000012: "Air Defense",
  1000013: "Mortar",
  1000014: "Clan Castle",
  1000015: "Builder's Hut",
  1000019: "Hidden Tesla",
  1000020: "Spell Factory",
  1000021: "X-Bow",
  1000023: "Dark Elixir Drill",
  1000024: "Dark Elixir Storage",
  1000026: "Dark Barracks",
  1000027: "Inferno Tower",
  1000028: "Air Sweeper",
  1000029: "Dark Spell Factory",
  1000031: "Eagle Artillery",
  1000032: "Bomb Tower",
  1000059: "Workshop",
  1000064: "B.O.B's Hut",
  1000067: "Scattershot",
  1000068: "Pet House",
  1000070: "Blacksmith",
  1000071: "Hero Hall",
  1000072: "Spell Tower",
  1000077: "Monolith",
  1000079: "Multi-Gear Tower",
  1000084: "Multi-Archer Tower",
  1000085: "Ricochet Cannon",
  1000086: "Revenge Tower",
  1000089: "Firespitter",
  1000093: "Helper Hut",
  1000097: "Crafting Station",
  1000102: "Super Wizard Tower",

  // Traps
  12000000: "Bomb",
  12000001: "Spring Trap",
  12000002: "Giant Bomb",
  12000005: "Air Bomb",
  12000006: "Seeking Air Mine",
  12000008: "Skeleton Trap",
  12000016: "Tornado Trap",
  12000020: "Giga Bomb",

  // Heroes
  28000000: "Barbarian King",
  28000001: "Archer Queen",
  28000002: "Grand Warden",
  28000003: "Battle Machine",
  28000004: "Royal Champion",
  28000005: "Battle Copter",
  28000006: "Minion Prince",
  28000007: "Dragon Duke",

  // Helpers & Assistants
  93000000: "Builder's Apprentice",
  93000001: "Lab Assistant",
  93000002: "Prospector"
};

interface BuilderTime {
  d: string;
  h: string;
  m: string;
  s?: number;
  upgradeTitle?: string;
  upgradeLevel?: number;
  rawId?: string;
}

interface LockedResultItem {
  builderIndex: number;
  slotBadge: string;
  upgradeTitle: string;
  upgradeLevel?: number;
  rawId?: string;
  isGoblin: boolean;
  targetTimestamp: number;
  formattedDate: string;
}

interface SavedState {
  mode: 'single' | 'multi';
  numBuilders: number;
  builders: BuilderTime[];
  potions: string;
  lockedResults?: LockedResultItem[];
  lockedSavedText?: string;
}

interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

interface RawCoCItem {
  data?: number | string;
  id?: number | string;
  lvl?: number;
  timer?: number;
  extra?: boolean;
}

interface RawCoCVillage {
  buildings?: RawCoCItem[];
  traps?: RawCoCItem[];
  heroes?: RawCoCItem[];
}

const STORAGE_KEY = 'coc_builder_potion_saved_v2';
const LEGACY_STORAGE_KEY = 'coc_builder_potion_saved_v1';

const DEFAULT_BUILDERS: BuilderTime[] = Array.from({ length: 7 }, () => ({
  d: '',
  h: '',
  m: '',
  s: 0,
  upgradeTitle: undefined,
  upgradeLevel: undefined,
  rawId: undefined,
}));

export function triggerHaptic(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore vibration errors on unsupported devices
  }
}

export function resolveUpgradeName(rawData: number | string | undefined): string {
  if (rawData === undefined || rawData === null) {
    return 'Defense Upgrade';
  }
  const strKey = String(rawData).trim();
  const numKey = Number(strKey);
  const upgradeName =
    COC_NAMES[rawData] ||
    COC_NAMES[numKey] ||
    COC_NAMES[strKey] ||
    'Defense Upgrade';
  return upgradeName;
}

function loadSavedState(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return {
        mode: 'single',
        numBuilders: 2,
        builders: DEFAULT_BUILDERS,
        potions: '',
        lockedResults: [],
        lockedSavedText: '',
      };
    }
    const parsed = JSON.parse(raw) as Partial<SavedState> & {
      builders?: Array<BuilderTime & { customLabel?: string }>;
      lockedResults?: Array<LockedResultItem & { builderLabel?: string }>;
    };
    const builders = Array.from({ length: 7 }, (_, idx) => {
      const savedB = parsed.builders?.[idx];
      const rawId =
        savedB?.rawId !== undefined && savedB?.rawId !== null
          ? String(savedB.rawId)
          : undefined;
      const reResolvedTitle = rawId ? resolveUpgradeName(rawId) : undefined;
      return {
        d: savedB?.d ?? '',
        h: savedB?.h ?? '',
        m: savedB?.m ?? '',
        s: savedB?.s ?? 0,
        upgradeTitle:
          reResolvedTitle && reResolvedTitle !== 'Defense Upgrade'
            ? reResolvedTitle
            : savedB?.upgradeTitle ?? savedB?.customLabel,
        upgradeLevel: typeof savedB?.upgradeLevel === 'number' ? savedB.upgradeLevel : undefined,
        rawId,
      };
    });

    const normalizedResults: LockedResultItem[] = Array.isArray(parsed.lockedResults)
      ? parsed.lockedResults.map((item, idx) => {
          const bIdx = typeof item.builderIndex === 'number' ? item.builderIndex : idx;
          const isGoblin = !!item.isGoblin || bIdx === 6;
          const rawId =
            item.rawId !== undefined && item.rawId !== null
              ? String(item.rawId)
              : builders[bIdx]?.rawId;
          const reResolvedTitle = rawId ? resolveUpgradeName(rawId) : undefined;
          return {
            builderIndex: bIdx,
            slotBadge: item.slotBadge || (isGoblin ? '[GOBLIN]' : `[B${bIdx + 1}]`),
            upgradeTitle:
              reResolvedTitle && reResolvedTitle !== 'Defense Upgrade'
                ? reResolvedTitle
                : item.upgradeTitle ||
                  item.builderLabel ||
                  (isGoblin ? 'Goblin Builder' : `Builder ${bIdx + 1}`),
            upgradeLevel: typeof item.upgradeLevel === 'number' ? item.upgradeLevel : undefined,
            rawId,
            isGoblin,
            targetTimestamp: item.targetTimestamp,
            formattedDate: item.formattedDate,
          };
        })
      : [];

    return {
      mode: parsed.mode === 'multi' ? 'multi' : 'single',
      numBuilders:
        typeof parsed.numBuilders === 'number' && parsed.numBuilders >= 1 && parsed.numBuilders <= 7
          ? parsed.numBuilders
          : 2,
      builders,
      potions: typeof parsed.potions === 'string' ? parsed.potions : '',
      lockedResults: normalizedResults,
      lockedSavedText: typeof parsed.lockedSavedText === 'string' ? parsed.lockedSavedText : '',
    };
  } catch {
    return {
      mode: 'single',
      numBuilders: 2,
      builders: DEFAULT_BUILDERS,
      potions: '',
      lockedResults: [],
      lockedSavedText: '',
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

function computeTimeParts(targetTimestamp: number) {
  const remMs = targetTimestamp - Date.now();
  if (remMs <= 0) {
    return { isFinished: true, d: 0, h: 0, m: 0, s: 0 };
  }
  const totalSeconds = Math.ceil(remMs / 1000);
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { isFinished: false, d, h, m, s };
}

function retriggerClass(el: HTMLElement | null, className: string) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

/**
 * Isolated 4-Unit HUD Live Countdown Ticker:
 * [ DD d ] : [ HH h ] : [ MM m ] : [ SS s ]
 * Updates digit spans directly via DOM refs so 1-second ticks never re-render parent UI.
 */
const LiveHudTicker: React.FC<{ targetTimestamp: number }> = React.memo(({ targetTimestamp }) => {
  const initialParts = computeTimeParts(targetTimestamp);
  const [isFinished, setIsFinished] = useState<boolean>(initialParts.isFinished);

  const prevPartsRef = useRef(initialParts);
  const wasRunningRef = useRef<boolean>(!initialParts.isFinished);

  const dayBoxRef = useRef<HTMLDivElement>(null);
  const hourBoxRef = useRef<HTMLDivElement>(null);
  const minBoxRef = useRef<HTMLDivElement>(null);

  const dayValRef = useRef<HTMLSpanElement>(null);
  const hourValRef = useRef<HTMLSpanElement>(null);
  const minValRef = useRef<HTMLSpanElement>(null);
  const secValRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const startParts = computeTimeParts(targetTimestamp);
    prevPartsRef.current = startParts;
    wasRunningRef.current = !startParts.isFinished;
    setIsFinished(startParts.isFinished);

    if (startParts.isFinished) return;

    const timerId = window.setInterval(() => {
      const next = computeTimeParts(targetTimestamp);
      if (next.isFinished) {
        window.clearInterval(timerId);
        if (wasRunningRef.current) {
          wasRunningRef.current = false;
          triggerHaptic([30, 50, 30]);
        }
        setIsFinished(true);
        return;
      }

      const prev = prevPartsRef.current;

      // Seconds: Smooth vertical slide-down flip animation
      if (next.s !== prev.s && secValRef.current) {
        secValRef.current.textContent = String(next.s).padStart(2, '0');
        retriggerClass(secValRef.current, 'anim-sec-flip');
      }

      // Minutes: Neon pink/elixir pulse glow + gentle bounce
      if (next.m !== prev.m && minValRef.current) {
        minValRef.current.textContent = String(next.m).padStart(2, '0');
        retriggerClass(minBoxRef.current, 'anim-min-pulse');
      }

      // Hours: Prominent gold glow flash + scale pop
      if (next.h !== prev.h && hourValRef.current) {
        hourValRef.current.textContent = String(next.h).padStart(2, '0');
        retriggerClass(hourBoxRef.current, 'anim-milestone-gold');
      }

      // Days: Prominent gold glow flash + scale pop
      if (next.d !== prev.d && dayValRef.current) {
        dayValRef.current.textContent = String(next.d).padStart(2, '0');
        retriggerClass(dayBoxRef.current, 'anim-milestone-gold');
      }

      prevPartsRef.current = next;
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [targetTimestamp]);

  if (isFinished) {
    return (
      <div className="badge-finished-glow w-full rounded-xl px-3 py-2.5 flex items-center justify-center gap-2 text-center">
        <span className="text-xs sm:text-sm font-extrabold tracking-wide text-[#22c55e] uppercase">
          ⚡ UPGRADE FINISHED! BUILDER FREE
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
        Live Countdown
      </p>
      <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5">
        {/* Days Unit */}
        <div
          ref={dayBoxRef}
          className="hud-unit flex-1 sm:flex-initial sm:min-w-[58px] rounded-xl px-2 py-1.5 flex items-baseline justify-center gap-0.5"
        >
          <span
            ref={dayValRef}
            className="text-base sm:text-lg font-extrabold text-[#f8fafc] tracking-tight"
          >
            {String(initialParts.d).padStart(2, '0')}
          </span>
          <span className="text-[10px] font-bold text-[#fbbf24]">d</span>
        </div>

        <span className="text-gray-400 font-extrabold text-xs select-none">:</span>

        {/* Hours Unit */}
        <div
          ref={hourBoxRef}
          className="hud-unit flex-1 sm:flex-initial sm:min-w-[58px] rounded-xl px-2 py-1.5 flex items-baseline justify-center gap-0.5"
        >
          <span
            ref={hourValRef}
            className="text-base sm:text-lg font-extrabold text-[#f8fafc] tracking-tight"
          >
            {String(initialParts.h).padStart(2, '0')}
          </span>
          <span className="text-[10px] font-bold text-[#fbbf24]">h</span>
        </div>

        <span className="text-gray-400 font-extrabold text-xs select-none">:</span>

        {/* Minutes Unit */}
        <div
          ref={minBoxRef}
          className="hud-unit flex-1 sm:flex-initial sm:min-w-[58px] rounded-xl px-2 py-1.5 flex items-baseline justify-center gap-0.5"
        >
          <span
            ref={minValRef}
            className="text-base sm:text-lg font-extrabold text-[#f8fafc] tracking-tight"
          >
            {String(initialParts.m).padStart(2, '0')}
          </span>
          <span className="text-[10px] font-bold text-elixir">m</span>
        </div>

        <span className="text-gray-400 font-extrabold text-xs select-none">:</span>

        {/* Seconds Unit */}
        <div className="hud-unit flex-1 sm:flex-initial sm:min-w-[58px] rounded-xl px-2 py-1.5 flex items-baseline justify-center gap-0.5 overflow-hidden">
          <span
            ref={secValRef}
            className="inline-block text-base sm:text-lg font-extrabold text-[#fbbf24] tracking-tight"
          >
            {String(initialParts.s).padStart(2, '0')}
          </span>
          <span className="text-[10px] font-bold text-gray-300">s</span>
        </div>
      </div>
    </div>
  );
});

export default function App() {
  const initial = loadSavedState();
  const [currentMode, setCurrentMode] = useState<'single' | 'multi'>(initial.mode);
  const [numBuilders, setNumBuilders] = useState<number>(initial.numBuilders);
  const [builders, setBuilders] = useState<BuilderTime[]>(initial.builders);
  const [potionsInput, setPotionsInput] = useState<string>(initial.potions);

  const [lockedResults, setLockedResults] = useState<LockedResultItem[]>(
    initial.lockedResults || []
  );
  const [savedText, setSavedText] = useState<string>(initial.lockedSavedText || '');
  const [showResult, setShowResult] = useState<boolean>(
    () => (initial.lockedResults?.length ?? 0) > 0
  );
  const [animKey, setAnimKey] = useState<number>(0);

  // CoC Village JSON Import Modal & Toast state
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now();
    setToast({ id, type, text });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3500);
  };

  // Save state + locked finish timestamps automatically to localStorage
  useEffect(() => {
    try {
      const stateToSave: SavedState = {
        mode: currentMode,
        numBuilders,
        builders,
        potions: potionsInput,
        lockedResults,
        lockedSavedText: savedText,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore storage quota errors
    }
  }, [currentMode, numBuilders, builders, potionsInput, lockedResults, savedText]);

  // Sync across tabs/pop-up windows
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const synced = loadSavedState();
        setCurrentMode(synced.mode);
        setNumBuilders(synced.numBuilders);
        setBuilders(synced.builders);
        setPotionsInput(synced.potions);
        setLockedResults(synced.lockedResults || []);
        setSavedText(synced.lockedSavedText || '');
        setShowResult((synced.lockedResults?.length ?? 0) > 0);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setMode = (mode: 'single' | 'multi') => {
    triggerHaptic();
    setCurrentMode(mode);
  };

  const handleBuilderCountChange = (nextCount: number) => {
    const clamped = Math.min(7, Math.max(1, nextCount));
    if (clamped !== numBuilders) {
      triggerHaptic(8);
      setNumBuilders(clamped);
    }
  };

  const handleBuilderTimeChange = (
    index: number,
    field: 'd' | 'h' | 'm',
    value: string
  ) => {
    const digits = value.replace(/\D/g, '');
    if (digits === '') {
      setBuilders((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: '', s: 0 };
        return next;
      });
      return;
    }

    let num = parseInt(digits, 10);
    if (field === 'h' && num > 24) {
      num = 24;
    } else if (field === 'm' && num > 60) {
      num = 60;
    } else if (field === 'd' && num > 999) {
      num = 999;
    }

    setBuilders((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: String(num), s: 0 };
      return next;
    });
  };

  const applyPresetToBuilder = (
    index: number,
    deltaDays: number,
    deltaHours: number
  ) => {
    triggerHaptic();
    setBuilders((prev) => {
      const next = [...prev];
      const current = next[index] || { d: '', h: '', m: '' };
      const curD = Math.max(0, parseInt(current.d, 10) || 0);
      const curH = Math.max(0, parseInt(current.h, 10) || 0);
      const curM = Math.max(0, parseInt(current.m, 10) || 0);

      const totalHours = curH + deltaHours;
      const extraDaysFromHours = Math.floor(totalHours / 24);
      const newH = totalHours % 24;
      const newD = Math.min(999, curD + deltaDays + extraDaysFromHours);

      next[index] = {
        ...current,
        d: newD > 0 ? String(newD) : current.d !== '' ? '0' : '',
        h: newH > 0 ? String(newH) : deltaHours > 0 || current.h !== '' ? String(newH) : '',
        m: curM > 0 ? String(curM) : current.m,
        s: 0,
      };
      return next;
    });
  };

  const handlePotionsChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits === '') {
      setPotionsInput('');
      return;
    }
    let num = parseInt(digits, 10);
    if (num > 999) num = 999;
    setPotionsInput(String(num));
  };

  const adjustPotions = (delta: number) => {
    triggerHaptic();
    const cur = Math.max(0, parseInt(potionsInput, 10) || 0);
    const next = Math.min(999, Math.max(0, cur + delta));
    setPotionsInput(next === 0 ? '' : String(next));
  };

  const resetAllTimes = () => {
    triggerHaptic(15);
    setBuilders(
      Array.from({ length: 7 }, () => ({
        d: '',
        h: '',
        m: '',
        s: 0,
        upgradeTitle: undefined,
        upgradeLevel: undefined,
        rawId: undefined,
      }))
    );
    setLockedResults([]);
    setSavedText('');
    setShowResult(false);
  };

  const resetBuilderTime = (index: number) => {
    triggerHaptic();
    setBuilders((prev) => {
      const next = [...prev];
      next[index] = {
        d: '',
        h: '',
        m: '',
        s: 0,
        upgradeTitle: undefined,
        upgradeLevel: undefined,
        rawId: undefined,
      };
      return next;
    });
    setLockedResults((prev) => {
      const filtered = prev.filter((item) => item.builderIndex !== index);
      if (filtered.length === 0) {
        setShowResult(false);
      }
      return filtered;
    });
  };

  const unlockAndEditTimers = () => {
    triggerHaptic();
    setLockedResults([]);
    setSavedText('');
    setShowResult(false);
  };

  const runCalculationWithData = (
    targetMode: 'single' | 'multi',
    targetNumBuilders: number,
    targetBuilders: BuilderTime[],
    targetPotionsStr: string
  ) => {
    const potions = Math.max(0, parseInt(targetPotionsStr, 10) || 0);
    const activeBuildersCount = targetMode === 'single' ? 1 : targetNumBuilders;
    const calcTimestamp = Date.now();
    const computedResults: LockedResultItem[] = [];

    for (let i = 1; i <= activeBuildersCount; i++) {
      const b = targetBuilders[i - 1];
      if (!b) continue;
      const d = Math.max(0, parseInt(b.d, 10) || 0);
      const h = Math.min(24, Math.max(0, parseInt(b.h, 10) || 0));
      const m = Math.min(60, Math.max(0, parseInt(b.m, 10) || 0));
      const s = Math.max(0, b.s || 0);

      const totalBuilderHours = d * 24 + h + m / 60 + s / 3600;
      if (totalBuilderHours === 0) continue;

      const realTimeHours = calcRealTime(totalBuilderHours, potions);
      const realDurationMs = Math.round(realTimeHours * 3600 * 1000);
      const targetTimestamp = calcTimestamp + realDurationMs;

      const completionDate = new Date(targetTimestamp);
      const formattedDate = completionDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const isGoblin = targetMode === 'multi' && i === 7;
      const slotBadge = isGoblin ? '[GOBLIN]' : `[B${i}]`;
      const defaultTitle =
        targetMode === 'single'
          ? 'Defense Upgrade'
          : isGoblin
          ? 'Goblin Builder'
          : `Builder ${i} Upgrade`;

      const resolvedFromId = b.rawId ? resolveUpgradeName(b.rawId) : undefined;
      const finalTitle =
        resolvedFromId && resolvedFromId !== 'Defense Upgrade'
          ? resolvedFromId
          : b.upgradeTitle && b.upgradeTitle !== 'Defense / Building Upgrade'
          ? b.upgradeTitle
          : resolvedFromId || defaultTitle;

      computedResults.push({
        builderIndex: i - 1,
        slotBadge,
        upgradeTitle: finalTitle,
        upgradeLevel: b.upgradeLevel,
        rawId: b.rawId,
        isGoblin,
        targetTimestamp,
        formattedDate,
      });
    }

    if (computedResults.length === 0) return;

    const totalSavedHoursAllBuilders = potions * 9 * computedResults.length;
    const savedDays = Math.floor(totalSavedHoursAllBuilders / 24);
    const savedHours = totalSavedHoursAllBuilders % 24;

    let computedSavedText = '';
    if (potions === 0) {
      computedSavedText = '0h';
    } else {
      if (savedDays > 0) computedSavedText += `${savedDays}d `;
      if (savedHours > 0 || savedDays === 0) computedSavedText += `${savedHours}h`;
    }

    setShowResult(false);
    setLockedResults(computedResults);
    setSavedText(computedSavedText);
    setAnimKey((prev) => prev + 1);
    requestAnimationFrame(() => {
      setShowResult(true);
    });
  };

  const calculateTime = () => {
    triggerHaptic(18);
    runCalculationWithData(currentMode, numBuilders, builders, potionsInput);
  };

  const handleImportVillageJson = () => {
    triggerHaptic(15);
    const trimmed = jsonInputText.trim();
    if (!trimmed) {
      showToast('error', 'Invalid JSON format');
      return;
    }

    let parsedData: RawCoCVillage;
    try {
      parsedData = JSON.parse(trimmed) as RawCoCVillage;
      if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData)) {
        showToast('error', 'Invalid JSON format');
        return;
      }
    } catch {
      showToast('error', 'Invalid JSON format');
      return;
    }

    // Strictly scan ONLY Home Village arrays: buildings, traps, heroes
    const homeItems: RawCoCItem[] = [
      ...(Array.isArray(parsedData.buildings) ? parsedData.buildings : []),
      ...(Array.isArray(parsedData.traps) ? parsedData.traps : []),
      ...(Array.isArray(parsedData.heroes) ? parsedData.heroes : []),
    ];

    const activeUpgrades = homeItems.filter(
      (item) => item && typeof item.timer === 'number' && item.timer > 0
    );

    if (activeUpgrades.length === 0) {
      showToast('error', 'No active Home Village upgrades found');
      return;
    }

    const goblinItem = activeUpgrades.find((item) => item.extra === true);
    const regularItems = activeUpgrades
      .filter((item) => item.extra !== true)
      .slice(0, 6);

    const nextBuilders: BuilderTime[] = Array.from({ length: 7 }, () => ({
      d: '',
      h: '',
      m: '',
      s: 0,
      upgradeTitle: undefined,
      upgradeLevel: undefined,
      rawId: undefined,
    }));

    // Map regular builders sequentially to Builder 1 through Builder 6 (indices 0..5)
    regularItems.forEach((item, idx) => {
      const timer = Math.max(0, Math.floor(item.timer || 0));
      const days = Math.floor(timer / 86400);
      const hours = Math.floor((timer % 86400) / 3600);
      const mins = Math.floor((timer % 3600) / 60);
      const secs = timer % 60;
      const itemData = item.data ?? item.id;
      const rawIdStr = itemData !== undefined && itemData !== null ? String(itemData) : undefined;
      const upgradeName =
        (itemData !== undefined &&
          (COC_NAMES[itemData] ||
            COC_NAMES[Number(itemData)] ||
            COC_NAMES[String(itemData)])) ||
        'Defense Upgrade';

      nextBuilders[idx] = {
        d: String(days),
        h: String(hours),
        m: String(mins),
        s: secs,
        upgradeTitle: upgradeName,
        upgradeLevel: typeof item.lvl === 'number' ? item.lvl : undefined,
        rawId: rawIdStr,
      };
    });

    // Map Goblin Builder (item.extra === true) directly to slot 7 (index 6)
    if (goblinItem) {
      const timer = Math.max(0, Math.floor(goblinItem.timer || 0));
      const days = Math.floor(timer / 86400);
      const hours = Math.floor((timer % 86400) / 3600);
      const mins = Math.floor((timer % 3600) / 60);
      const secs = timer % 60;
      const goblinData = goblinItem.data ?? goblinItem.id;
      const rawIdStr =
        goblinData !== undefined && goblinData !== null ? String(goblinData) : undefined;
      const upgradeName =
        (goblinData !== undefined &&
          (COC_NAMES[goblinData] ||
            COC_NAMES[Number(goblinData)] ||
            COC_NAMES[String(goblinData)])) ||
        'Defense Upgrade';

      nextBuilders[6] = {
        d: String(days),
        h: String(hours),
        m: String(mins),
        s: secs,
        upgradeTitle: upgradeName,
        upgradeLevel: typeof goblinItem.lvl === 'number' ? goblinItem.lvl : undefined,
        rawId: rawIdStr,
      };
    }

    const totalLoadedCount = regularItems.length + (goblinItem ? 1 : 0);
    const nextBuilderSliderCount = goblinItem
      ? 7
      : Math.max(1, Math.min(6, regularItems.length));

    setCurrentMode('multi');
    setNumBuilders(nextBuilderSliderCount);
    setBuilders(nextBuilders);
    setIsImportModalOpen(false);
    setJsonInputText('');

    // Immediately compute and lock target completion timestamps
    runCalculationWithData('multi', nextBuilderSliderCount, nextBuilders, potionsInput);

    showToast('success', `Loaded ${totalLoadedCount} active builders!`);
  };

  const activeBuildersToRender = currentMode === 'single' ? 1 : numBuilders;

  // Find the upgrade finishing soonest among active locked results
  const soonestTargetTimestamp =
    lockedResults.length > 0
      ? Math.min(...lockedResults.map((r) => r.targetTimestamp))
      : null;

  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-2xl border flex items-center gap-2 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 text-[#22c55e] border-emerald-400/50 shadow-emerald-500/20'
              : 'bg-rose-950/95 text-rose-300 border-rose-400/50 shadow-rose-500/20'
          }`}
        >
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toast.text}</span>
        </div>
      )}

      <div className="glass-card w-full max-w-md rounded-3xl p-5 sm:p-8 relative overflow-hidden my-auto">
        {/* Decorative glowing orbs behind the content */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500 rounded-full mix-blend-screen filter blur-[50px] opacity-40 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-500 rounded-full mix-blend-screen filter blur-[50px] opacity-30 pointer-events-none"></div>

        {/* Header + Import CoC JSON Button */}
        <div className="text-center mb-5 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">
            Builder <span className="text-elixir">Potion</span>
          </h1>
          <p className="text-gray-300 text-sm mt-1 uppercase tracking-widest text-gold text-xs font-semibold">
            Hammer Jam Calculator
          </p>

          <div className="mt-3.5 flex justify-center">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setIsImportModalOpen(true);
              }}
              className="tactile inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-[#f8fafc] bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.25)] cursor-pointer"
            >
              <span>📥 Import CoC JSON</span>
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-black/40 rounded-xl p-1 mb-6 border border-white/10 relative z-10">
          <button
            id="btn-mode-single"
            type="button"
            onClick={() => setMode('single')}
            className={`tactile flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              currentMode === 'single'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Single Builder
          </button>
          <button
            id="btn-mode-multi"
            type="button"
            onClick={() => setMode('multi')}
            className={`tactile flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              currentMode === 'multi'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
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
            } bg-black/30 p-4 rounded-2xl border border-white/10`}
          >
            <div className="flex justify-between items-center mb-3">
              <label className="text-base text-[#f8fafc] font-bold">Active Builders</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBuilderCountChange(numBuilders - 1)}
                  className="tactile w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer border border-white/10"
                  aria-label="Decrease builders"
                >
                  −
                </button>
                <div
                  className={`font-extrabold bg-black/50 px-3 py-1 rounded-lg shadow-inner border ${
                    numBuilders === 7
                      ? 'text-[#22c55e] border-emerald-500/40'
                      : 'text-[#fbbf24] border-amber-400/20'
                  }`}
                >
                  <span id="builders-count-label">{numBuilders}</span>{' '}
                  {numBuilders === 7 ? '👺' : '👷'}
                </div>
                <button
                  type="button"
                  onClick={() => handleBuilderCountChange(numBuilders + 1)}
                  className="tactile w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer border border-white/10"
                  aria-label="Increase builders"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              id="input-builders"
              min="1"
              max="7"
              value={numBuilders}
              onChange={(e) => handleBuilderCountChange(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#EC4899]"
            />
            <div className="flex justify-between text-[11px] font-semibold text-gray-300 mt-2 px-0.5">
              <span>1 Builder</span>
              <span>6 Builders</span>
              <span className={numBuilders === 7 ? 'text-[#22c55e] font-bold' : 'text-emerald-400/80'}>
                7: Goblin 👺
              </span>
            </div>
          </div>

          {/* Time Inputs Container */}
          <div id="time-inputs-container" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#fbbf24] font-extrabold">
                Upgrade Timers
              </span>
              {builders.slice(0, activeBuildersToRender).some((b) => b.d || b.h || b.m) && (
                <button
                  type="button"
                  onClick={resetAllTimes}
                  className="tactile text-xs font-bold text-elixir hover:text-pink-300 transition flex items-center gap-1 cursor-pointer bg-pink-500/15 hover:bg-pink-500/25 px-2.5 py-1 rounded-lg border border-pink-500/30"
                  title="Reset all days, hours, and minutes"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reset All
                </button>
              )}
            </div>

            {Array.from({ length: activeBuildersToRender }, (_, idx) => {
              const i = idx + 1;
              const isGoblin = currentMode === 'multi' && i === 7;
              const builderVal = builders[idx] || { d: '', h: '', m: '' };
              const isHero = !isGoblin && !!builderVal.rawId?.startsWith('28');

              const slotBadgeText = isGoblin ? '[GOBLIN]' : `[B${i}]`;
              const defaultTitle =
                currentMode === 'single'
                  ? 'Remaining Time'
                  : isGoblin
                  ? 'Goblin Builder'
                  : `Builder ${i}`;
              const displayTitle = builderVal.upgradeTitle || defaultTitle;

              const accentClass = isGoblin
                ? 'goblin-card accent-goblin'
                : isHero
                ? 'builder-card accent-hero'
                : 'builder-card accent-gold';

              const badgeClass = isGoblin
                ? 'slot-badge-goblin'
                : isHero
                ? 'slot-badge-hero'
                : 'slot-badge-regular';

              const hasThisBuilderTime = !!(
                builderVal.d ||
                builderVal.h ||
                builderVal.m ||
                builderVal.upgradeTitle
              );

              return (
                <div key={i} className={`rounded-2xl p-4 ${accentClass}`}>
                  {/* Minimalist Poppy HUD Card Header with Separator */}
                  <div className="builder-header-sep flex flex-wrap justify-between items-center gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={badgeClass}>{slotBadgeText}</span>
                      <span className="upgrade-title">{displayTitle}</span>
                      {typeof builderVal.upgradeLevel === 'number' && (
                        <span className={isGoblin ? 'lvl-chip-goblin' : 'lvl-chip'}>
                          LVL {builderVal.upgradeLevel}
                        </span>
                      )}
                    </div>

                    {hasThisBuilderTime && (
                      <button
                        type="button"
                        onClick={() => resetBuilderTime(idx)}
                        className="tactile text-xs font-bold text-gray-200 hover:text-elixir transition flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/15 cursor-pointer"
                        title="Clear this builder's time"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>

                  {/* Days, Hours, Mins Inputs */}
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
                        max="999"
                        className={`glass-input ${
                          isGoblin ? 'goblin-input' : ''
                        } w-full rounded-xl py-3 px-2 text-center text-xl font-bold placeholder-gray-500`}
                      />
                      <span className="text-xs font-semibold text-gray-200 text-center mt-1">
                        Days
                      </span>
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
                        max="24"
                        className={`glass-input ${
                          isGoblin ? 'goblin-input' : ''
                        } w-full rounded-xl py-3 px-2 text-center text-xl font-bold placeholder-gray-500`}
                      />
                      <span className="text-xs font-semibold text-gray-200 text-center mt-1">
                        Hours
                      </span>
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
                        max="60"
                        className={`glass-input ${
                          isGoblin ? 'goblin-input' : ''
                        } w-full rounded-xl py-3 px-2 text-center text-xl font-bold placeholder-gray-500`}
                      />
                      <span className="text-xs font-semibold text-gray-200 text-center mt-1">
                        Mins
                      </span>
                    </div>
                  </div>

                  {/* Quick Time Preset Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-white/10">
                    {[
                      { label: '+6h', d: 0, h: 6 },
                      { label: '+12h', d: 0, h: 12 },
                      { label: '+1d', d: 1, h: 0 },
                      { label: '+3d', d: 3, h: 0 },
                      { label: '+5d', d: 5, h: 0 },
                      { label: '+7d', d: 7, h: 0 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyPresetToBuilder(idx, preset.d, preset.h)}
                        className={`tactile text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${
                          isGoblin
                            ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border-emerald-500/30'
                            : 'bg-white/10 hover:bg-white/20 text-[#f8fafc] border-white/15'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => resetBuilderTime(idx)}
                      className="tactile text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 ml-auto cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Potions Input with Tactile +/- Counter */}
          <div className="builder-card rounded-2xl p-4">
            <label className="block text-base text-[#f8fafc] mb-2.5 font-extrabold flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span>🧪 Potions Used</span>
              </span>
              {potionsInput && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setPotionsInput('');
                  }}
                  className="tactile text-xs font-bold text-gray-300 hover:text-elixir transition cursor-pointer bg-white/10 px-2 py-0.5 rounded-md"
                >
                  Clear
                </button>
              )}
            </label>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => adjustPotions(-1)}
                className="tactile glass-input w-12 h-12 rounded-xl text-xl font-extrabold text-white hover:bg-white/15 flex items-center justify-center cursor-pointer"
                aria-label="Decrease potions"
              >
                −
              </button>
              <div className="relative flex-1">
                <input
                  type="number"
                  id="input-potions"
                  inputMode="numeric"
                  value={potionsInput}
                  onChange={(e) => handlePotionsChange(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="999"
                  className="glass-input w-full rounded-xl py-3 px-3 text-center text-xl font-extrabold placeholder-gray-500"
                />
              </div>
              <button
                type="button"
                onClick={() => adjustPotions(1)}
                className="tactile glass-input w-12 h-12 rounded-xl text-xl font-extrabold text-[#fbbf24] hover:bg-white/15 flex items-center justify-center cursor-pointer"
                aria-label="Increase potions"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons: Calculate + Reset */}
          <div className="flex gap-2.5 mt-4">
            <button
              type="button"
              onClick={calculateTime}
              className="btn-calculate tactile flex-1 text-white font-bold text-lg rounded-xl py-4 tracking-wide shadow-lg cursor-pointer"
            >
              Calculate Finish Time
            </button>
            {(builders.slice(0, activeBuildersToRender).some((b) => b.d || b.h || b.m) ||
              lockedResults.length > 0) && (
              <button
                type="button"
                onClick={resetAllTimes}
                className="tactile glass-input hover:border-pink-500/50 hover:bg-pink-500/10 text-gray-200 hover:text-white px-4 rounded-xl flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
                title="Reset all days, hours, and minutes"
              >
                <svg
                  className="w-5 h-5 text-gray-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-200">
                  Reset
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Results Section (Animated + Locked Target Finish Timestamp + 4-Unit HUD Live Ticker) */}
        <div
          key={animKey}
          id="results-container"
          className={`${
            showResult && lockedResults.length > 0 ? 'show-result' : 'hidden-result'
          } mt-8 pt-6 border-t border-white/15 relative z-10`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#f8fafc]">
                Locked Finish Schedule
              </span>
            </div>
            <button
              type="button"
              onClick={unlockAndEditTimers}
              className="tactile text-xs font-bold text-[#fbbf24] hover:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 px-2.5 py-1 rounded-lg cursor-pointer"
            >
              Reset / Edit Timers
            </button>
          </div>

          <div id="results-content" className="space-y-3">
            {lockedResults.map((item, idx) => {
              const isFinishingNext =
                lockedResults.length > 1 &&
                soonestTargetTimestamp !== null &&
                item.targetTimestamp === soonestTargetTimestamp;
              const isHero = !item.isGoblin && !!item.rawId?.startsWith('28');

              const cardAccentClass = item.isGoblin
                ? 'goblin-card accent-goblin'
                : isHero
                ? 'bg-black/40 border-white/10 accent-hero'
                : 'bg-black/40 border-white/10 accent-gold';

              const badgeClass = item.isGoblin
                ? 'slot-badge-goblin'
                : isHero
                ? 'slot-badge-hero'
                : 'slot-badge-regular';

              return (
                <div
                  key={`${item.builderIndex}-${item.targetTimestamp}-${idx}`}
                  className={`rounded-2xl p-4 border flex flex-col ${cardAccentClass}`}
                >
                  {/* Minimalist Poppy Header inside Result Card */}
                  <div className="builder-header-sep flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={badgeClass}>{item.slotBadge}</span>
                      <span className="upgrade-title">{item.upgradeTitle}</span>
                      {typeof item.upgradeLevel === 'number' && (
                        <span className={item.isGoblin ? 'lvl-chip-goblin' : 'lvl-chip'}>
                          LVL {item.upgradeLevel}
                        </span>
                      )}
                    </div>
                    {isFinishingNext && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-[#fbbf24] border border-amber-400/40">
                        NEXT FREE
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-wider text-gray-300 font-bold">
                      Completes On:
                    </span>
                    <span className="text-base font-extrabold text-gold">
                      {item.formattedDate}
                    </span>
                  </div>

                  {/* 4-Unit HUD Live Ticker inside the card */}
                  <div className="pt-2.5 border-t border-white/10">
                    <LiveHudTicker targetTimestamp={item.targetTimestamp} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-black/40 rounded-2xl p-4 mt-4 border border-white/10 flex justify-between items-center">
            <p className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Total Time Saved
            </p>
            <div id="result-saved" className="text-lg font-extrabold text-elixir">
              {savedText}
            </div>
          </div>
        </div>
      </div>

      {/* Dark Obsidian JSON Import Modal */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setIsImportModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 bg-[#090d16] border border-white/15 shadow-[0_0_40px_rgba(0,0,0,0.85)] space-y-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📥</span>
                <h2 className="text-lg font-extrabold text-[#f8fafc]">
                  Import CoC Village JSON
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsImportModalOpen(false);
                }}
                className="tactile text-gray-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              In Clash of Clans, go to{' '}
              <span className="text-[#fbbf24] font-bold">
                Settings → More Settings → Data Export → Copy
              </span>{' '}
              and paste your village JSON below.
            </p>

            <div className="relative">
              <textarea
                value={jsonInputText}
                onChange={(e) => setJsonInputText(e.target.value)}
                placeholder="Paste your raw Clash of Clans village export JSON here..."
                rows={6}
                className="glass-input w-full rounded-2xl p-3.5 text-xs font-mono text-gray-100 placeholder-gray-500 resize-none focus:outline-none"
              />
              <button
                type="button"
                onClick={async () => {
                  triggerHaptic();
                  try {
                    const clip = await navigator.clipboard.readText();
                    if (clip) setJsonInputText(clip);
                  } catch {
                    // Clipboard permission denied or unsupported
                  }
                }}
                className="tactile absolute bottom-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#fbbf24] border border-white/15 cursor-pointer"
              >
                📋 Paste
              </button>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setIsImportModalOpen(false);
                }}
                className="tactile flex-1 py-3 rounded-xl font-bold text-sm text-gray-200 bg-white/10 hover:bg-white/15 border border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportVillageJson}
                className="btn-calculate tactile flex-1 py-3 rounded-xl font-extrabold text-sm text-white shadow-lg cursor-pointer"
              >
                Import Timers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
