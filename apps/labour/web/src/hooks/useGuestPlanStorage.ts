/**
 * Guest Plan Storage Hook
 *
 * Manages temporary plan data in localStorage for unauthenticated users.
 * Data is prefixed with 'guest:' and has a 7-day expiry.
 */

import { AppMode } from '@base/contexts/LabourSessionContext';

const STORAGE_PREFIX = 'guest:';
const EXPIRY_DAYS = 7;

export interface GuestPlanData {
  dueDate: string; // ISO date string
  firstLabour: boolean;
  labourName?: string;
  savedAt: number; // timestamp
}

export interface GuestStorageData {
  pendingPlan: GuestPlanData | null;
  selectedMode: AppMode | null;
}

const KEYS = {
  pendingPlan: `${STORAGE_PREFIX}pendingPlan`,
  selectedMode: `${STORAGE_PREFIX}selectedMode`,
} as const;

function isExpired(timestamp: number): boolean {
  const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - timestamp > expiryMs;
}

export function useGuestPlanStorage() {
  const savePlan = (data: Omit<GuestPlanData, 'savedAt'>) => {
    const planData: GuestPlanData = {
      ...data,
      savedAt: Date.now(),
    };
    localStorage.setItem(KEYS.pendingPlan, JSON.stringify(planData));
  };

  const getPendingPlan = (): GuestPlanData | null => {
    const stored = localStorage.getItem(KEYS.pendingPlan);
    if (!stored) {
      return null;
    }

    try {
      const data: GuestPlanData = JSON.parse(stored);
      if (isExpired(data.savedAt)) {
        localStorage.removeItem(KEYS.pendingPlan);
        return null;
      }
      return data;
    } catch {
      localStorage.removeItem(KEYS.pendingPlan);
      return null;
    }
  };

  const saveMode = (mode: AppMode) => {
    localStorage.setItem(KEYS.selectedMode, mode);
  };

  const getSelectedMode = (): AppMode | null => {
    const stored = localStorage.getItem(KEYS.selectedMode);
    if (stored === AppMode.Birth || stored === AppMode.Subscriber) {
      return stored;
    }
    return null;
  };

  const clearGuestData = () => {
    localStorage.removeItem(KEYS.pendingPlan);
    localStorage.removeItem(KEYS.selectedMode);
  };

  const hasPendingPlan = (): boolean => {
    return getPendingPlan() !== null;
  };

  const hasPendingData = (): boolean => {
    return hasPendingPlan() || getSelectedMode() !== null;
  };

  return {
    savePlan,
    getPendingPlan,
    saveMode,
    getSelectedMode,
    clearGuestData,
    hasPendingPlan,
    hasPendingData,
  };
}
