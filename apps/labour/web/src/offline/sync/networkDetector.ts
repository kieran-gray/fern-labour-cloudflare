import { useCallback, useEffect, useState } from 'react';

export interface NetworkState {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export function useNetworkState(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>(() => {
    return getNetworkState();
  });

  const updateNetworkState = useCallback(() => {
    setNetworkState(getNetworkState());
  }, []);

  useEffect(() => {
    window.addEventListener('online', updateNetworkState);
    window.addEventListener('offline', updateNetworkState);

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener?.('change', updateNetworkState);

      if (
        connection &&
        typeof connection.dispatchEvent === 'function' &&
        !(connection as any).__patchedDispatch
      ) {
        const originalDispatch = connection.dispatchEvent;
        connection.dispatchEvent = function (event: any) {
          const result = originalDispatch.call(this, event);
          if (event?.type === 'change') {
            updateNetworkState();
          }
          return result;
        };
        (connection as any).__patchedDispatch = true;
      }

      return () => {
        window.removeEventListener('online', updateNetworkState);
        window.removeEventListener('offline', updateNetworkState);
        connection?.removeEventListener?.('change', updateNetworkState);
      };
    }

    return () => {
      window.removeEventListener('online', updateNetworkState);
      window.removeEventListener('offline', updateNetworkState);
    };
  }, [updateNetworkState]);

  return networkState;
}

function getNetworkState(): NetworkState {
  const isOnline = navigator.onLine;

  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      isOnline,
      connectionType: connection?.type,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    };
  }

  return { isOnline };
}

export class NetworkDetector {
  private listeners: Array<(state: NetworkState) => void> = [];
  private currentState: NetworkState = getNetworkState();

  constructor() {
    this.setupListeners();
  }

  getState(): NetworkState {
    return this.currentState;
  }

  subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  isSyncable(): boolean {
    if (!this.currentState.isOnline) {
      return false;
    }

    if (this.currentState.effectiveType) {
      return this.currentState.effectiveType !== 'slow-2g';
    }

    return true;
  }

  async testConnectivity(timeoutMs: number = 5000): Promise<boolean> {
    if (!this.currentState.isOnline) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      console.warn('Connectivity test failed:', error);
      return false;
    }
  }

  private setupListeners(): void {
    const updateState = () => {
      const newState = getNetworkState();
      const stateChanged = JSON.stringify(newState) !== JSON.stringify(this.currentState);

      if (stateChanged) {
        this.currentState = newState;
        this.notifyListeners(newState);
      }
    };

    window.addEventListener('online', updateState);
    window.addEventListener('offline', updateState);

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener?.('change', updateState);

      if (
        connection &&
        typeof connection.dispatchEvent === 'function' &&
        !(connection as any).__patchedDispatch
      ) {
        const originalDispatch = connection.dispatchEvent;
        connection.dispatchEvent = function (event: any) {
          const result = originalDispatch.call(this, event);
          if (event?.type === 'change') {
            updateState();
          }
          return result;
        };
        (connection as any).__patchedDispatch = true;
      }
    }
  }

  private notifyListeners(state: NetworkState): void {
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        // Ignore errors
      }
    });
  }
}

export const networkDetector = new NetworkDetector();
