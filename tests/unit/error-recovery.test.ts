import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorRecovery } from '../../src/utils/error-recovery';

describe('ErrorRecovery', () => {
  let errorRecovery: ErrorRecovery;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.warn to avoid noise in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      const config = {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        maxRetryDelay: 10000
      };

      errorRecovery = new ErrorRecovery(config);
      expect(errorRecovery).toBeInstanceOf(ErrorRecovery);
    });
  });

  describe('executeWithRecovery', () => {
    beforeEach(() => {
      const config = {
        enabled: true,
        maxRetries: 2,
        retryDelay: 100,
        backoffMultiplier: 2,
        maxRetryDelay: 1000
      };

      errorRecovery = new ErrorRecovery(config);
    });

    it('should execute function successfully on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await errorRecovery.executeWithRecovery(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce('success');

      const result = await errorRecovery.executeWithRecovery(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry multiple times and eventually succeed', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValueOnce('success');

      const result = await errorRecovery.executeWithRecovery(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(errorRecovery.executeWithRecovery(mockFn))
        .rejects.toThrow('Operation failed after 2 retries: Always fails');

      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should include context in error message', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(errorRecovery.executeWithRecovery(mockFn, 'test operation'))
        .rejects.toThrow('Operation failed after 2 retries for test operation: Always fails');
    });

    it('should not retry when disabled', async () => {
      const config = {
        enabled: false,
        maxRetries: 2,
        retryDelay: 100,
        backoffMultiplier: 2,
        maxRetryDelay: 1000
      };

      errorRecovery = new ErrorRecovery(config);
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(errorRecovery.executeWithRecovery(mockFn))
        .rejects.toThrow('Always fails');

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error objects', async () => {
      const mockFn = vi.fn().mockRejectedValue('String error');

      await expect(errorRecovery.executeWithRecovery(mockFn))
        .rejects.toThrow('Operation failed after 2 retries: String error');
    });

    it('should calculate exponential backoff delay', async () => {
      const config = {
        enabled: true,
        maxRetries: 3,
        retryDelay: 100,
        backoffMultiplier: 2,
        maxRetryDelay: 1000
      };

      errorRecovery = new ErrorRecovery(config);
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

      const startTime = Date.now();
      await expect(errorRecovery.executeWithRecovery(mockFn)).rejects.toThrow();
      const endTime = Date.now();

      // Should have waited for retries (100ms + 200ms + 400ms = 700ms minimum)
      expect(endTime - startTime).toBeGreaterThanOrEqual(700);
    });

    it('should respect max retry delay', async () => {
      const config = {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 10,
        maxRetryDelay: 2000
      };

      errorRecovery = new ErrorRecovery(config);
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

      const startTime = Date.now();
      await expect(errorRecovery.executeWithRecovery(mockFn)).rejects.toThrow();
      const endTime = Date.now();

      // Should cap at maxRetryDelay (2000ms * 3 = 6000ms minimum)
      expect(endTime - startTime).toBeGreaterThanOrEqual(6000);
    });
  });

  describe('executeMultipleWithRecovery', () => {
    beforeEach(() => {
      const config = {
        enabled: true,
        maxRetries: 1,
        retryDelay: 50,
        backoffMultiplier: 2,
        maxRetryDelay: 1000
      };

      errorRecovery = new ErrorRecovery(config);
    });

    it('should execute all functions successfully', async () => {
      const functions = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockResolvedValue('result2'),
        vi.fn().mockResolvedValue('result3')
      ];

      const results = await errorRecovery.executeMultipleWithRecovery(functions);

      expect(results).toEqual(['result1', 'result2', 'result3']);
      functions.forEach(fn => expect(fn).toHaveBeenCalledTimes(1));
    });

    it('should handle some failures', async () => {
      const functions = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockRejectedValue(new Error('Function 2 failed')),
        vi.fn().mockResolvedValue('result3')
      ];

      const results = await errorRecovery.executeMultipleWithRecovery(functions);

      expect(results).toEqual(['result1', null, 'result3']);
      expect(console.warn).toHaveBeenCalledWith('1 operations failed:', expect.any(Array));
    });

    it('should include context in error messages', async () => {
      const functions = [
        vi.fn().mockRejectedValue(new Error('Function failed'))
      ];

      await errorRecovery.executeMultipleWithRecovery(functions, 'batch operation');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('batch operation[0]'),
        expect.any(Error)
      );
    });
  });

  describe('executeParallelWithRecovery', () => {
    beforeEach(() => {
      const config = {
        enabled: true,
        maxRetries: 1,
        retryDelay: 50,
        backoffMultiplier: 2,
        maxRetryDelay: 1000
      };

      errorRecovery = new ErrorRecovery(config);
    });

    it('should execute functions in parallel', async () => {
      const functions = [
        vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('result1'), 100))),
        vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('result2'), 100))),
        vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('result3'), 100)))
      ];

      const startTime = Date.now();
      const results = await errorRecovery.executeParallelWithRecovery(functions);
      const endTime = Date.now();

      expect(results).toEqual(['result1', 'result2', 'result3']);
      // Should complete in parallel, not sequentially (less than 300ms)
      expect(endTime - startTime).toBeLessThan(300);
    });

    it('should handle parallel failures', async () => {
      const functions = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockRejectedValue(new Error('Function 2 failed')),
        vi.fn().mockResolvedValue('result3')
      ];

      const results = await errorRecovery.executeParallelWithRecovery(functions);

      expect(results).toEqual(['result1', null, 'result3']);
      expect(console.warn).toHaveBeenCalledWith('Parallel operation 1 failed:', expect.any(Error));
    });
  });

  describe('isRecoverableError', () => {
    beforeEach(() => {
      const config = {
        enabled: true,
        maxRetries: 1,
        retryDelay: 100,
        backoffMultiplier: 2,
        maxRetryDelay: 1000
      };

      errorRecovery = new ErrorRecovery(config);
    });

    it('should identify recoverable errors by name', () => {
      expect(errorRecovery.isRecoverableError(new Error('NetworkError'))).toBe(true);
      expect(errorRecovery.isRecoverableError(new Error('TimeoutError'))).toBe(true);
      expect(errorRecovery.isRecoverableError(new Error('AbortError'))).toBe(true);
      expect(errorRecovery.isRecoverableError(new Error('TypeError'))).toBe(true);
      expect(errorRecovery.isRecoverableError(new Error('ReferenceError'))).toBe(true);
    });

    it('should identify recoverable errors by message', () => {
      expect(errorRecovery.isRecoverableError(new Error('NetworkError occurred'))).toBe(true);
      expect(errorRecovery.isRecoverableError(new Error('TimeoutError in request'))).toBe(true);
      expect(errorRecovery.isRecoverableError(new Error('AbortError: operation cancelled'))).toBe(true);
    });

    it('should identify non-recoverable errors', () => {
      expect(errorRecovery.isRecoverableError(new Error('SyntaxError'))).toBe(false);
      expect(errorRecovery.isRecoverableError(new Error('ValidationError'))).toBe(false);
      expect(errorRecovery.isRecoverableError(new Error('Custom error'))).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return configuration statistics', () => {
      const config = {
        enabled: true,
        maxRetries: 5,
        retryDelay: 2000,
        backoffMultiplier: 3,
        maxRetryDelay: 30000
      };

      errorRecovery = new ErrorRecovery(config);
      const stats = errorRecovery.getStats();

      expect(stats).toEqual({
        maxRetries: 5,
        retryDelay: 2000,
        backoffMultiplier: 3,
        maxRetryDelay: 30000
      });
    });
  });
});