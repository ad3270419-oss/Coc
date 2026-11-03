/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';

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

// Merge Pets, Troops & Siege Machines, and Spells into COC_NAMES
Object.assign(COC_NAMES, {
  // --- PETS (73000000 series) ---
  73000000: "L.A.S.S.I",
  73000001: "Mighty Yak",
  73000002: "Electro Owl",
  73000003: "Unicorn",
  73000004: "Phoenix",
  73000007: "Poison Lizard",
  73000008: "Diggy",
  73000009: "Frosty",
  73000010: "Spirit Fox",
  73000011: "Angry Jelly",
  73000016: "Sneezy",
  73000017: "Greedy Raven",

  // --- TROOPS & SIEGE MACHINES (4000000 series) ---
  4000000: "Barbarian",
  4000001: "Archer",
  4000002: "Goblin",
  4000003: "Giant",
  4000004: "Wall Breaker",
  4000005: "Balloon",
  4000006: "Wizard",
  4000007: "Healer",
  4000008: "Dragon",
  4000009: "P.E.K.K.A",
  4000010: "Minion",
  4000011: "Hog Rider",
  4000012: "Valkyrie",
  4000013: "Golem",
  4000015: "Witch",
  4000017: "Lava Hound",
  4000022: "Bowler",
  4000023: "Baby Dragon",
  4000024: "Miner",
  4000051: "Wall Wrecker",
  4000052: "Battle Blimp",
  4000053: "Yeti",
  4000058: "Ice Golem",
  4000059: "Electro Dragon",
  4000062: "Stone Slammer",
  4000065: "Dragon Rider",
  4000075: "Siege Barracks",
  4000082: "Headhunter",
  4000087: "Log Launcher",
  4000091: "Flame Flinger",
  4000092: "Battle Drill",
  4000095: "Electro Titan",
  4000097: "Apprentice Warden",
  4000109: "Ruin Witch",
  4000110: "Root Rider",
  4000123: "Druid",
  4000132: "Thrower",
  4000135: "Troop Launcher",
  4000150: "Furnace",
  4000177: "Meteor Golem",
  4000188: "Sky Wagon",

  // --- SPELLS (26000000 series) ---
  26000000: "Lightning Spell",
  26000001: "Healing Spell",
  26000002: "Rage Spell",
  26000003: "Jump Spell",
  26000005: "Freeze Spell",
  26000009: "Poison Spell",
  26000010: "Earthquake Spell",
  26000011: "Haste Spell",
  26000016: "Clone Spell",
  26000017: "Skeleton Spell",
  26000028: "Bat Spell",
  26000035: "Invisibility Spell",
  26000053: "Recall Spell",
  26000070: "Overgrowth Spell",
  26000098: "Revive Spell",
  26000109: "Ice Block Spell",
  26000120: "Totem Spell",
  26000123: "Angry Spell"
});

type PlannerCategoryTab = 'builders' | 'laboratory' | 'pethouse';

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
  // Laboratory 24x Engine State
  researchPotions?: number;
  labTimer?: BuilderTime;
  goblinLabTimer?: BuilderTime;
  targetLabTimestamp?: number | null;
  labFormattedDate?: string;
  labSavedText?: string;
  targetGoblinLabTimestamp?: number | null;
  goblinLabFormattedDate?: string;
  // Pet House 24x Engine State
  petPotions?: number;
  petTimer?: BuilderTime;
  targetPetTimestamp?: number | null;
  petFormattedDate?: string;
  petSavedText?: string;
}

interface VillageProfile {
  id: string;
  name: string;
  tag?: string;
  data: SavedState;
}

interface MultiAccountStorage {
  activeAccountId: string;
  accounts: VillageProfile[];
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
  tag?: string;
  buildings?: RawCoCItem[];
  traps?: RawCoCItem[];
  heroes?: RawCoCItem[];
  units?: RawCoCItem[];
  spells?: RawCoCItem[];
  siege_machines?: RawCoCItem[];
  pets?: RawCoCItem[];
}

const STORAGE_KEY = 'coc_builder_potion_saved_v2';
const LEGACY_STORAGE_KEY = 'coc_builder_potion_saved_v1';
const ACCOUNTS_STORAGE_KEY = 'clash_planner_accounts_v1';
const SCHEDULED_ALERTS_STORAGE_KEY = 'clashPlanner_scheduledAlerts';

type ScheduledAlertsMap = Record<string, number[]>;

function loadScheduledAlertsMap(): ScheduledAlertsMap {
  try {
    const raw = localStorage.getItem(SCHEDULED_ALERTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as ScheduledAlertsMap;
  } catch {
    return {};
  }
}

function saveScheduledAlertsMap(map: ScheduledAlertsMap): void {
  try {
    localStorage.setItem(SCHEDULED_ALERTS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

function trackVillageNotificationId(villageId: string, notificationId: number): void {
  const map = loadScheduledAlertsMap();
  const list = Array.isArray(map[villageId]) ? map[villageId] : [];
  if (!list.includes(notificationId)) {
    map[villageId] = [...list, notificationId];
    saveScheduledAlertsMap(map);
  }
}

function untrackVillageNotificationId(villageId: string, notificationId: number): void {
  const map = loadScheduledAlertsMap();
  if (!Array.isArray(map[villageId])) return;
  map[villageId] = map[villageId].filter((id) => id !== notificationId);
  saveScheduledAlertsMap(map);
}

/**
 * Generates a deterministic positive 31-bit integer notification ID from villageId and slotKey
 * to prevent notification collisions across multiple village profiles and upgrade slots.
 */
export function getSlotNotificationId(villageId: string, slotKey: string): number {
  const combined = `${villageId}::${slotKey}`;
  let hash = 2166136261;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 2147480000) + 1000;
}

export async function requestNotificationPermissions(): Promise<void> {
  try {
    await LocalNotifications.requestPermissions();
  } catch {
    // Ignore errors in web preview environments where native plugin is unavailable
  }
}

async function cancelSlotNotification(villageId: string, slotKey: string): Promise<void> {
  const notificationId = getSlotNotificationId(villageId, slotKey);
  untrackVillageNotificationId(villageId, notificationId);
  try {
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
  } catch {
    // Ignore errors in non-native environments
  }
}

async function scheduleExactSlotNotification(params: {
  villageId: string;
  slotKey: string;
  title: string;
  body: string;
  targetTimestamp: number | null | undefined;
}): Promise<void> {
  const { villageId, slotKey, title, body, targetTimestamp } = params;
  const notificationId = getSlotNotificationId(villageId, slotKey);

  // Always clear any previously scheduled notification for this specific slot first
  try {
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
  } catch {
    // Ignore errors in non-native environments
  }

  if (!targetTimestamp || targetTimestamp <= Date.now() + 1000) {
    untrackVillageNotificationId(villageId, notificationId);
    return;
  }

  trackVillageNotificationId(villageId, notificationId);

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title,
          body,
          schedule: {
            at: new Date(targetTimestamp),
            allowWhileIdle: true,
          },
          sound: 'default',
        },
      ],
    });
  } catch {
    // Ignore errors in non-native environments
  }
}

async function scheduleBuilderNotificationsForVillage(
  villageId: string,
  villageName: string,
  results: LockedResultItem[]
): Promise<void> {
  const activeIndices = new Set(results.map((r) => r.builderIndex));

  // Cancel any inactive builder slots (0..6)
  for (let idx = 0; idx < 7; idx++) {
    if (!activeIndices.has(idx)) {
      await cancelSlotNotification(villageId, `builder_${idx}`);
    }
  }

  // Schedule active builder slots
  for (const item of results) {
    const buildingName = item.upgradeTitle || `Builder ${item.builderIndex + 1} Upgrade`;
    const itemLvl = typeof item.upgradeLevel === 'number' ? item.upgradeLevel : 1;
    await scheduleExactSlotNotification({
      villageId,
      slotKey: `builder_${item.builderIndex}`,
      title: `🔨 Builder Alert • ${villageName}`,
      body: `${villageName}: ${buildingName} (LVL ${itemLvl}) upgrade completed! Builder is now free.`,
      targetTimestamp: item.targetTimestamp,
    });
  }
}

async function scheduleLabNotificationsForVillage(
  villageId: string,
  villageName: string,
  mainTimer: BuilderTime,
  mainTargetTs: number | null,
  goblinTimer: BuilderTime,
  goblinTargetTs: number | null
): Promise<void> {
  if (mainTargetTs && getTimerTotalSeconds(mainTimer) > 0) {
    const troopSpellName = resolveUpgradeName(
      mainTimer.rawId,
      mainTimer.upgradeTitle || 'Troop / Spell Upgrade'
    );
    const itemLvl = typeof mainTimer.upgradeLevel === 'number' ? mainTimer.upgradeLevel : 1;
    await scheduleExactSlotNotification({
      villageId,
      slotKey: 'lab_main',
      title: `⚗️ Laboratory Alert • ${villageName}`,
      body: `${villageName}: ${troopSpellName} (LVL ${itemLvl}) research finished!`,
      targetTimestamp: mainTargetTs,
    });
  } else {
    await cancelSlotNotification(villageId, 'lab_main');
  }

  if (goblinTargetTs && getTimerTotalSeconds(goblinTimer) > 0) {
    const goblinTroopSpellName = resolveUpgradeName(
      goblinTimer.rawId,
      goblinTimer.upgradeTitle || 'Goblin Researcher'
    );
    const goblinItemLvl =
      typeof goblinTimer.upgradeLevel === 'number' ? goblinTimer.upgradeLevel : 1;
    await scheduleExactSlotNotification({
      villageId,
      slotKey: 'lab_goblin',
      title: `⚗️ Laboratory Alert • ${villageName}`,
      body: `${villageName}: ${goblinTroopSpellName} (LVL ${goblinItemLvl}) research finished!`,
      targetTimestamp: goblinTargetTs,
    });
  } else {
    await cancelSlotNotification(villageId, 'lab_goblin');
  }
}

