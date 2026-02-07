import {
  buildAuthProtocols,
  buildOutgoingMessage,
  buildPingMessage,
  buildWebSocketUrl,
  calculateReconnectDelay,
  generateCorrelationId,
  hasExceededMaxAttempts,
  isConnectionStale,
  isCorrelatedResponse,
  isPongMessage,
} from './websocket.utils';

describe('websocket.utils', () => {
  describe('calculateReconnectDelay', () => {
    const config = { baseReconnectDelay: 1000, maxReconnectDelay: 30000 };

    it('should return a delay close to base delay for first attempt', () => {
      const delay = calculateReconnectDelay(0, config);
      // With jitter (0.7 to 1.3), delay should be between 700 and 1300
      expect(delay).toBeGreaterThanOrEqual(700);
      expect(delay).toBeLessThanOrEqual(1300);
    });

    it('should increase delay exponentially with attempts', () => {
      // Collect multiple samples to verify exponential growth
      const delays: number[] = [];
      for (let attempt = 0; attempt < 5; attempt++) {
        // Average several samples to reduce jitter variance
        let sum = 0;
        for (let i = 0; i < 100; i++) {
          sum += calculateReconnectDelay(attempt, config);
        }
        delays.push(sum / 100);
      }

      // Each average should roughly double
      expect(delays[1]).toBeGreaterThan(delays[0] * 1.5);
      expect(delays[2]).toBeGreaterThan(delays[1] * 1.5);
    });

    it('should cap delay at max value', () => {
      const delay = calculateReconnectDelay(10, config); // 2^10 * 1000 = 1024000 > 30000
      // With jitter, should be between 21000 and 39000
      expect(delay).toBeGreaterThanOrEqual(21000);
      expect(delay).toBeLessThanOrEqual(39000);
    });

    it('should use default config when not provided', () => {
      const delay = calculateReconnectDelay(0);
      expect(delay).toBeGreaterThanOrEqual(700);
      expect(delay).toBeLessThanOrEqual(1300);
    });
  });

  describe('generateCorrelationId', () => {
    it('should generate a string', () => {
      const id = generateCorrelationId();
      expect(typeof id).toBe('string');
    });

    it('should contain a timestamp-like prefix', () => {
      const id = generateCorrelationId();
      const [timestamp] = id.split('-');
      const parsed = parseInt(timestamp, 10);
      expect(parsed).toBeGreaterThan(1700000000000); // After year 2023
      expect(parsed).toBeLessThan(2000000000000); // Before year 2033
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateCorrelationId());
      }
      expect(ids.size).toBe(1000);
    });

    it('should have expected format (timestamp-random)', () => {
      const id = generateCorrelationId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('isPongMessage', () => {
    it('should return true for pong message', () => {
      expect(isPongMessage({ data: 'Pong' })).toBe(true);
    });

    it('should return false for other messages', () => {
      expect(isPongMessage({ data: 'Hello' })).toBe(false);
      expect(isPongMessage({ data: { type: 'Pong' } })).toBe(false);
      expect(isPongMessage({})).toBe(false);
      expect(isPongMessage({ data: null })).toBe(false);
    });
  });

  describe('isCorrelatedResponse', () => {
    it('should return true for message with correlation_id', () => {
      expect(isCorrelatedResponse({ correlation_id: 'abc-123' })).toBe(true);
    });

    it('should return false for message without correlation_id', () => {
      expect(isCorrelatedResponse({})).toBe(false);
      expect(isCorrelatedResponse({ correlation_id: '' })).toBe(false);
      expect(isCorrelatedResponse({ correlation_id: undefined })).toBe(false);
    });
  });

  describe('buildWebSocketUrl', () => {
    it('should concatenate base URL and labour ID', () => {
      expect(buildWebSocketUrl('wss://api.example.com/ws/', 'labour-123')).toBe(
        'wss://api.example.com/ws/labour-123'
      );
    });

    it('should handle empty base URL', () => {
      expect(buildWebSocketUrl('', 'labour-123')).toBe('labour-123');
    });
  });

  describe('buildAuthProtocols', () => {
    it('should return array with base protocol and auth protocol', () => {
      const protocols = buildAuthProtocols('my-token');
      expect(protocols).toHaveLength(2);
      expect(protocols[0]).toBe('fernlabour.com');
      expect(protocols[1]).toBe('base64url.bearer.authorization.fernlabour.com.my-token');
    });
  });

  describe('isConnectionStale', () => {
    it('should return true when pong timeout exceeded', () => {
      const lastPong = 1000;
      const current = 50000;
      expect(isConnectionStale(lastPong, 45000, current)).toBe(true);
    });

    it('should return false when within timeout', () => {
      const lastPong = 1000;
      const current = 40000;
      expect(isConnectionStale(lastPong, 45000, current)).toBe(false);
    });

    it('should use default timeout when not provided', () => {
      const now = Date.now();
      expect(isConnectionStale(now - 44000)).toBe(false);
      expect(isConnectionStale(now - 50000)).toBe(true);
    });
  });

  describe('hasExceededMaxAttempts', () => {
    it('should return true when attempts equal max', () => {
      expect(hasExceededMaxAttempts(10, 10)).toBe(true);
    });

    it('should return true when attempts exceed max', () => {
      expect(hasExceededMaxAttempts(15, 10)).toBe(true);
    });

    it('should return false when attempts below max', () => {
      expect(hasExceededMaxAttempts(5, 10)).toBe(false);
    });

    it('should use default max when not provided', () => {
      expect(hasExceededMaxAttempts(9)).toBe(false);
      expect(hasExceededMaxAttempts(10)).toBe(true);
    });
  });

  describe('buildPingMessage', () => {
    it('should return valid JSON ping message', () => {
      const message = buildPingMessage();
      expect(message).toBe('{"kind":"Ping"}');
    });

    it('should parse to correct object', () => {
      const parsed = JSON.parse(buildPingMessage());
      expect(parsed).toEqual({ kind: 'Ping' });
    });
  });

  describe('buildOutgoingMessage', () => {
    it('should build message with correlation ID and kind', () => {
      const message = buildOutgoingMessage('id-123', 'Command', { action: 'test' });
      const parsed = JSON.parse(message);
      expect(parsed).toEqual({
        correlation_id: 'id-123',
        kind: 'Command',
        action: 'test',
      });
    });

    it('should handle empty payload', () => {
      const message = buildOutgoingMessage('id-456', 'Query', {});
      const parsed = JSON.parse(message);
      expect(parsed).toEqual({
        correlation_id: 'id-456',
        kind: 'Query',
      });
    });
  });
});
