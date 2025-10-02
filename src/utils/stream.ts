import { StreamConfig } from '../types';

/**
 * Stream utility for Browser ETL
 */
export class StreamProcessor<T> {
  private config: StreamConfig;
  private buffer: T[] = [];
  private processing = false;

  constructor(config: StreamConfig) {
    this.config = config;
  }

  /**
   * Process data in streams
   */
  async process(
    data: T[],
    processor: (batch: T[]) => Promise<any>,
    onBatch?: (batch: any) => void
  ): Promise<any[]> {
    if (!this.config.enabled) {
      // Process all data at once
      const result = await processor(data);
      return Array.isArray(result) ? result : [result];
    }

    const results: any[] = [];
    const batchSize = this.config.batchSize;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        const batchResult = await this.processBatch(batch, processor);
        
        if (onBatch) {
          onBatch(batchResult);
        }
        
        if (Array.isArray(batchResult)) {
          results.push(...batchResult);
        } else {
          results.push(batchResult);
        }
        
      } catch (error) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, error);
        // Continue with next batch
      }
    }

    return results;
  }

  /**
   * Process a single batch
   */
  private async processBatch(
    batch: T[],
    processor: (batch: T[]) => Promise<any>
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Batch processing timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      processor(batch)
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Create a readable stream from data
   */
  createReadableStream(data: T[]): ReadableStream<T> {
    let index = 0;

    return new ReadableStream({
      start(controller) {
        // Initial data
        this.pushData(controller);
      },

      pull(controller) {
        this.pushData(controller);
      },

      pushData: (controller: ReadableStreamDefaultController<T>) => {
        const endIndex = Math.min(index + this.config.bufferSize, data.length);
        
        for (let i = index; i < endIndex; i++) {
          controller.enqueue(data[i]);
        }
        
        index = endIndex;
        
        if (index >= data.length) {
          controller.close();
        }
      }
    });
  }

  /**
   * Create a writable stream
   */
  createWritableStream(
    writer: (chunk: T[]) => Promise<void>
  ): WritableStream<T[]> {
    return new WritableStream({
      write: async (chunk) => {
        await writer(chunk);
      }
    });
  }

  /**
   * Transform a stream
   */
  transformStream<U>(
    inputStream: ReadableStream<T>,
    transformer: (item: T) => U
  ): ReadableStream<U> {
    return new ReadableStream({
      start(controller) {
        const reader = inputStream.getReader();
        
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                controller.close();
                break;
              }
              
              const transformed = transformer(value);
              controller.enqueue(transformed);
            }
          } catch (error) {
            controller.error(error);
          }
        };
        
        pump();
      }
    });
  }

  /**
   * Merge multiple streams
   */
  mergeStreams(streams: ReadableStream<T>[]): ReadableStream<T> {
    return new ReadableStream({
      start(controller) {
        const readers = streams.map(stream => stream.getReader());
        let completedCount = 0;
        
        const pump = async (reader: ReadableStreamDefaultReader<T>, index: number) => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                completedCount++;
                if (completedCount === streams.length) {
                  controller.close();
                }
                break;
              }
              
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          }
        };
        
        readers.forEach((reader, index) => {
          pump(reader, index);
        });
      }
    });
  }
}