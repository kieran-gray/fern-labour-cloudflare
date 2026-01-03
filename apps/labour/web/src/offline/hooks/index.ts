export { networkDetector, useNetworkState } from '../sync/networkDetector';
export { clearQueryPersistence, getQueryCacheStats } from '../persistence/queryPersistence';
export { syncManager, useSyncState } from '../syncManager';
export { SyncManagerInitializer } from '../SyncManagerInitializer';
export {
  enqueueCommand,
  getPendingCommands,
  removeCommand,
  getPendingCount,
  clearAllCommands,
} from '../commandQueue';
export {
  useStartContractionOffline,
  useEndContractionOffline,
  useUpdateContractionOffline,
  useDeleteContractionOffline,
  generateContractionId,
} from '../useOfflineContraction';

export type { NetworkState } from '../sync/networkDetector';
export type { QueuedCommand } from '../commandQueue';