async function schedulePetNotificationForVillage(
  villageId: string,
  villageName: string,
  petTimerVal: BuilderTime,
  targetPetFinishTimestamp: number | null
): Promise<void> {
  if (targetPetFinishTimestamp && getTimerTotalSeconds(petTimerVal) > 0) {
    const petName = resolveUpgradeName(
      petTimerVal.rawId,
      petTimerVal.upgradeTitle || 'Active Pet Upgrade'
    );
    const petLvl = typeof petTimerVal.upgradeLevel === 'number' ? petTimerVal.upgradeLevel : 1;
    await scheduleExactSlotNotification({
      villageId,
      slotKey: 'pet_main',
      title: `🐾 Pet House Alert • ${villageName}`,
      body: `${villageName}: ${petName} (LVL ${petLvl}) upgrade is complete! Pet is ready for battle.`,
      targetTimestamp: targetPetFinishTimestamp,
    });
  } else {
    await cancelSlotNotification(villageId, 'pet_main');
  }
}

async function cancelAllNotificationsForVillage(villageId: string): Promise<void> {
  const map = loadScheduledAlertsMap();
  const storedIds = Array.isArray(map[villageId]) ? map[villageId] : [];
  const deterministicSlotIds = [
    getSlotNotificationId(villageId, 'builder_0'),
    getSlotNotificationId(villageId, 'builder_1'),
    getSlotNotificationId(villageId, 'builder_2'),
    getSlotNotificationId(villageId, 'builder_3'),
    getSlotNotificationId(villageId, 'builder_4'),
    getSlotNotificationId(villageId, 'builder_5'),
    getSlotNotificationId(villageId, 'builder_6'),
    getSlotNotificationId(villageId, 'lab_main'),
    getSlotNotificationId(villageId, 'lab_goblin'),
    getSlotNotificationId(villageId, 'pet_main'),
  ];

  const uniqueIds = Array.from(new Set([...storedIds, ...deterministicSlotIds]));
  delete map[villageId];
  saveScheduledAlertsMap(map);

  if (uniqueIds.length > 0) {
    try {
      await LocalNotifications.cancel({
        notifications: uniqueIds.map((id) => ({ id })),
      });
    } catch {
      // Ignore errors in non-native environments
    }
  }
}

function createEmptyTimer(): BuilderTime {
  return {
    d: '',
    h: '',
    m: '',
    s: 0,
    upgradeTitle: undefined,
    upgradeLevel: undefined,
    rawId: undefined,
  };
}

function createEmptyBuilders(): BuilderTime[] {
  return Array.from({ length: 7 }, () => createEmptyTimer());
}

function createDefaultSavedState(): SavedState {
  return {
    mode: 'single',
    numBuilders: 2,
    builders: createEmptyBuilders(),
    potions: '',
    lockedResults: [],
    lockedSavedText: '',
    researchPotions: 1,
    labTimer: createEmptyTimer(),
    goblinLabTimer: createEmptyTimer(),
    targetLabTimestamp: null,
    labFormattedDate: '',
    labSavedText: '',
    targetGoblinLabTimestamp: null,
    goblinLabFormattedDate: '',
    petPotions: 1,
    petTimer: createEmptyTimer(),
    targetPetTimestamp: null,
    petFormattedDate: '',
    petSavedText: '',
  };
}

export function triggerHaptic(pattern: number | number[] = 15) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore vibration errors on unsupported devices
  }
}

export function resolveUpgradeName(
  rawData: number | string | undefined,
  fallback = 'Defense Upgrade'
): string {
  if (rawData === undefined || rawData === null) {
    return fallback;
  }
  const strKey = String(rawData).trim();
  const numKey = Number(strKey);
  const upgradeName =
    COC_NAMES[rawData] ||
    COC_NAMES[numKey] ||
    COC_NAMES[strKey] ||
    fallback;
  return upgradeName;
}

function normalizeSingleTimer(
  savedB: Partial<BuilderTime> | undefined,
  fallbackLabel?: string
): BuilderTime {
  if (!savedB || typeof savedB !== 'object') return createEmptyTimer();
  const rawId =
    savedB.rawId !== undefined && savedB.rawId !== null ? String(savedB.rawId) : undefined;
  const resolved = rawId ? resolveUpgradeName(rawId, fallbackLabel || '') : undefined;
  return {
    d: savedB.d ?? '',
    h: savedB.h ?? '',
    m: savedB.m ?? '',
    s: savedB.s ?? 0,
    upgradeTitle: resolved || savedB.upgradeTitle,
    upgradeLevel: typeof savedB.upgradeLevel === 'number' ? savedB.upgradeLevel : undefined,
    rawId,
  };
}

function normalizeSavedState(
  parsed: (Partial<SavedState> & {
    builders?: Array<BuilderTime & { customLabel?: string }>;
    lockedResults?: Array<LockedResultItem & { builderLabel?: string }>;
  }) | null | undefined
): SavedState {
  if (!parsed || typeof parsed !== 'object') {
    return createDefaultSavedState();
  }

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
    researchPotions:
      typeof parsed.researchPotions === 'number' && parsed.researchPotions >= 0
        ? parsed.researchPotions
        : 1,
    labTimer: normalizeSingleTimer(parsed.labTimer, 'Troop / Spell Upgrade'),
    goblinLabTimer: normalizeSingleTimer(parsed.goblinLabTimer, 'Goblin Researcher'),
    targetLabTimestamp:
      typeof parsed.targetLabTimestamp === 'number' ? parsed.targetLabTimestamp : null,
    labFormattedDate:
      typeof parsed.labFormattedDate === 'string' ? parsed.labFormattedDate : '',
    labSavedText: typeof parsed.labSavedText === 'string' ? parsed.labSavedText : '',
    targetGoblinLabTimestamp:
      typeof parsed.targetGoblinLabTimestamp === 'number'
        ? parsed.targetGoblinLabTimestamp
        : null,
    goblinLabFormattedDate:
      typeof parsed.goblinLabFormattedDate === 'string' ? parsed.goblinLabFormattedDate : '',
    petPotions:
      typeof parsed.petPotions === 'number' && parsed.petPotions >= 0
        ? parsed.petPotions
        : 1,
    petTimer: normalizeSingleTimer(parsed.petTimer, 'Active Pet Upgrade'),
    targetPetTimestamp:
      typeof parsed.targetPetTimestamp === 'number' ? parsed.targetPetTimestamp : null,
    petFormattedDate:
      typeof parsed.petFormattedDate === 'string' ? parsed.petFormattedDate : '',
    petSavedText: typeof parsed.petSavedText === 'string' ? parsed.petSavedText : '',
  };
}

function loadLegacySingleAccountState(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return createDefaultSavedState();
    return normalizeSavedState(JSON.parse(raw));
  } catch {
    return createDefaultSavedState();
  }
}

function loadMultiAccountStorage(): MultiAccountStorage {
  const fallbackMainState = loadLegacySingleAccountState();
  try {
    const rawAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!rawAccounts) {
      return {
        activeAccountId: 'main',
        accounts: [
          {
            id: 'main',
            name: 'Main Account',
            data: fallbackMainState,
          },
        ],
      };
    }

    const parsed = JSON.parse(rawAccounts) as Partial<MultiAccountStorage>;
    if (!Array.isArray(parsed.accounts) || parsed.accounts.length === 0) {
      return {
        activeAccountId: 'main',
        accounts: [
          {
            id: 'main',
            name: 'Main Account',
            data: fallbackMainState,
          },
        ],
      };
    }

    const normalizedAccounts: VillageProfile[] = parsed.accounts.map((acc, index) => ({
      id: acc.id || (index === 0 ? 'main' : `village_${index + 1}`),
      name: acc.name || (index === 0 ? 'Main Account' : `Village ${index + 1}`),
      tag: acc.tag,
      data: normalizeSavedState(acc.data),
    }));

    const hasActive = normalizedAccounts.some((a) => a.id === parsed.activeAccountId);
    return {
      activeAccountId: hasActive
        ? (parsed.activeAccountId as string)
        : normalizedAccounts[0].id,
      accounts: normalizedAccounts,
    };
  } catch {
    return {
      activeAccountId: 'main',
      accounts: [
        {
          id: 'main',
          name: 'Main Account',
          data: fallbackMainState,
        },
      ],
    };
  }
}

/**
 * 10x Builder Potion Math (1 potion = 10h progress in 1h real time; saves 9h)
 */
function calcRealTime(totalBuilderHours: number, potions: number): number {
  if (totalBuilderHours === 0) return 0;
  const maxPotionCoverageHours = potions * 10;
  if (totalBuilderHours <= maxPotionCoverageHours) {
    return totalBuilderHours / 10;
  } else {
    return totalBuilderHours - potions * 9;
  }
}

/**
 * 24x Research & Pet Potion Calculation Engine:
 * - 1 Potion = 24x Speed Boost for 1 Hour (3,600 seconds)
 * - 1 Hour of potion boost consumes 24 hours (86,400 seconds) of upgrade progress
 * - Effective time saved per potion = 23 hours (82,800 seconds)
 */
export function calc24xRealTimeSeconds(remainingSeconds: number, potionCount: number): number {
  if (remainingSeconds <= 0) return 0;
  const totalBoostCapacity = potionCount * 86400;
  if (remainingSeconds <= totalBoostCapacity) {
    return remainingSeconds / 24;
  } else {
    return potionCount * 3600 + (remainingSeconds - totalBoostCapacity);
  }
}

function formatCompletionDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatSavedSeconds(savedSeconds: number): string {
  if (savedSeconds <= 0) return '0h';
  const totalHours = Math.round(savedSeconds / 3600);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  let out = '';
  if (days > 0) out += `${days}d `;
  if (hours > 0 || days === 0) out += `${hours}h`;
  return out.trim();
}

