import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  SubscriberRole,
  SubscriberStatus,
  SubscriptionReadModel,
} from '@base/clients/labour_service/types';
import { useAuth } from '@clerk/clerk-react';

export enum AppMode {
  Subscriber = 'Subscriber',
  Birth = 'Birth',
}

export enum SubscriberSessionState {
  NoSelection = 'no-selection',
  PendingApproval = 'pending-approval',
  Active = 'active',
}

export interface LabourSessionState {
  labourId: string | null;
  subscription: SubscriptionReadModel | null;
  mode: AppMode | null;
}

interface LabourSessionContextType extends LabourSessionState {
  canViewLabour: boolean;
  subscriberState: SubscriberSessionState;
  subscriberRole: SubscriberRole | null;

  setLabourId: (labourId: string | null) => void;
  setMode: (mode: AppMode | null) => void;
  selectSubscription: (subscription: SubscriptionReadModel) => void;
  updateSubscription: (subscription: SubscriptionReadModel) => void;
  clearSubscription: () => void;
  clearSession: () => void;
}

const LabourSessionContext = createContext<LabourSessionContextType | undefined>(undefined);

export const LabourSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId } = useAuth();

  const [mode, setModeState] = useState<AppMode | null>(() => {
    const stored = localStorage.getItem(`${userId}:appMode`);
    return stored === AppMode.Birth || stored === AppMode.Subscriber ? stored : null;
  });

  const [labourId, setLabourIdState] = useState<string | null>(() => {
    return localStorage.getItem(`${userId}:labourId`) || null;
  });

  const [subscription, setSubscriptionState] = useState<SubscriptionReadModel | null>(() => {
    const stored = localStorage.getItem(`${userId}:subscription`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (!userId) {
      return;
    }
    localStorage.setItem(`${userId}:appMode`, mode || '');
    localStorage.setItem(`${userId}:labourId`, labourId || '');
    localStorage.setItem(
      `${userId}:subscription`,
      subscription ? JSON.stringify(subscription) : ''
    );
  }, [mode, labourId, subscription, userId]);

  const subscriberState = useMemo((): SubscriberSessionState => {
    if (!subscription) {
      return SubscriberSessionState.NoSelection;
    }
    if (subscription.status === SubscriberStatus.SUBSCRIBED) {
      return SubscriberSessionState.Active;
    }
    if (subscription.status === SubscriberStatus.REQUESTED) {
      return SubscriberSessionState.PendingApproval;
    }
    // UNSUBSCRIBED, REMOVED, BLOCKED - treat as no selection
    return SubscriberSessionState.NoSelection;
  }, [subscription]);

  const subscriberRole = useMemo((): SubscriberRole | null => {
    return subscription?.role || null;
  }, [subscription]);

  const canViewLabour = useMemo((): boolean => {
    if (mode === AppMode.Birth) {
      return labourId !== null;
    }
    if (mode === AppMode.Subscriber) {
      return subscriberState === SubscriberSessionState.Active;
    }
    return false;
  }, [mode, labourId, subscriberState]);

  const setLabourId = useCallback((id: string | null) => {
    setLabourIdState(id);
  }, []);

  const setMode = useCallback((newMode: AppMode | null) => {
    clearSession();
    setModeState(newMode);
  }, []);

  const selectSubscription = useCallback((sub: SubscriptionReadModel) => {
    setSubscriptionState(sub);
    setLabourIdState(sub.labour_id);
  }, []);

  const updateSubscription = useCallback((sub: SubscriptionReadModel) => {
    setSubscriptionState(sub);
  }, []);

  const clearSubscription = useCallback(() => {
    setSubscriptionState(null);
    setLabourIdState(null);
  }, []);

  const clearSession = useCallback(() => {
    setLabourIdState(null);
    setSubscriptionState(null);
    setModeState(null);
  }, []);

  const value: LabourSessionContextType = {
    labourId,
    subscription,
    mode,
    canViewLabour,
    subscriberState,
    subscriberRole,
    setLabourId,
    setMode,
    selectSubscription,
    updateSubscription,
    clearSubscription,
    clearSession,
  };

  return <LabourSessionContext.Provider value={value}>{children}</LabourSessionContext.Provider>;
};

export const useLabourSession = () => {
  const context = useContext(LabourSessionContext);
  if (context === undefined) {
    throw new Error('useLabourSession must be used within a LabourSessionProvider');
  }
  return context;
};
