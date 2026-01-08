import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLabourSession } from '@base/contexts';
import { useAuth } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketContextValue {
  isConnected: boolean;
  sendMessage: (message: {
    kind: 'Command' | 'Query' | 'ServerTimestamp';
    payload: any;
  }) => Promise<any>;
  subscribe: (callback: (message: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const { labourId } = useLabourSession();
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Set<(message: any) => void>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const currentLabourIdRef = useRef<string | null>(null);
  const shouldReconnectRef = useRef(false);
  const hiddenAtRef = useRef<number | null>(null);
  const pendingCommandsRef = useRef<
    Map<
      string,
      { resolve: (value: any) => void; reject: (error: any) => void; timeout: NodeJS.Timeout }
    >
  >(new Map());

  useEffect(() => {
    if (!labourId) {
      shouldReconnectRef.current = false;
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
      return;
    }

    shouldReconnectRef.current = true;
    currentLabourIdRef.current = labourId;

    const connect = async () => {
      if (
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING
      ) {
        return;
      }

      try {
        const token = await getToken();
        const wsUrl = import.meta.env.VITE_LABOUR_SERVICE_WEBSOCKET || '';

        const ws = new WebSocket(
          `${wsUrl}${labourId}`,
          `base64url.bearer.authorization.fernlabour.com.${token}`
        );

        ws.onopen = () => {
          console.log('[WebSocket] Connected');
          setIsConnected(true);
          wsRef.current = ws;
          queryClient.invalidateQueries({ refetchType: 'active' });
        };

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);

          if (message.correlation_id && pendingCommandsRef.current.has(message.correlation_id)) {
            const pending = pendingCommandsRef.current.get(message.correlation_id);
            if (pending) {
              clearTimeout(pending.timeout);
              pendingCommandsRef.current.delete(message.correlation_id);

              if (message.error) {
                pending.reject(new Error(message.error));
              } else {
                pending.resolve({
                  data: message.data,
                  success: message.success,
                });
              }
            }
          }

          subscribersRef.current.forEach((callback) => callback(message));
        };

        ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
        };

        ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          setIsConnected(false);
          wsRef.current = null;

          if (shouldReconnectRef.current) {
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
          }
        };
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        if (shouldReconnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      }
    };

    const handleOnline = () => {
      console.log('[WebSocket] Network online, attempting reconnect');
      clearTimeout(reconnectTimeoutRef.current);
      connect();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const hiddenDuration = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
        hiddenAtRef.current = null;

        console.log(
          `[WebSocket] App became visible after ${Math.round(hiddenDuration / 1000)}s, forcing reconnect`
        );
        if (wsRef.current) {
          wsRef.current.close();
        }
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, 100);
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    connect();

    return () => {
      shouldReconnectRef.current = false;
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [labourId, getToken]);

  const sendMessage = (message: {
    kind: 'Command' | 'Query' | 'ServerTimestamp';
    payload: any;
  }): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const correlationId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      const timeout = setTimeout(() => {
        pendingCommandsRef.current.delete(correlationId);
        reject(new Error('Message timeout - no response received'));
      }, 5000);

      pendingCommandsRef.current.set(correlationId, { resolve, reject, timeout });

      const messageWithId = {
        correlation_id: correlationId,
        kind: message.kind,
        ...message.payload,
      };

      wsRef.current.send(JSON.stringify(messageWithId));
    });
  };

  const subscribe = (callback: (message: any) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}
