/**
 * WebSocket Utility Functions
 *
 * Pure functions for WebSocket operations that can be easily unit tested.
 */

import type { IncomingMessage, WebSocketConfig } from './websocket.types';
// eslint-disable-next-line no-duplicate-imports
import { DEFAULT_WEBSOCKET_CONFIG } from './websocket.types';

/**
 * Calculate the reconnection delay using exponential backoff with jitter.
 *
 * The delay doubles with each attempt up to a maximum, then adds random jitter
 * (±30%) to prevent thundering herd problems when many clients reconnect.
 *
 * @param attempt - Current reconnection attempt number (0-indexed)
 * @param config - Configuration with base and max delay values
 * @returns Delay in milliseconds before next reconnection attempt
 */
export function calculateReconnectDelay(
  attempt: number,
  config: Pick<
    WebSocketConfig,
    'baseReconnectDelay' | 'maxReconnectDelay'
  > = DEFAULT_WEBSOCKET_CONFIG
): number {
  const { baseReconnectDelay, maxReconnectDelay } = config;

  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
  const exponentialDelay = baseReconnectDelay * 2 ** attempt;
  const cappedDelay = Math.min(exponentialDelay, maxReconnectDelay);

  // Add jitter: ±30% randomization
  const jitterFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
  return Math.round(cappedDelay * jitterFactor);
}

/**
 * Generate a unique correlation ID for tracking request/response pairs.
 *
 * Format: `{timestamp}-{random}` for reasonable uniqueness and debuggability.
 *
 * @returns A unique string identifier
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${timestamp}-${random}`;
}

/**
 * Check if a message is a pong response from the server.
 *
 * @param message - The incoming message to check
 * @returns True if this is a pong response
 */
export function isPongMessage(message: IncomingMessage): boolean {
  return message.data === 'Pong';
}

/**
 * Check if a message has a correlation ID indicating it's a response to a request.
 *
 * @param message - The incoming message to check
 * @returns True if this message is a correlated response
 */
export function isCorrelatedResponse(message: IncomingMessage): boolean {
  return typeof message.correlation_id === 'string' && message.correlation_id.length > 0;
}

/**
 * Build the WebSocket URL for a labour session.
 *
 * @param baseUrl - The base WebSocket URL from environment
 * @param labourId - The labour session ID
 * @returns Complete WebSocket URL
 */
export function buildWebSocketUrl(baseUrl: string, labourId: string): string {
  return `${baseUrl}${labourId}`;
}

/**
 * Build the WebSocket subprotocol array for authentication.
 *
 * @param token - The authentication token
 * @returns Array of subprotocol strings
 */
export function buildAuthProtocols(token: string): string[] {
  return ['fernlabour.com', `base64url.bearer.authorization.fernlabour.com.${token}`];
}

/**
 * Check if a connection is stale based on last pong time.
 *
 * @param lastPongTime - Timestamp of last pong received
 * @param pongTimeout - Maximum allowed time without pong
 * @param currentTime - Current timestamp (defaults to Date.now())
 * @returns True if connection is considered stale
 */
export function isConnectionStale(
  lastPongTime: number,
  pongTimeout: number = DEFAULT_WEBSOCKET_CONFIG.pongTimeout,
  currentTime: number = Date.now()
): boolean {
  return currentTime - lastPongTime > pongTimeout;
}

/**
 * Check if max reconnection attempts have been reached.
 *
 * @param attempts - Current number of attempts
 * @param maxAttempts - Maximum allowed attempts
 * @returns True if max attempts reached
 */
export function hasExceededMaxAttempts(
  attempts: number,
  maxAttempts: number = DEFAULT_WEBSOCKET_CONFIG.maxReconnectAttempts
): boolean {
  return attempts >= maxAttempts;
}

/**
 * Build a ping message for the heartbeat.
 *
 * @returns JSON string of ping message
 */
export function buildPingMessage(): string {
  return JSON.stringify({ kind: 'Ping' });
}

/**
 * Build a message with correlation ID for sending.
 *
 * @param correlationId - The correlation ID for tracking
 * @param kind - The message kind
 * @param payload - The message payload
 * @returns JSON string of the complete message
 */
export function buildOutgoingMessage(
  correlationId: string,
  kind: string,
  payload: unknown
): string {
  return JSON.stringify({
    correlation_id: correlationId,
    kind,
    ...(payload as object),
  });
}
