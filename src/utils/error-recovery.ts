import { ErrorRecoveryConfig } from '../types';

/**
 * Error Recovery utility for Browser ETL
 */
export class ErrorRecovery {
  private config: ErrorRecoveryConfig;

  constructor(config: ErrorRecoveryConfig) {
    this.config = config;
  }

  /**
   * Execute a function with error recovery
   */
  async executeWithRecovery<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    if (!this.config.enabled) {
      return await fn();
    }

    let lastError: Error;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        if (attempt > this.config.maxRetries) {
          break;
        }

        const delay = this.calculateDelay(attempt);
        console.warn(
          `Attempt ${attempt} failed${context ? ` for ${context}` : ''}: ${lastError.message}. Retrying in ${delay}ms...`
        );

        await this.sleep(delay);
      }
    }

    throw new Error(
      `Operation failed after ${this.config.maxRetries} retries${context ? ` for ${context}` : ''}: ${lastError!.message}`
    );
  }

  /**
   * Execute multiple functions with error recovery
   */
  async executeMultipleWithRecovery<T>(
    functions: Array<() => Promise<T>>,
    context?: string
  ): Promise<T[]> {
    const results: T[] = [];
    const errors: Error[] = [];

    for (let i = 0; i < functions.length; i++) {
      try {
        const result = await this.executeWithRecovery(
          functions[i],
          context ? `${context}[${i}]` : `function[${i}]`
        );
        results.push(result);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
        results.push(null as any); // Placeholder for failed operation
      }
    }

    if (errors.length > 0) {
      console.warn(`${errors.length} operations failed:`, errors);
    }

    return results;
  }

  /**
   * Execute functions in parallel with error recovery
   */
  async executeParallelWithRecovery<T>(
    functions: Array<() => Promise<T>>,
    context?: string
  ): Promise<T[]> {
    const promises = functions.map((fn, index) =>
      this.executeWithRecovery(
        fn,
        context ? `${context}[${index}]` : `function[${index}]`
      ).catch(error => {
        console.warn(`Parallel operation ${index} failed:`, error);
        return null as any;
      })
    );

    return await Promise.all(promises);
  }

  /**
   * Calculate delay for retry attempts
   */
  private calculateDelay(attempt: number): number {
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    return Math.min(exponentialDelay, this.config.maxRetryDelay);
  }

  /**
   * Sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is recoverable
   */
  isRecoverableError(error: Error): boolean {
    const recoverableErrors = [
      'NetworkError',
      'TimeoutError',
      'AbortError',
      'TypeError',
      'ReferenceError'
    ];

    return recoverableErrors.some(errorType => 
      error.name === errorType || error.message.includes(errorType)
    );
  }

  /**
   * Get error recovery statistics
   */
  getStats(): {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
    maxRetryDelay: number;
  } {
    return {
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
      backoffMultiplier: this.config.backoffMultiplier,
      maxRetryDelay: this.config.maxRetryDelay
    };
  }
}