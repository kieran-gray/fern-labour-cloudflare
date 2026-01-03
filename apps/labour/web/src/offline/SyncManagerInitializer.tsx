import { useEffect, useRef } from 'react';
import { useWebSocket } from '@base/contexts/WebsocketContext';
import { useLabourClient } from '@base/hooks/useLabourClient';
import { syncManager } from './syncManager';

export function SyncManagerInitializer() {
  const client = useLabourClient();
  const { isConnected } = useWebSocket();
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    syncManager.initialize(client);
  }, [client]);

  useEffect(() => {
    if (isConnected && !wasConnectedRef.current) {
      syncManager.sync();
    }
    wasConnectedRef.current = isConnected;
  }, [isConnected]);

  return null;
}