function getTimerTotalSeconds(timer: BuilderTime): number {
  const d = Math.max(0, parseInt(timer.d, 10) || 0);
  const h = Math.min(24, Math.max(0, parseInt(timer.h, 10) || 0));
  const m = Math.min(60, Math.max(0, parseInt(timer.m, 10) || 0));
  const s = Math.max(0, timer.s || 0);
  return d * 86400 + h * 3600 + m * 60 + s;
}

function convertRawItemToTimer(item: RawCoCItem, fallbackTitle: string): BuilderTime {
  const timer = Math.max(0, Math.floor(item.timer || 0));
  const days = Math.floor(timer / 86400);
  const hours = Math.floor((timer % 86400) / 3600);
  const mins = Math.floor((timer % 3600) / 60);
  const secs = timer % 60;
  const itemData = item.data ?? item.id;
  const rawIdStr = itemData !== undefined && itemData !== null ? String(itemData) : undefined;
  const upgradeName = resolveUpgradeName(itemData, fallbackTitle);

  return {
    d: String(days),
    h: String(hours),
    m: String(mins),
    s: secs,
    upgradeTitle: upgradeName,
    upgradeLevel: typeof item.lvl === 'number' ? item.lvl : undefined,
    rawId: rawIdStr,
  };
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
const LiveHudTicker: React.FC<{
  targetTimestamp: number;
  label?: string;
  finishBadgeText?: string;
  accentColorClass?: string;
}> = React.memo(
  ({
    targetTimestamp,
    label = 'Live Countdown',
    finishBadgeText = '⚡ UPGRADE FINISHED! BUILDER FREE',
    accentColorClass = 'text-[#fbbf24]',
  }) => {
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
            {finishBadgeText}
          </span>
        </div>
      );
    }

    return (
      <div className="w-full">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
          {label}
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
            <span className={`text-[10px] font-bold ${accentColorClass}`}>d</span>
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
            <span className={`text-[10px] font-bold ${accentColorClass}`}>h</span>
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
              className={`inline-block text-base sm:text-lg font-extrabold ${accentColorClass} tracking-tight`}
            >
              {String(initialParts.s).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold text-gray-300">s</span>
          </div>
        </div>
      </div>
    );
  }
);

/**
 * Static 00:00:00:00 4-Unit HUD Ticker when no timer is locked yet
 */
