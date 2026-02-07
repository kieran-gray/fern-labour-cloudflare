import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLabourSession } from '@base/contexts';
import { useAuth } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  ConnectionState,
  IncomingMessage,
  OutgoingMessage,
  PendingCommand,
  WebSocketContextValue,
} from './websocket/websocket.types';
// eslint-disable-next-line no-duplicate-imports
import { DEFAULT_WEBSOCKET_CONFIG } from './websocket/websocket.types';
import {
  buildAuthProtocols,
  buildOutgoingMessage,
  buildPingMessage,
  buildWebSocketUrl,
  calculateReconnectDelay,
  generateCorrelationId,
  hasExceededMaxAttempts,
  isConnectionStale,
  isPongMessage,
} from './websocket/websocket.utils';

export type { ConnectionState, WebSocketContextValue } from './websocket/websocket.types';

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const { labourId } = useLabourSession();
  const queryClient = useQueryClient();

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Set<(message: IncomingMessage) => void>>(new Set());
  const pendingCommandsRef = useRef<Map<string, PendingCommand>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();

  const reconnectAttemptRef = useRef(0);
  const shouldReconnectRef = useRef(false);

  const isOnlineRef = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const lastPongRef = useRef<number>(Date.now());
  const hiddenAtRef = useRef<number | null>(null);

  const stopHeartbeat = () => {
    clearInterval(pingIntervalRef.current);
  };

  const startHeartbeat = (ws: WebSocket) => {
    stopHeartbeat();
    lastPongRef.current = Date.now();

    pingIntervalRef.current = setInterval(() => {
      if (isConnectionStale(lastPongRef.current, DEFAULT_WEBSOCKET_CONFIG.pongTimeout)) {
        console.log('[WebSocket] Connection stale (no pong received), forcing reconnect');
        ws.close();
        return;
      }

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(buildPingMessage());
      }
    }, DEFAULT_WEBSOCKET_CONFIG.pingInterval);
  };

  const scheduleReconnect = (connectFn: () => void) => {
    if (!shouldReconnectRef.current || !isOnlineRef.current) {
      return;
    }

    if (hasExceededMaxAttempts(reconnectAttemptRef.current)) {
      console.log('[WebSocket] Max reconnection attempts reached');
      setConnectionState('failed');
      return;
    }

    const delay = calculateReconnectDelay(reconnectAttemptRef.current);
    console.log(
      `[WebSocket] Reconnect attempt ${reconnectAttemptRef.current + 1}/${DEFAULT_WEBSOCKET_CONFIG.maxReconnectAttempts} in ${Math.round(delay)}ms`
    );

    setConnectionState('reconnecting');
    reconnectTimeoutRef.current = setTimeout(connectFn, delay);
  };

  const handleMessage = (event: MessageEvent) => {
    const message: IncomingMessage = JSON.parse(event.data);

    if (isPongMessage(message)) {
      lastPongRef.current = Date.now();
      return;
    }

    if (message.correlation_id) {
      const pending = pendingCommandsRef.current.get(message.correlation_id);
      if (pending) {
        clearTimeout(pending.timeout);
        pendingCommandsRef.current.delete(message.correlation_id);

        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          pending.resolve({
            data: message.data,
            success: message.success ?? true,
          });
        }
      }
    }
    subscribersRef.current.forEach((callback) => callback(message));
  };

  const rejectAllPending = (error: Error) => {
    pendingCommandsRef.current.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(error);
    });
    pendingCommandsRef.current.clear();
  };

  useEffect(() => {
    if (!labourId) {
      shouldReconnectRef.current = false;
      clearTimeout(reconnectTimeoutRef.current);
      stopHeartbeat();
      wsRef.current?.close();
      setConnectionState('disconnected');
      return;
    }

    shouldReconnectRef.current = true;

    const connect = async () => {
      if (
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING
      ) {
        return;
      }

      if (!navigator.onLine) {
        console.log('[WebSocket] Device offline, waiting for network');
        setConnectionState('disconnected');
        return;
      }

      setConnectionState('connecting');

      try {
        const token = await getToken();
        if (!token) {
          console.error('[WebSocket] Failed to get auth token');
          scheduleReconnect(connect);
          return;
        }

        const wsUrl = buildWebSocketUrl(
          import.meta.env.VITE_LABOUR_SERVICE_WEBSOCKET || '',
          labourId
        );
        const protocols = buildAuthProtocols(token);

        const ws = new WebSocket(wsUrl, protocols);

        ws.onopen = () => {
          console.log('[WebSocket] Connected');
          setConnectionState('connected');
          wsRef.current = ws;
          reconnectAttemptRef.current = 0;
          queryClient.invalidateQueries({ refetchType: 'active' });
          startHeartbeat(ws);
        };

        ws.onmessage = handleMessage;

        ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
        };

        ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          setConnectionState('disconnected');
          wsRef.current = null;
          stopHeartbeat();
          rejectAllPending(new Error('WebSocket disconnected'));

          if (shouldReconnectRef.current) {
            reconnectAttemptRef.current++;
            scheduleReconnect(connect);
          }
        };
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        if (shouldReconnectRef.current) {
          reconnectAttemptRef.current++;
          scheduleReconnect(connect);
        }
      }
    };

    const handleOnline = () => {
      console.log('[WebSocket] Network online');
      isOnlineRef.current = true;
      reconnectAttemptRef.current = 0;
      clearTimeout(reconnectTimeoutRef.current);
      connect();
    };

    const handleOffline = () => {
      console.log('[WebSocket] Network offline');
      isOnlineRef.current = false;
      clearTimeout(reconnectTimeoutRef.current);
      stopHeartbeat();
      wsRef.current?.close();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        stopHeartbeat();
      } else if (document.visibilityState === 'visible') {
        const hiddenDuration = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
        hiddenAtRef.current = null;

        console.log(`[WebSocket] Visible after ${Math.round(hiddenDuration / 1000)}s`);
        reconnectAttemptRef.current = 0;
        wsRef.current?.close();
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, 100);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    connect();

    return () => {
      shouldReconnectRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(reconnectTimeoutRef.current);
      stopHeartbeat();
      wsRef.current?.close();
    };
  }, [labourId, getToken]);

  const sendMessage = (message: OutgoingMessage): Promise<{ data: unknown; success: boolean }> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const correlationId = generateCorrelationId();

      const timeout = setTimeout(() => {
        pendingCommandsRef.current.delete(correlationId);
        reject(new Error('Message timeout - no response received'));
      }, DEFAULT_WEBSOCKET_CONFIG.messageTimeout);

      pendingCommandsRef.current.set(correlationId, { resolve, reject, timeout });

      const outgoing = buildOutgoingMessage(correlationId, message.kind, message.payload);
      wsRef.current.send(outgoing);
    });
  };

  const subscribe = (callback: (message: IncomingMessage) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  };

  const retryConnection = () => {
    console.log('[WebSocket] Manual retry');
    reconnectAttemptRef.current = 0;
    setConnectionState('connecting');
    if (wsRef.current) {
      wsRef.current.close();
    } else {
      shouldReconnectRef.current = true;
    }
  };

  const isConnected = connectionState === 'connected';

  return (
    <WebSocketContext.Provider
      value={{ isConnected, connectionState, sendMessage, subscribe, retryConnection }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}
