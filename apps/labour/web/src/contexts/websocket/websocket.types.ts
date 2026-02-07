/**
 * WebSocket Connection Types
 *
 * Centralized type definitions for the WebSocket context.
 */

/**
 * Represents the current state of the WebSocket connection.
 */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

/**
 * Message kinds that can be sent over the WebSocket.
 */
export type MessageKind = 'Command' | 'Query' | 'ServerTimestamp' | 'Ping';

/**
 * Outgoing message structure.
 */
export interface OutgoingMessage {
  kind: Exclude<MessageKind, 'Ping'>;
  payload: unknown;
}

/**
 * Incoming message from the server.
 */
export interface IncomingMessage {
  correlation_id?: string;
  data?: unknown;
  success?: boolean;
  error?: string;
}

/**
 * Tracks a pending command waiting for a response.
 */
export interface PendingCommand {
  resolve: (value: { data: unknown; success: boolean }) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

/**
 * Configuration constants for WebSocket behavior.
 */
export interface WebSocketConfig {
  baseReconnectDelay: number;
  maxReconnectDelay: number;
  maxReconnectAttempts: number;
  messageTimeout: number;
  pingInterval: number;
  pongTimeout: number;
}

/**
 * Default configuration values.
 */
export const DEFAULT_WEBSOCKET_CONFIG: WebSocketConfig = {
  baseReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  maxReconnectAttempts: 10,
  messageTimeout: 15000,
  pingInterval: 15000,
  pongTimeout: 45000,
};

/**
 * Context value exposed by the WebSocket provider.
 */
export interface WebSocketContextValue {
  isConnected: boolean;
  connectionState: ConnectionState;
  sendMessage: (message: OutgoingMessage) => Promise<{ data: unknown; success: boolean }>;
  subscribe: (callback: (message: IncomingMessage) => void) => () => void;
  retryConnection: () => void;
}