const HudTickerIdle: React.FC<{
  label: string;
  accentUnitColorClass?: string;
  statusNote: string;
}> = ({ label, accentUnitColorClass = 'text-[#fbbf24]', statusNote }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{label}</p>
        <span className="text-[10px] font-extrabold text-gray-400">{statusNote}</span>
      </div>
      <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5">
        <div className="hud-unit flex-1 sm:flex-initial sm:min-w-[58px] rounded-xl px-2 py-1.5 flex items-baseline justify-center gap-0.5">
          <span className="text-base sm:text-lg font-extrabold text-[#f8fafc] tracking-tight">
            00
          </span>
          <span className={`text-[10px] font-bold ${accentUnitColorClass}`}>d</span>
        </div>
        <span className="text-gray-400 font-extrabold text-xs select-none">:</span>
        <div className="hud-unit flex-1 sm:flex-initial sm:min-w-[58px] rounded-xl px-2 py-1.5 flex items-baseline justify-center gap-0.5">
          <span className="text-base sm:text-lg font-extrabold text-[#f8fafc] tracking-tight">
            00
          </span>
          <span className={`text-[10px] font-bold ${accentUnitColorClass}`}>h</span>
        </div>
        <span className="text-gray-400 font-extrabold text-xs select-none">:</span>
        <div className="hud-unit flex-1 sm:flex-initial sm:min-w-[58px] rounded-xl px-2 py-1.5 flex items-baseline justify-center gap-0.5">
          <span className="text-base sm:text-lg font-extrabold text-[#f8fafc] tracking-tight">
            00
          </span>
          <span className="text-[10px] font-bold text-elixir">m</span>
        </div>
        <span className="text-gray-400 font-extrabold text-xs select-none">:</span>
        <div className="hud-unit flex-1 sm:flex-initial sm:min-w-[58px] rounded-xl px-2 py-1.5 flex items-baseline justify-center gap-0.5">
          <span className={`text-base sm:text-lg font-extrabold ${accentUnitColorClass} tracking-tight`}>
            00
          </span>
          <span className="text-[10px] font-bold text-gray-300">s</span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const initialMulti = loadMultiAccountStorage();
  const initialActiveProfile =
    initialMulti.accounts.find((a) => a.id === initialMulti.activeAccountId) ||
    initialMulti.accounts[0];
  const initial = initialActiveProfile.data;

  // Multi-Account State (isolated per village in localStorage)
  const [accounts, setAccounts] = useState<VillageProfile[]>(initialMulti.accounts);
  const [activeAccountId, setActiveAccountId] = useState<string>(initialActiveProfile.id);

  // Rename & Delete Village Profile Modal State
  const [renamingAccountId, setRenamingAccountId] = useState<string | null>(null);
  const [renameVillageInput, setRenameVillageInput] = useState<string>('');
  const [confirmDeleteVillage, setConfirmDeleteVillage] = useState<boolean>(false);

  // Segmented Category Navigation Tab ('builders' | 'laboratory' | 'pethouse')
  const [activeTab, setActiveTab] = useState<PlannerCategoryTab>('builders');

  // Active Account Builder Calculator State
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

  // Laboratory 24x Engine State (per account)
  const [researchPotions, setResearchPotions] = useState<number>(initial.researchPotions ?? 1);
  const [labTimer, setLabTimer] = useState<BuilderTime>(
    initial.labTimer || createEmptyTimer()
  );
  const [goblinLabTimer, setGoblinLabTimer] = useState<BuilderTime>(
    initial.goblinLabTimer || createEmptyTimer()
  );
  const [targetLabTimestamp, setTargetLabTimestamp] = useState<number | null>(
    initial.targetLabTimestamp ?? null
  );
  const [labFormattedDate, setLabFormattedDate] = useState<string>(
    initial.labFormattedDate || ''
  );
  const [labSavedText, setLabSavedText] = useState<string>(initial.labSavedText || '');
  const [targetGoblinLabTimestamp, setTargetGoblinLabTimestamp] = useState<number | null>(
    initial.targetGoblinLabTimestamp ?? null
  );
  const [goblinLabFormattedDate, setGoblinLabFormattedDate] = useState<string>(
    initial.goblinLabFormattedDate || ''
  );

  // Pet House 24x Engine State (per account)
  const [petPotions, setPetPotions] = useState<number>(initial.petPotions ?? 1);
  const [petTimer, setPetTimer] = useState<BuilderTime>(
    initial.petTimer || createEmptyTimer()
  );
  const [targetPetTimestamp, setTargetPetTimestamp] = useState<number | null>(
    initial.targetPetTimestamp ?? null
  );
  const [petFormattedDate, setPetFormattedDate] = useState<string>(
    initial.petFormattedDate || ''
  );
  const [petSavedText, setPetSavedText] = useState<string>(initial.petSavedText || '');

  // CoC Village JSON Import Modal & Add Account state
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isAddingNewAccount, setIsAddingNewAccount] = useState<boolean>(false);
  const [newVillageNameInput, setNewVillageNameInput] = useState<string>('');
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now();
    setToast({ id, type, text });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3500);
  };

  const getActiveVillageName = (targetId: string = activeAccountId): string => {
    const found = accounts.find((a) => a.id === targetId);
    return found?.name || 'Main Account';
  };

  // Request Capacitor LocalNotification permissions on first app launch
  useEffect(() => {
    void requestNotificationPermissions();
  }, []);

  const applySavedStateToActiveView = (d: SavedState) => {
    setCurrentMode(d.mode);
    setNumBuilders(d.numBuilders);
    setBuilders(d.builders);
    setPotionsInput(d.potions);
    setLockedResults(d.lockedResults || []);
    setSavedText(d.lockedSavedText || '');
    setShowResult((d.lockedResults?.length ?? 0) > 0);
    setResearchPotions(d.researchPotions ?? 1);
    setLabTimer(d.labTimer || createEmptyTimer());
    setGoblinLabTimer(d.goblinLabTimer || createEmptyTimer());
    setTargetLabTimestamp(d.targetLabTimestamp ?? null);
    setLabFormattedDate(d.labFormattedDate || '');
    setLabSavedText(d.labSavedText || '');
    setTargetGoblinLabTimestamp(d.targetGoblinLabTimestamp ?? null);
    setGoblinLabFormattedDate(d.goblinLabFormattedDate || '');
    setPetPotions(d.petPotions ?? 1);
    setPetTimer(d.petTimer || createEmptyTimer());
    setTargetPetTimestamp(d.targetPetTimestamp ?? null);
    setPetFormattedDate(d.petFormattedDate || '');
    setPetSavedText(d.petSavedText || '');
    setAnimKey((prev) => prev + 1);
  };

  // Sync current active account state into the accounts list and persist to localStorage
  useEffect(() => {
    try {
      const currentStateToSave: SavedState = {
        mode: currentMode,
        numBuilders,
        builders,
        potions: potionsInput,
        lockedResults,
        lockedSavedText: savedText,
        researchPotions,
        labTimer,
        goblinLabTimer,
        targetLabTimestamp,
        labFormattedDate,
        labSavedText,
        targetGoblinLabTimestamp,
        goblinLabFormattedDate,
        petPotions,
        petTimer,
        targetPetTimestamp,
        petFormattedDate,
        petSavedText,
      };

      // Keep legacy STORAGE_KEY synced with the active village profile
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentStateToSave));

      setAccounts((prevAccounts) => {
        const updatedAccounts = prevAccounts.map((acc) =>
          acc.id === activeAccountId ? { ...acc, data: currentStateToSave } : acc
        );
        const multiPayload: MultiAccountStorage = {
          activeAccountId,
          accounts: updatedAccounts,
        };
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(multiPayload));
        return updatedAccounts;
      });
    } catch {
      // Ignore storage quota errors
    }
  }, [
    activeAccountId,
    currentMode,
    numBuilders,
    builders,
    potionsInput,
    lockedResults,
    savedText,
    researchPotions,
    labTimer,
    goblinLabTimer,
    targetLabTimestamp,
    labFormattedDate,
    labSavedText,
    targetGoblinLabTimestamp,
    goblinLabFormattedDate,
    petPotions,
    petTimer,
    targetPetTimestamp,
    petFormattedDate,
    petSavedText,
  ]);

  // Switch between village profiles or open rename modal if clicking already-active chip
  const handleAccountChipClick = (account: VillageProfile) => {
    triggerHaptic(15);
    if (account.id === activeAccountId) {
      setRenamingAccountId(account.id);
      setRenameVillageInput(account.name);
      setConfirmDeleteVillage(false);
      return;
    }

    setActiveAccountId(account.id);
    applySavedStateToActiveView(account.data);
  };

  const handleOpenRenameModal = (account: VillageProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(15);
    setRenamingAccountId(account.id);
    setRenameVillageInput(account.name);
    setConfirmDeleteVillage(false);
  };

  const handleSaveRenamedVillage = () => {
    triggerHaptic(15);
    if (!renamingAccountId) return;
    const trimmed = renameVillageInput.trim();
    if (!trimmed) {
      showToast('error', 'Village name cannot be empty');
      return;
    }

    const targetAccount = accounts.find((acc) => acc.id === renamingAccountId);
    if (targetAccount) {
      const accData =
        renamingAccountId === activeAccountId
          ? {
              ...targetAccount.data,
              lockedResults,
              labTimer,
              goblinLabTimer,
              targetLabTimestamp,
              targetGoblinLabTimestamp,
              petTimer,
              targetPetTimestamp,
            }
          : targetAccount.data;

      void scheduleBuilderNotificationsForVillage(
        renamingAccountId,
        trimmed,
        accData.lockedResults || []
      );
      void scheduleLabNotificationsForVillage(
        renamingAccountId,
        trimmed,
        accData.labTimer || createEmptyTimer(),
        accData.targetLabTimestamp ?? null,
        accData.goblinLabTimer || createEmptyTimer(),
        accData.targetGoblinLabTimestamp ?? null
      );
      void schedulePetNotificationForVillage(
        renamingAccountId,
        trimmed,
        accData.petTimer || createEmptyTimer(),
        accData.targetPetTimestamp ?? null
      );
    }

    setAccounts((prev) => {
      const updated = prev.map((acc) =>
        acc.id === renamingAccountId ? { ...acc, name: trimmed } : acc
      );
      try {
        const multiPayload: MultiAccountStorage = {
          activeAccountId,
          accounts: updated,
        };
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(multiPayload));
      } catch {
        // Ignore storage error
      }
      return updated;
    });

    setRenamingAccountId(null);
    setRenameVillageInput('');
    setConfirmDeleteVillage(false);
    showToast('success', `Renamed village to "${trimmed}"`);
  };

  // Delete village profile & isolated timer data from localStorage + cancel its scheduled notifications
  const handleConfirmDeleteVillage = () => {
    triggerHaptic([20, 40, 20]);
    if (!renamingAccountId) return;

    const villageIdToDelete = renamingAccountId;
    void cancelAllNotificationsForVillage(villageIdToDelete);

    const targetIndex = accounts.findIndex((a) => a.id === villageIdToDelete);
    const deletedName =
      targetIndex >= 0 ? accounts[targetIndex].name : 'Village';
    const remainingAccounts = accounts.filter((a) => a.id !== villageIdToDelete);

    let nextAccountsList: VillageProfile[];
    let nextActiveProfile: VillageProfile;

    if (remainingAccounts.length === 0) {
      // Create a clean default village if none are left
      const freshDefaultState = createDefaultSavedState();
      nextActiveProfile = {
        id: 'main',
        name: 'Main Account',
        data: freshDefaultState,
      };
      nextAccountsList = [nextActiveProfile];
    } else {
      nextAccountsList = remainingAccounts;
      if (villageIdToDelete === activeAccountId) {
        const nearestIdx = Math.min(
          Math.max(0, targetIndex - 1),
          remainingAccounts.length - 1
        );
        nextActiveProfile = remainingAccounts[nearestIdx];
      } else {
        nextActiveProfile =
          remainingAccounts.find((a) => a.id === activeAccountId) ||
          remainingAccounts[0];
      }
    }

    setAccounts(nextAccountsList);
    setActiveAccountId(nextActiveProfile.id);
    applySavedStateToActiveView(nextActiveProfile.data);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextActiveProfile.data));
      const multiPayload: MultiAccountStorage = {
        activeAccountId: nextActiveProfile.id,
        accounts: nextAccountsList,
      };
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(multiPayload));
    } catch {
      // Ignore storage error
    }

    setRenamingAccountId(null);
    setRenameVillageInput('');
    setConfirmDeleteVillage(false);
    showToast('success', `Deleted "${deletedName}"`);
  };

  const handleOpenAddVillageModal = () => {
    triggerHaptic(15);
    setIsAddingNewAccount(true);
    setNewVillageNameInput(`Village ${accounts.length + 1}`);
    setJsonInputText('');
    setIsImportModalOpen(true);
  };

  const handleCreateEmptyVillage = () => {
    triggerHaptic(15);
    const trimmedName = newVillageNameInput.trim() || `Village ${accounts.length + 1}`;
    const newId = `village_${Date.now()}`;
    const emptyState = createDefaultSavedState();
    const newProfile: VillageProfile = {
      id: newId,
      name: trimmedName,
      data: emptyState,
    };

    const nextAccounts = [...accounts, newProfile];
    setAccounts(nextAccounts);
    setActiveAccountId(newId);
    applySavedStateToActiveView(emptyState);

    setIsImportModalOpen(false);
    setIsAddingNewAccount(false);
    setNewVillageNameInput('');
    setJsonInputText('');
    showToast('success', `Added ${trimmedName}!`);
  };

  const handleCategoryTabChange = (tab: PlannerCategoryTab) => {
    triggerHaptic(15);
    setActiveTab(tab);
  };

  const setMode = (mode: 'single' | 'multi') => {
    triggerHaptic(15);
    setCurrentMode(mode);
  };

  const handleBuilderCountChange = (nextCount: number) => {
    const clamped = Math.min(7, Math.max(1, nextCount));
    if (clamped !== numBuilders) {
      triggerHaptic(12);
      setNumBuilders(clamped);
    }
  };

  const clampTimeFieldValue = (field: 'd' | 'h' | 'm', rawVal: string): string => {
    const digits = rawVal.replace(/\D/g, '');
    if (digits === '') return '';
    let num = parseInt(digits, 10);
    if (field === 'h' && num > 24) num = 24;
    else if (field === 'm' && num > 60) num = 60;
    else if (field === 'd' && num > 999) num = 999;
    return String(num);
  };

  const handleBuilderTimeChange = (
    index: number,
    field: 'd' | 'h' | 'm',
    value: string
  ) => {
    const clamped = clampTimeFieldValue(field, value);
    setBuilders((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: clamped, s: 0 };
      return next;
    });
  };

  const applyPresetToBuilder = (
    index: number,
    deltaDays: number,
    deltaHours: number
  ) => {
    triggerHaptic(15);
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
    triggerHaptic(15);
    const cur = Math.max(0, parseInt(potionsInput, 10) || 0);
    const next = Math.min(999, Math.max(0, cur + delta));
    setPotionsInput(next === 0 ? '' : String(next));
  };

  // ============================================================================
  // 24x LABORATORY & PET HOUSE CALCULATION ENGINE + HUD SYNC
  // ============================================================================
  const computeLabScheduleValues = (
    mainTimerVal: BuilderTime,
    goblinTimerVal: BuilderTime,
    potionCount: number
  ) => {
    const now = Date.now();
    const mainRemSec = getTimerTotalSeconds(mainTimerVal);
    const goblinRemSec = getTimerTotalSeconds(goblinTimerVal);

    let nextMainTs: number | null = null;
    let nextMainDate = '';
    let mainSavedSec = 0;

    if (mainRemSec > 0) {
      const realElapsedSec = calc24xRealTimeSeconds(mainRemSec, potionCount);
      nextMainTs = now + Math.round(realElapsedSec * 1000);
      nextMainDate = formatCompletionDate(nextMainTs);
      mainSavedSec = Math.max(0, mainRemSec - realElapsedSec);
    }

    let nextGoblinTs: number | null = null;
    let nextGoblinDate = '';
    let goblinSavedSec = 0;

    if (goblinRemSec > 0) {
      const realElapsedSec = calc24xRealTimeSeconds(goblinRemSec, potionCount);
      nextGoblinTs = now + Math.round(realElapsedSec * 1000);
      nextGoblinDate = formatCompletionDate(nextGoblinTs);
      goblinSavedSec = Math.max(0, goblinRemSec - realElapsedSec);
    }

    const totalSavedSec = mainSavedSec + goblinSavedSec;
    return {
      nextMainTs,
      nextMainDate,
      nextGoblinTs,
      nextGoblinDate,
      nextLabSavedText: formatSavedSeconds(totalSavedSec),
    };
  };

  const computeLabSchedule = (
    mainTimerVal: BuilderTime,
    goblinTimerVal: BuilderTime,
    potionCount: number,
    targetVillageId: string = activeAccountId,
    targetVillageName: string = getActiveVillageName(activeAccountId)
  ) => {
    const res = computeLabScheduleValues(mainTimerVal, goblinTimerVal, potionCount);
    setTargetLabTimestamp(res.nextMainTs);
    setLabFormattedDate(res.nextMainDate);
    setTargetGoblinLabTimestamp(res.nextGoblinTs);
    setGoblinLabFormattedDate(res.nextGoblinDate);
    setLabSavedText(res.nextLabSavedText);

    void scheduleLabNotificationsForVillage(
      targetVillageId,
      targetVillageName,
      mainTimerVal,
      res.nextMainTs,
      goblinTimerVal,
      res.nextGoblinTs
    );

    return res;
  };

  const calculateLabFinish = () => {
    triggerHaptic(18);
    computeLabSchedule(labTimer, goblinLabTimer, researchPotions);
  };

  const adjustResearchPotions = (delta: number) => {
    triggerHaptic(15);
    const nextCount = Math.min(99, Math.max(0, researchPotions + delta));
    setResearchPotions(nextCount);
    if (getTimerTotalSeconds(labTimer) > 0 || getTimerTotalSeconds(goblinLabTimer) > 0) {
      computeLabSchedule(labTimer, goblinLabTimer, nextCount);
    }
  };

  const handleLabTimeChange = (
    slot: 'main' | 'goblin',
    field: 'd' | 'h' | 'm',
    value: string
  ) => {
    const clamped = clampTimeFieldValue(field, value);
    if (slot === 'main') {
      const nextMain = { ...labTimer, [field]: clamped, s: 0 };
      setLabTimer(nextMain);
      computeLabSchedule(nextMain, goblinLabTimer, researchPotions);
    } else {
      const nextGoblin = { ...goblinLabTimer, [field]: clamped, s: 0 };
      setGoblinLabTimer(nextGoblin);
      computeLabSchedule(labTimer, nextGoblin, researchPotions);
    }
  };

  const applyPresetToLab = (slot: 'main' | 'goblin', deltaDays: number, deltaHours: number) => {
    triggerHaptic(15);
    const current = slot === 'main' ? labTimer : goblinLabTimer;
    const curD = Math.max(0, parseInt(current.d, 10) || 0);
    const curH = Math.max(0, parseInt(current.h, 10) || 0);
    const curM = Math.max(0, parseInt(current.m, 10) || 0);

    const totalHours = curH + deltaHours;
    const extraDaysFromHours = Math.floor(totalHours / 24);
    const newH = totalHours % 24;
    const newD = Math.min(999, curD + deltaDays + extraDaysFromHours);

    const updated: BuilderTime = {
      ...current,
      d: newD > 0 ? String(newD) : current.d !== '' ? '0' : '',
      h: newH > 0 ? String(newH) : deltaHours > 0 || current.h !== '' ? String(newH) : '',
      m: curM > 0 ? String(curM) : current.m,
      s: 0,
    };

    if (slot === 'main') {
      setLabTimer(updated);
      computeLabSchedule(updated, goblinLabTimer, researchPotions);
    } else {
      setGoblinLabTimer(updated);
      computeLabSchedule(labTimer, updated, researchPotions);
    }
  };

  const clearLabSlot = (slot: 'main' | 'goblin') => {
    triggerHaptic(15);
    const empty = createEmptyTimer();
    if (slot === 'main') {
      setLabTimer(empty);
      computeLabSchedule(empty, goblinLabTimer, researchPotions);
    } else {
      setGoblinLabTimer(empty);
      computeLabSchedule(labTimer, empty, researchPotions);
    }
  };

  const computePetScheduleValues = (petTimerVal: BuilderTime, potionCount: number) => {
    const now = Date.now();
    const petRemSec = getTimerTotalSeconds(petTimerVal);

    if (petRemSec <= 0) {
      return {
        nextPetTs: null as number | null,
        nextPetDate: '',
        nextPetSavedText: '',
      };
    }

    const realElapsedSec = calc24xRealTimeSeconds(petRemSec, potionCount);
    const nextPetTs = now + Math.round(realElapsedSec * 1000);
    const savedSec = Math.max(0, petRemSec - realElapsedSec);

    return {
      nextPetTs,
      nextPetDate: formatCompletionDate(nextPetTs),
      nextPetSavedText: formatSavedSeconds(savedSec),
    };
  };

  const computePetSchedule = (
    petTimerVal: BuilderTime,
    potionCount: number,
    targetVillageId: string = activeAccountId,
    targetVillageName: string = getActiveVillageName(activeAccountId)
  ) => {
    const res = computePetScheduleValues(petTimerVal, potionCount);
    setTargetPetTimestamp(res.nextPetTs);
    setPetFormattedDate(res.nextPetDate);
    setPetSavedText(res.nextPetSavedText);

    void schedulePetNotificationForVillage(
      targetVillageId,
      targetVillageName,
      petTimerVal,
      res.nextPetTs
    );

    return res;
  };

  const calculatePetFinish = () => {
    triggerHaptic(18);
    computePetSchedule(petTimer, petPotions);
  };

  const adjustPetPotions = (delta: number) => {
    triggerHaptic(15);
    const nextCount = Math.min(99, Math.max(0, petPotions + delta));
    setPetPotions(nextCount);
    if (getTimerTotalSeconds(petTimer) > 0) {
      computePetSchedule(petTimer, nextCount);
    }
  };

  const handlePetTimeChange = (field: 'd' | 'h' | 'm', value: string) => {
    const clamped = clampTimeFieldValue(field, value);
    const nextPet = { ...petTimer, [field]: clamped, s: 0 };
    setPetTimer(nextPet);
    computePetSchedule(nextPet, petPotions);
  };

  const applyPresetToPet = (deltaDays: number, deltaHours: number) => {
    triggerHaptic(15);
    const curD = Math.max(0, parseInt(petTimer.d, 10) || 0);
    const curH = Math.max(0, parseInt(petTimer.h, 10) || 0);
    const curM = Math.max(0, parseInt(petTimer.m, 10) || 0);

    const totalHours = curH + deltaHours;
    const extraDaysFromHours = Math.floor(totalHours / 24);
    const newH = totalHours % 24;
    const newD = Math.min(999, curD + deltaDays + extraDaysFromHours);

    const updated: BuilderTime = {
      ...petTimer,
      d: newD > 0 ? String(newD) : petTimer.d !== '' ? '0' : '',
      h: newH > 0 ? String(newH) : deltaHours > 0 || petTimer.h !== '' ? String(newH) : '',
      m: curM > 0 ? String(curM) : petTimer.m,
      s: 0,
    };

    setPetTimer(updated);
    computePetSchedule(updated, petPotions);
  };

  const clearPetSlot = () => {
    triggerHaptic(15);
    const empty = createEmptyTimer();
    setPetTimer(empty);
    setTargetPetTimestamp(null);
    setPetFormattedDate('');
    setPetSavedText('');
    void cancelSlotNotification(activeAccountId, 'pet_main');
  };

  // ============================================================================
  // BUILDERS RESET & 10x CALCULATION ENGINE
  // ============================================================================
  const resetAllTimes = () => {
    triggerHaptic(15);
    setBuilders(createEmptyBuilders());
    setLockedResults([]);
    setSavedText('');
    setShowResult(false);
    void scheduleBuilderNotificationsForVillage(
      activeAccountId,
      getActiveVillageName(activeAccountId),
      []
    );
  };

  const resetBuilderTime = (index: number) => {
    triggerHaptic(15);
    void cancelSlotNotification(activeAccountId, `builder_${index}`);
    setBuilders((prev) => {
      const next = [...prev];
      next[index] = createEmptyTimer();
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
    triggerHaptic(15);
    setLockedResults([]);
    setSavedText('');
    setShowResult(false);
    void scheduleBuilderNotificationsForVillage(
      activeAccountId,
      getActiveVillageName(activeAccountId),
      []
    );
  };

  const runCalculationWithData = (
    targetMode: 'single' | 'multi',
    targetNumBuilders: number,
    targetBuilders: BuilderTime[],
    targetPotionsStr: string,
    targetVillageId: string = activeAccountId,
    targetVillageName: string = getActiveVillageName(activeAccountId)
  ): { computedResults: LockedResultItem[]; computedSavedText: string } => {
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
      const formattedDate = formatCompletionDate(targetTimestamp);

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

    void scheduleBuilderNotificationsForVillage(
      targetVillageId,
      targetVillageName,
      computedResults
    );

    if (computedResults.length === 0) {
      setLockedResults([]);
      setSavedText('');
      setShowResult(false);
      return { computedResults: [], computedSavedText: '' };
    }

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

    return { computedResults, computedSavedText };
  };

  const calculateTime = () => {
    triggerHaptic(18);
    runCalculationWithData(currentMode, numBuilders, builders, potionsInput);
  };

  // ============================================================================
  // 3. JSON PARSER EXPANSION (BUILDERS + LABORATORY + PET HOUSE)
  // ============================================================================
  const handleImportVillageJson = () => {
    triggerHaptic(15);
    void requestNotificationPermissions();

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

    // 1. Scan Home Village Builder arrays: buildings, traps, heroes
    const homeItems: RawCoCItem[] = [
      ...(Array.isArray(parsedData.buildings) ? parsedData.buildings : []),
      ...(Array.isArray(parsedData.traps) ? parsedData.traps : []),
      ...(Array.isArray(parsedData.heroes) ? parsedData.heroes : []),
    ];

    const activeBuilderUpgrades = homeItems.filter(
      (item) => item && typeof item.timer === 'number' && item.timer > 0
    );

    // 2. Scan Laboratory arrays: units, spells, siege_machines
    const labItems: RawCoCItem[] = [
      ...(Array.isArray(parsedData.units) ? parsedData.units : []),
      ...(Array.isArray(parsedData.spells) ? parsedData.spells : []),
      ...(Array.isArray(parsedData.siege_machines) ? parsedData.siege_machines : []),
    ];

    const activeLabUpgrades = labItems.filter(
      (item) => item && typeof item.timer === 'number' && item.timer > 0
    );

    // 3. Scan Pet House array: pets
    const petItems: RawCoCItem[] = Array.isArray(parsedData.pets) ? parsedData.pets : [];
    const activePetUpgrades = petItems.filter(
      (item) => item && typeof item.timer === 'number' && item.timer > 0
    );

    if (
      activeBuilderUpgrades.length === 0 &&
      activeLabUpgrades.length === 0 &&
      activePetUpgrades.length === 0
    ) {
      showToast('error', 'No active Home Village upgrades found');
      return;
    }

    // Map Builders (1..6 regular + slot 7 Goblin Builder)
    const goblinBuilderItem = activeBuilderUpgrades.find((item) => item.extra === true);
    const regularBuilderItems = activeBuilderUpgrades
      .filter((item) => item.extra !== true)
      .slice(0, 6);

    const nextBuilders: BuilderTime[] = createEmptyBuilders();
    regularBuilderItems.forEach((item, idx) => {
      nextBuilders[idx] = convertRawItemToTimer(item, 'Defense Upgrade');
    });

    if (goblinBuilderItem) {
      nextBuilders[6] = convertRawItemToTimer(goblinBuilderItem, 'Defense Upgrade');
    }

    const totalLoadedBuilders =
      regularBuilderItems.length + (goblinBuilderItem ? 1 : 0);
    const nextBuilderSliderCount = goblinBuilderItem
      ? 7
      : Math.max(1, Math.min(6, regularBuilderItems.length || 2));

    // Map Laboratory (standard extra !== true -> labTimer, extra === true -> goblinLabTimer)
    const standardLabItem = activeLabUpgrades.find((item) => item.extra !== true);
    const goblinLabItem = activeLabUpgrades.find((item) => item.extra === true);

    const nextLabTimer = standardLabItem
      ? convertRawItemToTimer(standardLabItem, 'Troop / Spell Upgrade')
      : createEmptyTimer();
    const nextGoblinLabTimer = goblinLabItem
      ? convertRawItemToTimer(goblinLabItem, 'Goblin Researcher')
      : createEmptyTimer();

    // Map Pet House (activePetUpgrades[0] -> petTimer)
    const activePetItem = activePetUpgrades[0];
    const nextPetTimer = activePetItem
      ? convertRawItemToTimer(activePetItem, 'Active Pet Upgrade')
      : createEmptyTimer();

    const targetPotions = isAddingNewAccount ? '' : potionsInput;
    const targetResPotions = isAddingNewAccount ? 1 : researchPotions;
    const targetPetPotionsCount = isAddingNewAccount ? 1 : petPotions;

    const extractedTag =
      typeof parsedData.tag === 'string' && parsedData.tag.trim()
        ? parsedData.tag.trim()
        : undefined;
    const newAccountName =
      newVillageNameInput.trim() ||
      (extractedTag ? `Village ${extractedTag}` : `Village ${accounts.length + 1}`);
    const newAccountId = `village_${Date.now()}`;

    const targetVillageId = isAddingNewAccount ? newAccountId : activeAccountId;
    const targetVillageName = isAddingNewAccount
      ? newAccountName
      : getActiveVillageName(activeAccountId);

    const { computedResults, computedSavedText } = runCalculationWithData(
      'multi',
      nextBuilderSliderCount,
      nextBuilders,
      targetPotions,
      targetVillageId,
      targetVillageName
    );

    const labSched = computeLabSchedule(
      nextLabTimer,
      nextGoblinLabTimer,
      targetResPotions,
      targetVillageId,
      targetVillageName
    );
    const petSched = computePetSchedule(
      nextPetTimer,
      targetPetPotionsCount,
      targetVillageId,
      targetVillageName
    );

    setLabTimer(nextLabTimer);
    setGoblinLabTimer(nextGoblinLabTimer);
    setPetTimer(nextPetTimer);

    if (isAddingNewAccount) {
      const newProfileState: SavedState = {
        ...createDefaultSavedState(),
        mode: 'multi',
        numBuilders: nextBuilderSliderCount,
        builders: nextBuilders,
        potions: targetPotions,
        lockedResults: computedResults,
        lockedSavedText: computedSavedText,
        researchPotions: targetResPotions,
        labTimer: nextLabTimer,
        goblinLabTimer: nextGoblinLabTimer,
        targetLabTimestamp: labSched.nextMainTs,
        labFormattedDate: labSched.nextMainDate,
        labSavedText: labSched.nextLabSavedText,
        targetGoblinLabTimestamp: labSched.nextGoblinTs,
        goblinLabFormattedDate: labSched.nextGoblinDate,
        petPotions: targetPetPotionsCount,
        petTimer: nextPetTimer,
        targetPetTimestamp: petSched.nextPetTs,
        petFormattedDate: petSched.nextPetDate,
        petSavedText: petSched.nextPetSavedText,
      };
      const newProfile: VillageProfile = {
        id: newAccountId,
        name: newAccountName,
        tag: extractedTag,
        data: newProfileState,
      };
      setAccounts((prev) => [...prev, newProfile]);
      setActiveAccountId(newAccountId);
      setPotionsInput(targetPotions);
      setResearchPotions(targetResPotions);
      setPetPotions(targetPetPotionsCount);
    }

    setCurrentMode('multi');
    setNumBuilders(nextBuilderSliderCount);
    setBuilders(nextBuilders);

    // Switch to most relevant tab if builders are empty
    if (totalLoadedBuilders > 0) {
      setActiveTab('builders');
    } else if (activeLabUpgrades.length > 0) {
      setActiveTab('laboratory');
    } else if (activePetUpgrades.length > 0) {
      setActiveTab('pethouse');
    }

    setIsImportModalOpen(false);
    setIsAddingNewAccount(false);
    setNewVillageNameInput('');
    setJsonInputText('');

    const summaryParts: string[] = [];
    if (totalLoadedBuilders > 0) summaryParts.push(`${totalLoadedBuilders} builders`);
    if (activeLabUpgrades.length > 0) summaryParts.push(`${activeLabUpgrades.length} lab`);
    if (activePetUpgrades.length > 0) summaryParts.push(`${activePetUpgrades.length} pet`);

    showToast('success', `Loaded ${summaryParts.join(', ')}!`);
  };

  const activeBuildersToRender = currentMode === 'single' ? 1 : numBuilders;

  // Find the upgrade finishing soonest among active locked results
  const soonestTargetTimestamp =
    lockedResults.length > 0
      ? Math.min(...lockedResults.map((r) => r.targetTimestamp))
      : null;

  const hasPetTimerInput = getTimerTotalSeconds(petTimer) > 0;

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

      <div className="glass-card w-full max-w-md rounded-3xl p-5 sm:p-7 relative overflow-hidden my-auto">
        {/* Decorative glowing orbs behind the content */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500 rounded-full mix-blend-screen filter blur-[50px] opacity-40 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-500 rounded-full mix-blend-screen filter blur-[50px] opacity-30 pointer-events-none"></div>

        {/* 1. BRANDING & HEADER UPDATE */}
        <div className="text-center mb-4 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide">
            <span className="text-white">Clash</span>{' '}
            <span className="text-planner-gradient">Planner</span>
          </h1>
          <p className="tagline-companion mt-1 uppercase">UPGRADE COMPANION</p>

          <div className="mt-3.5 flex justify-center">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setIsAddingNewAccount(false);
                setIsImportModalOpen(true);
              }}
              className="tactile inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-[#f8fafc] bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.25)] cursor-pointer"
            >
              <span>📥 Import CoC JSON</span>
            </button>
          </div>
        </div>

        {/* 2. MULTI-ACCOUNT PROFILE SWITCHER (WITH INLINE/MODAL RENAME & DELETE) */}
        <div className="bg-black/45 border border-white/10 rounded-2xl p-2 mb-3.5 relative z-10">
          <div className="account-bar-scroll flex items-center gap-2 overflow-x-auto">
            {accounts.map((account) => {
              const isActive = account.id === activeAccountId;
              return (
                <div
                  key={account.id}
                  onClick={() => handleAccountChipClick(account)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAccountChipClick(account);
                    }
                  }}
                  title={
                    isActive
                      ? 'Tap to edit or delete village profile'
                      : `Switch to ${account.name}`
                  }
                  className={`tactile shrink-0 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                    isActive ? 'account-chip-active' : 'account-chip-inactive'
                  }`}
                >
                  {isActive && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e] inline-block"
                      aria-hidden="true"
                    />
                  )}
                  <span>{account.name}</span>
                  <button
                    type="button"
                    onClick={(e) => handleOpenRenameModal(account, e)}
                    aria-label={`Edit ${account.name}`}
                    title={`Edit ${account.name}`}
                    className={`ml-0.5 px-1 py-0.5 rounded hover:bg-white/15 transition text-[10px] leading-none cursor-pointer ${
                      isActive ? 'text-[#fbbf24] opacity-90' : 'text-slate-400 opacity-70'
                    }`}
                  >
                    ✏️
                  </button>
                </div>
              );
            })}

            {/* Add Account Button: Dashed Minimalist Chip */}
            <button
              type="button"
              onClick={handleOpenAddVillageModal}
              className="tactile account-chip-add shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>+ Add Village</span>
            </button>
          </div>
        </div>

        {/* 3. SEGMENTED CATEGORY TABS (ZERO-CLUTTER NAVIGATION) */}
        <div className="grid grid-cols-3 gap-1.5 bg-black/50 p-1.5 rounded-2xl border border-white/10 mb-5 relative z-10">
          <button
            type="button"
            onClick={() => handleCategoryTabChange('builders')}
            className={`tactile py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
              activeTab === 'builders'
                ? 'seg-tab-builders-active'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🔨</span>
            <span className="truncate">Builders (6+1)</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategoryTabChange('laboratory')}
            className={`tactile py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
              activeTab === 'laboratory'
                ? 'seg-tab-lab-active'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⚗️</span>
            <span className="truncate">Laboratory</span>
          </button>

          <button
            type="button"
            onClick={() => handleCategoryTabChange('pethouse')}
            className={`tactile py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
              activeTab === 'pethouse'
                ? 'seg-tab-pet-active'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🐾</span>
            <span className="truncate">Pet House</span>
          </button>
        </div>

        {/* 4. TAB CONTENT CONTAINERS */}
        {/* ================================================================= */}
        {/* TAB 1: BUILDERS (6+1)                                             */}
        {/* ================================================================= */}
        {activeTab === 'builders' && (
          <div key="tab-builders" className="tab-panel-fade relative z-10">
            {/* Mode Toggle */}
            <div className="flex bg-black/40 rounded-xl p-1 mb-6 border border-white/10">
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
            <div className="space-y-6">
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
                  <span
                    className={
                      numBuilders === 7 ? 'text-[#22c55e] font-bold' : 'text-emerald-400/80'
                    }
                  >
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
                      <svg
                        className="w-3.5 h-3.5"
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

              {/* Potions Input with Tactile +/- Counter + 10x Speed Boost HUD Pill */}
              <div className="builder-card accent-gold rounded-2xl p-4">
                <label className="block text-base text-[#f8fafc] mb-2.5 font-extrabold flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span>🧪 Builder Potions Used</span>
                  </span>
                  {potionsInput && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(15);
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

                {/* Builder Potion Speed & Time Savings HUD Badge */}
                <div className="mt-3 flex justify-center">
                  <span className="builder-speed-pill">
                    10x Speed Boost (Saves 9h per potion)
                  </span>
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
              } mt-8 pt-6 border-t border-white/15`}
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
        )}

        {/* ================================================================= */}
        {/* TAB 2: LABORATORY (24x SPEED BOOST ENGINE & INTERACTIVE TIMERS)   */}
        {/* ================================================================= */}
        {activeTab === 'laboratory' && (
          <div key="tab-laboratory" className="tab-panel-fade space-y-4 relative z-10">
            {/* Dedicated Research Potion Counter HUD */}
            <div className="builder-card accent-hero rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#f0abfc]">
                  ⚗️ Research Boost HUD
                </span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-fuchsia-500/20 text-[#f0abfc] border border-fuchsia-400/40">
                  24x Speed Boost
                </span>
              </div>
              <div className="flex items-center justify-between gap-2.5 bg-black/40 rounded-xl p-2 border border-white/10">
                <button
                  type="button"
                  onClick={() => adjustResearchPotions(-1)}
                  className="tactile w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white font-extrabold text-lg flex items-center justify-center border border-white/15 cursor-pointer"
                  aria-label="Decrease Research Potion"
                >
                  −
                </button>
                <div className="text-center">
                  <div className="text-sm sm:text-base font-extrabold text-[#f8fafc]">
                    {researchPotions}{' '}
                    {researchPotions === 1 ? 'Research Potion' : 'Research Potions'}
                  </div>
                  <div className="text-[10px] font-bold text-fuchsia-300/90">
                    24x Speed Boost (Saves 23h per potion)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => adjustResearchPotions(1)}
                  className="tactile w-10 h-10 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-[#f0abfc] font-extrabold text-lg flex items-center justify-center border border-fuchsia-400/40 cursor-pointer"
                  aria-label="Increase Research Potion"
                >
                  +
                </button>
              </div>
            </div>

            {/* Interactive Card for Current Lab Troop/Spell Upgrade */}
            <div className="builder-card accent-hero rounded-2xl p-4">
              <div className="builder-header-sep flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="slot-badge-hero">[LAB]</span>
                  <span className="upgrade-title">
                    {labTimer.upgradeTitle || 'Troop / Spell Upgrade'}
                  </span>
                  {typeof labTimer.upgradeLevel === 'number' && (
                    <span className="lvl-chip">LVL {labTimer.upgradeLevel}</span>
                  )}
                </div>
                {(labTimer.d || labTimer.h || labTimer.m || labTimer.upgradeTitle) && (
                  <button
                    type="button"
                    onClick={() => clearLabSlot('main')}
                    className="tactile text-xs font-bold text-gray-200 hover:text-elixir transition flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/15 cursor-pointer"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              {/* Lab Days, Hours, Mins Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={labTimer.d}
                    onChange={(e) => handleLabTimeChange('main', 'd', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="999"
                    className="glass-input lab-input w-full rounded-xl py-3 px-2 text-center text-xl font-bold placeholder-gray-500"
                  />
                  <span className="text-xs font-semibold text-gray-200 text-center mt-1">
                    Days
                  </span>
                </div>
                <div className="flex flex-col">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={labTimer.h}
                    onChange={(e) => handleLabTimeChange('main', 'h', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="24"
                    className="glass-input lab-input w-full rounded-xl py-3 px-2 text-center text-xl font-bold placeholder-gray-500"
                  />
                  <span className="text-xs font-semibold text-gray-200 text-center mt-1">
                    Hours
                  </span>
                </div>
                <div className="flex flex-col">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={labTimer.m}
                    onChange={(e) => handleLabTimeChange('main', 'm', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="60"
                    className="glass-input lab-input w-full rounded-xl py-3 px-2 text-center text-xl font-bold placeholder-gray-500"
                  />
                  <span className="text-xs font-semibold text-gray-200 text-center mt-1">
                    Mins
                  </span>
                </div>
              </div>

              {/* Quick Time Presets for Lab */}
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
                    onClick={() => applyPresetToLab('main', preset.d, preset.h)}
                    className="tactile text-xs font-bold px-2.5 py-1 rounded-lg border bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-200 border-fuchsia-500/30 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => clearLabSlot('main')}
                  className="tactile text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 ml-auto cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {/* Locked Research HUD Ticker */}
              <div className="mt-3 pt-3 border-t border-white/10">
                {targetLabTimestamp ? (
                  <>
                    <div className="flex items-baseline justify-between gap-2 mb-2.5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-300 font-bold">
                        Completes On:
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-[#f0abfc]">
                        {labFormattedDate}
                      </span>
                    </div>
                    <LiveHudTicker
                      targetTimestamp={targetLabTimestamp}
                      label="Locked Research HUD Ticker"
                      finishBadgeText="⚡ RESEARCH FINISHED! LAB FREE"
                      accentColorClass="text-[#f0abfc]"
                    />
                  </>
                ) : (
                  <HudTickerIdle
                    label="Locked Research HUD Ticker"
                    accentUnitColorClass="text-[#f0abfc]"
                    statusNote="Enter Lab Time"
                  />
                )}
              </div>
            </div>

            {/* Interactive Card for Goblin Lab Researcher */}
            <div className="goblin-card accent-goblin rounded-2xl p-4">
              <div className="builder-header-sep flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="slot-badge-goblin">[GOBLIN LAB]</span>
                  <span className="upgrade-title">
                    {goblinLabTimer.upgradeTitle || 'Goblin Researcher'}
                  </span>
                  {typeof goblinLabTimer.upgradeLevel === 'number' && (
                    <span className="lvl-chip">LVL {goblinLabTimer.upgradeLevel}</span>
                  )}
                </div>
                {(goblinLabTimer.d || goblinLabTimer.h || goblinLabTimer.m || goblinLabTimer.upgradeTitle) ? (
                  <button
                    type="button"
                    onClick={() => clearLabSlot('goblin')}
                    className="tactile text-xs font-bold text-gray-200 hover:text-elixir transition flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/15 cursor-pointer"
                  >
                    ✕ Clear
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-wider">
                    👺 Extra Research
                  </span>
                )}
              </div>

              {/* Authentic In-Game Copy for Goblin Researcher */}
              <p className="text-xs text-gray-300 leading-relaxed mb-3">
                Secondary research slot powered by the Goblin Researcher for simultaneous laboratory upgrades.
              </p>

              {/* Goblin Lab Days, Hours, Mins Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={goblinLabTimer.d}
                    onChange={(e) => handleLabTimeChange('goblin', 'd', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="999"
                    className="glass-input goblin-input w-full rounded-xl py-3 px-2 text-center text-xl font-bold placeholder-gray-500"
                  />
                  <span className="text-xs font-semibold text-gray-200 text-center mt-1">
                    Days
                  </span>
                </div>
                <div className="flex flex-col">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={goblinLabTimer.h}
                    onChange={(e) => handleLabTimeChange('goblin', 'h', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="24"
                    className="glass-input goblin-input w-full rounded-xl py-3 px-2 text-center text-xl font-bold placeholder-gray-500"
                  />
                  <span className="text-xs font-semibold text-gray-200 text-center mt-1">
                    Hours
                  </span>
                </div>
                <div className="flex flex-col">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={goblinLabTimer.m}
                    onChange={(e) => handleLabTimeChange('goblin', 'm', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="60"
                    className="glass-input goblin-input w-full rounded-xl py-3 px-2 text-center text-xl font-bold placeholder-gray-500"
                  />
                  <span className="text-xs font-semibold text-gray-200 text-center mt-1">
                    Mins
                  </span>
                </div>
              </div>

              {/* Quick Time Presets for Goblin Lab */}
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
                    onClick={() => applyPresetToLab('goblin', preset.d, preset.h)}
                    className="tactile text-xs font-bold px-2.5 py-1 rounded-lg border bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border-emerald-500/30 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => clearLabSlot('goblin')}
                  className="tactile text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 ml-auto cursor-pointer"
                >
                  Clear
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10">
                {targetGoblinLabTimestamp ? (
                  <>
                    <div className="flex items-baseline justify-between gap-2 mb-2.5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-300 font-bold">
                        Completes On:
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-[#22c55e]">
                        {goblinLabFormattedDate}
                      </span>
                    </div>
                    <LiveHudTicker
                      targetTimestamp={targetGoblinLabTimestamp}
                      label="Goblin Research HUD Ticker"
                      finishBadgeText="⚡ GOBLIN RESEARCH FINISHED!"
                      accentColorClass="text-[#22c55e]"
                    />
                  </>
                ) : (
                  <HudTickerIdle
                    label="Goblin Research HUD Ticker"
                    accentUnitColorClass="text-[#22c55e]"
                    statusNote="Standby"
                  />
                )}
              </div>
            </div>

            {/* Calculate / Lock Lab Finish Button + Total Research Time Saved */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={calculateLabFinish}
                className="btn-calculate tactile flex-1 text-white font-bold text-base rounded-xl py-3.5 tracking-wide shadow-lg cursor-pointer"
              >
                Calculate Lab Finish
              </button>
            </div>

            {(targetLabTimestamp || targetGoblinLabTimestamp) && (
              <div className="bg-black/40 rounded-2xl p-4 border border-white/10 flex justify-between items-center">
                <p className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Research Time Saved
                </p>
                <div className="text-lg font-extrabold text-[#f0abfc]">
                  {labSavedText || '0h'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: PET HOUSE (24x SPEED BOOST ENGINE & INTERACTIVE TIMERS)    */}
        {/* ================================================================= */}
        {activeTab === 'pethouse' && (
          <div key="tab-pethouse" className="tab-panel-fade space-y-4 relative z-10">
            {/* Dedicated Pet Potion Counter HUD */}
            <div className="builder-card accent-pet rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                  🐾 Pet Potion Boost HUD
                </span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  24x Speed Boost
                </span>
              </div>
              <div className="flex items-center justify-between gap-2.5 bg-black/40 rounded-xl p-2 border border-white/10">
                <button
                  type="button"
                  onClick={() => adjustPetPotions(-1)}
                  className="tactile w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white font-extrabold text-lg flex items-center justify-center border border-white/15 cursor-pointer"
                  aria-label="Decrease Pet Potion"
                >
                  −
                </button>
                <div className="text-center">
                  <div className="text-sm sm:text-base font-extrabold text-[#f8fafc]">
                    {petPotions} {petPotions === 1 ? 'Pet Potion' : 'Pet Potions'}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-300/90">
                    24x Speed Boost (Saves 23h per potion)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => adjustPetPotions(1)}
                  className="tactile w-10 h-10 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-extrabold text-lg flex items-center justify-center border border-emerald-400/40 cursor-pointer"
                  aria-label="Increase Pet Potion"
                >
                  +
                </button>
              </div>
            </div>

            {/* Interactive Card for Active Pet Upgrade */}
            <div className="builder-card accent-pet rounded-2xl p-4">
              <div className="builder-header-sep flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="slot-badge-goblin">[PET]</span>
                  <span className="upgrade-title">
                    {petTimer.upgradeTitle || 'Active Pet Upgrade'}
                  </span>
                  {typeof petTimer.upgradeLevel === 'number' && (
                    <span className="lvl-chip">LVL {petTimer.upgradeLevel}</span>
                  )}
                </div>
                {(hasPetTimerInput || petTimer.upgradeTitle) ? (
                  <button
                    type="button"
                    onClick={clearPetSlot}
                    className="tactile text-xs font-bold text-gray-200 hover:text-elixir transition flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/15 cursor-pointer"
                  >
                    ✕ Clear
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                    Hero Pets
                  </span>
                )}
              </div>

              {/* Pet Days, Hours, Mins Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={petTimer.d}
                    onChange={(e) => handlePetTimeChange('d', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="999"
                    className="glass-input pet-input w-full rounded-xl py-3 px-2 text-center text-xl font-bold placeholder-gray-500"
                  />
                  <span className="text-xs font-semibold text-gray-200 text-center mt-1">
                    Days
                  </span>
                </div>
                <div className="flex flex-col">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={petTimer.h}
                    onChange={(e) => handlePetTimeChange('h', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="24"
                    className="glass-input pet-input w-full rounded-xl py-3 px-2 text-center text-xl font-bold placeholder-gray-500"
                  />
                  <span className="text-xs font-semibold text-gray-200 text-center mt-1">
                    Hours
                  </span>
                </div>
                <div className="flex flex-col">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={petTimer.m}
                    onChange={(e) => handlePetTimeChange('m', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="60"
                    className="glass-input pet-input w-full rounded-xl py-3 px-2 text-center text-xl font-bold placeholder-gray-500"
                  />
                  <span className="text-xs font-semibold text-gray-200 text-center mt-1">
                    Mins
                  </span>
                </div>
              </div>

              {/* Quick Time Presets for Pet House */}
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
                    onClick={() => applyPresetToPet(preset.d, preset.h)}
                    className="tactile text-xs font-bold px-2.5 py-1 rounded-lg border bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border-emerald-500/30 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearPetSlot}
                  className="tactile text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 ml-auto cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {/* Locked Pet HUD Ticker */}
              <div className="mt-3 pt-3 border-t border-white/10">
                {targetPetTimestamp ? (
                  <>
                    <div className="flex items-baseline justify-between gap-2 mb-2.5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-300 font-bold">
                        Completes On:
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-emerald-300">
                        {petFormattedDate}
                      </span>
                    </div>
                    <LiveHudTicker
                      targetTimestamp={targetPetTimestamp}
                      label="Locked Pet HUD Ticker"
                      finishBadgeText="⚡ PET UPGRADE FINISHED! PET READY"
                      accentColorClass="text-emerald-400"
                    />
                  </>
                ) : (
                  <HudTickerIdle
                    label="Locked Pet HUD Ticker"
                    accentUnitColorClass="text-emerald-400"
                    statusNote="Enter Pet Time"
                  />
                )}
              </div>
            </div>

            {/* Calculate / Lock Pet Finish Button + Total Pet Time Saved */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={calculatePetFinish}
                className="btn-calculate tactile flex-1 text-white font-bold text-base rounded-xl py-3.5 tracking-wide shadow-lg cursor-pointer"
              >
                Calculate Pet Finish
              </button>
            </div>

            {targetPetTimestamp && (
              <div className="bg-black/40 rounded-2xl p-4 border border-white/10 flex justify-between items-center">
                <p className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Pet Time Saved
                </p>
                <div className="text-lg font-extrabold text-emerald-300">
                  {petSavedText || '0h'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 4. OBSIDIAN DARK EDIT & DELETE VILLAGE PROFILE MODAL                */}
      {/* =================================================================== */}
      {renamingAccountId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => {
            setRenamingAccountId(null);
            setConfirmDeleteVillage(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 bg-[#090d16] border border-amber-400/35 shadow-[0_0_40px_rgba(0,0,0,0.9)] space-y-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">✏️</span>
                <h2 className="text-base sm:text-lg font-extrabold text-[#f8fafc]">
                  Village Profile Settings
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setRenamingAccountId(null);
                  setConfirmDeleteVillage(false);
                }}
                className="tactile text-gray-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#fbbf24] mb-1.5">
                Custom Village Name
              </label>
              <input
                type="text"
                value={renameVillageInput}
                onChange={(e) => setRenameVillageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveRenamedVillage();
                  }
                }}
                placeholder="e.g. TH17 Main, Donation Base, War Account"
                maxLength={28}
                autoFocus
                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm font-bold text-white placeholder-gray-500"
              />
              {/* Quick Preset Village Labels */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {['TH17 Main', 'War Account', 'Donation Base', 'Mini Base'].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      triggerHaptic(12);
                      setRenameVillageInput(suggestion);
                    }}
                    className="tactile text-[11px] font-bold px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Delete Village Action + Confirmation */}
            <div className="pt-2 border-t border-white/10">
              {!confirmDeleteVillage ? (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    setConfirmDeleteVillage(true);
                  }}
                  className="tactile w-full py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🗑️ Delete Village</span>
                </button>
              ) : (
                <div className="rounded-2xl p-3 bg-rose-950/60 border border-rose-500/40 space-y-2.5">
                  <p className="text-xs font-bold text-rose-200 text-center">
                    Delete this village and all its saved timers?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(12);
                        setConfirmDeleteVillage(false);
                      }}
                      className="tactile flex-1 py-2 rounded-xl text-xs font-bold text-gray-200 bg-white/10 hover:bg-white/15 border border-white/10 cursor-pointer"
                    >
                      Keep Village
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteVillage}
                      className="tactile flex-1 py-2 rounded-xl text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-500 border border-rose-400/50 shadow-lg cursor-pointer"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setRenamingAccountId(null);
                  setConfirmDeleteVillage(false);
                }}
                className="tactile flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-gray-200 bg-white/10 hover:bg-white/15 border border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRenamedVillage}
                className="btn-calculate tactile flex-1 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm text-white shadow-lg cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dark Obsidian JSON Import / Add Village Modal */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => {
            setIsImportModalOpen(false);
            setIsAddingNewAccount(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 bg-[#090d16] border border-white/15 shadow-[0_0_40px_rgba(0,0,0,0.85)] space-y-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{isAddingNewAccount ? '🏰' : '📥'}</span>
                <h2 className="text-lg font-extrabold text-[#f8fafc]">
                  {isAddingNewAccount ? 'Add New Village Profile' : 'Import CoC Village JSON'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setIsImportModalOpen(false);
                  setIsAddingNewAccount(false);
                }}
                className="tactile text-gray-400 hover:text-white text-sm font-bold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isAddingNewAccount && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#fbbf24] mb-1.5">
                  Village Profile Name
                </label>
                <input
                  type="text"
                  value={newVillageNameInput}
                  onChange={(e) => setNewVillageNameInput(e.target.value)}
                  placeholder="e.g. TH17 Main / Donation Base"
                  maxLength={28}
                  className="glass-input w-full rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-gray-500"
                />
              </div>
            )}

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
                rows={5}
                className="glass-input w-full rounded-2xl p-3.5 text-xs font-mono text-gray-100 placeholder-gray-500 resize-none focus:outline-none"
              />
              <button
                type="button"
                onClick={async () => {
                  triggerHaptic(15);
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

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setIsImportModalOpen(false);
                  setIsAddingNewAccount(false);
                }}
                className="tactile py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-gray-200 bg-white/10 hover:bg-white/15 border border-white/10 cursor-pointer"
              >
                Cancel
              </button>

              {isAddingNewAccount && !jsonInputText.trim() && (
                <button
                  type="button"
                  onClick={handleCreateEmptyVillage}
                  className="tactile flex-1 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-[#fbbf24] bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 cursor-pointer"
                >
                  Create Empty Village
                </button>
              )}

              <button
                type="button"
                onClick={handleImportVillageJson}
                className="btn-calculate tactile flex-1 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-white shadow-lg cursor-pointer"
              >
                {isAddingNewAccount ? 'Import & Add Village' : 'Import Timers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
