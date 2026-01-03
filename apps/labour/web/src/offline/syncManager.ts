import { useEffect, useState } from 'react';
import type { LabourServiceClient } from '@base/clients/labour_service';
import { getPendingCommands, getPendingCount, removeCommand } from './commandQueue';
import { networkDetector } from './sync/networkDetector';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastError?: string;
}

type SyncListener = (state: SyncState) => void;

class SyncManager {
  private client: LabourServiceClient | null = null;
  private isSyncing = false;
  private listeners = new Set<SyncListener>();
  private state: SyncState = { status: 'idle', pendingCount: 0 };
  private initialized = false;

  initialize(client: LabourServiceClient) {
    this.client = client;

    if (this.initialized) {
      return;
    }
    this.initialized = true;

    networkDetector.subscribe((networkState) => {
      if (networkState.isOnline && !this.isSyncing) {
        setTimeout(() => this.sync(), 1000);
      }
    });

    if (navigator.onLine) {
      this.sync();
    }

    this.updatePendingCount();
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  async sync(): Promise<void> {
    if (!this.client || this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;
    this.updateState({ status: 'syncing' });

    try {
      const commands = await getPendingCommands();

      for (const queuedCommand of commands) {
        if (!navigator.onLine) {
          break;
        }

        try {
          const response = await this.client.executeRawCommand(queuedCommand.command);

          if (response.success) {
            await removeCommand(queuedCommand.id);
          } else {
            console.warn('[SyncManager] Command failed:', response.error);
            await removeCommand(queuedCommand.id);
          }
        } catch (error) {
          // Skip commands on error. Should be fine.
          console.error('[SyncManager] Sync error:', error);
          this.updateState({
            status: 'error',
            lastError: error instanceof Error ? error.message : 'Sync failed',
          });
          break;
        }
      }

      await this.updatePendingCount();
      if (this.state.pendingCount === 0) {
        this.updateState({ status: 'idle', lastError: undefined });
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async updatePendingCount(): Promise<void> {
    try {
      const count = await getPendingCount();
      this.updateState({ pendingCount: count });
    } catch {
      // Ignore errors
    }
  }

  private updateState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch {
        // Ignore listener errors
      }
    });
  }

  getState(): SyncState {
    return this.state;
  }

  async refreshPendingCount(): Promise<number> {
    await this.updatePendingCount();
    return this.state.pendingCount;
  }
}

export const syncManager = new SyncManager();

export function useSyncState(): SyncState {
  const [state, setState] = useState<SyncState>(syncManager.getState());

  useEffect(() => {
    return syncManager.subscribe(setState);
  }, []);

  return state;
}
