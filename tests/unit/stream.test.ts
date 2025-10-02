import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StreamProcessor } from '../../src/utils/stream';

describe('StreamProcessor', () => {
  let processor: StreamProcessor<number>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      const config = {
        enabled: true,
        batchSize: 10,
        bufferSize: 5,
        timeout: 5000
      };

      processor = new StreamProcessor(config);
      expect(processor).toBeInstanceOf(StreamProcessor);
    });
  });

  describe('process method', () => {
    beforeEach(() => {
      const config = {
        enabled: true,
        batchSize: 3,
        bufferSize: 2,
        timeout: 1000
      };

      processor = new StreamProcessor(config);
    });

    it('should process data in batches when streaming enabled', async () => {
      const data = [1, 2, 3, 4, 5, 6, 7];
      const mockProcessor = vi.fn().mockImplementation(async (batch: number[]) => batch.map(x => x * 2));
      const onBatch = vi.fn();

      const results = await processor.process(data, mockProcessor, onBatch);

      expect(results).toEqual([2, 4, 6, 8, 10, 12, 14]);
      expect(mockProcessor).toHaveBeenCalledTimes(3); // 3 batches: [1,2,3], [4,5,6], [7]
      expect(onBatch).toHaveBeenCalledTimes(3);
    });

    it('should process all data at once when streaming disabled', async () => {
      const config = {
        enabled: false,
        batchSize: 3,
        bufferSize: 2,
        timeout: 1000
      };

      processor = new StreamProcessor(config);
      const data = [1, 2, 3, 4, 5];
      const mockProcessor = vi.fn().mockImplementation(async (batch: number[]) => batch.map(x => x * 2));

      const results = await processor.process(data, mockProcessor);

      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(mockProcessor).toHaveBeenCalledTimes(1);
      expect(mockProcessor).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
    });

    it('should handle single batch', async () => {
      const data = [1, 2];
      const mockProcessor = vi.fn().mockImplementation(async (batch: number[]) => batch.map(x => x * 2));

      const results = await processor.process(data, mockProcessor);

      expect(results).toEqual([2, 4]);
      expect(mockProcessor).toHaveBeenCalledTimes(1);
    });

    it('should handle empty data', async () => {
      const data: number[] = [];
      const mockProcessor = vi.fn().mockImplementation(async (batch: number[]) => batch.map(x => x * 2));

      const results = await processor.process(data, mockProcessor);

      expect(results).toEqual([]);
      expect(mockProcessor).not.toHaveBeenCalled();
    });

    it('should handle non-array processor result', async () => {
      const data = [1, 2, 3];
      const mockProcessor = vi.fn().mockResolvedValue('single result');

      const results = await processor.process(data, mockProcessor);

      expect(results).toEqual(['single result']);
    });

    it('should handle batch processing timeout', async () => {
      const data = [1, 2, 3];
      const mockProcessor = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Longer than timeout
        return [1, 2, 3];
      });

      const results = await processor.process(data, mockProcessor);

      expect(results).toEqual([]); // No results due to timeout
    });

    it('should continue processing after batch error', async () => {
      const data = [1, 2, 3, 4, 5, 6];
      const mockProcessor = vi.fn()
        .mockImplementationOnce(async (batch: number[]) => batch.map(x => x * 2))
        .mockRejectedValueOnce(new Error('Batch processing failed'))
        .mockImplementationOnce(async (batch: number[]) => batch.map(x => x * 2));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const results = await processor.process(data, mockProcessor);

      expect(results).toEqual([2, 4, 8, 10]); // First and third batches succeeded
      expect(consoleSpy).toHaveBeenCalledWith('Error processing batch 2:', expect.any(Error));
    });

    it('should handle async processor function', async () => {
      const data = [1, 2, 3];
      const mockProcessor = vi.fn().mockImplementation(async (batch: number[]) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return batch.map(x => x * 2);
      });

      const results = await processor.process(data, mockProcessor);

      expect(results).toEqual([2, 4, 6]);
    });
  });

  describe('createReadableStream', () => {
    beforeEach(() => {
      const config = {
        enabled: true,
        batchSize: 3,
        bufferSize: 2,
        timeout: 1000
      };

      processor = new StreamProcessor(config);
    });

    it('should create readable stream', async () => {
      const data = [1, 2, 3, 4, 5];
      const stream = processor.createReadableStream(data);
      const reader = stream.getReader();
      const results: number[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          results.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      expect(results).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle empty data stream', async () => {
      const data: number[] = [];
      const stream = processor.createReadableStream(data);
      const reader = stream.getReader();
      const results: number[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          results.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      expect(results).toEqual([]);
    });

    it('should respect buffer size', async () => {
      const config = {
        enabled: true,
        batchSize: 3,
        bufferSize: 1,
        timeout: 1000
      };

      processor = new StreamProcessor(config);
      const data = [1, 2, 3, 4, 5];
      const stream = processor.createReadableStream(data);
      const reader = stream.getReader();
      const results: number[] = [];

      // Read first item
      const { done, value } = await reader.read();
      if (!done) results.push(value);

      expect(results).toEqual([1]);
    });
  });

  describe('createWritableStream', () => {
    beforeEach(() => {
      const config = {
        enabled: true,
        batchSize: 3,
        bufferSize: 2,
        timeout: 1000
      };

      processor = new StreamProcessor(config);
    });

    it('should create writable stream', async () => {
      const writerFn = vi.fn().mockResolvedValue(undefined);
      const stream = processor.createWritableStream(writerFn);
      const writer = stream.getWriter();

      await writer.write([1, 2, 3]);
      await writer.write([4, 5, 6]);
      await writer.close();

      expect(writerFn).toHaveBeenCalledTimes(2);
      expect(writerFn).toHaveBeenCalledWith([1, 2, 3]);
      expect(writerFn).toHaveBeenCalledWith([4, 5, 6]);
    });

    it('should handle writer errors', async () => {
      const writerFn = vi.fn().mockRejectedValue(new Error('Write failed'));
      const stream = processor.createWritableStream(writerFn);
      const writer = stream.getWriter();

      await expect(writer.write([1, 2, 3])).rejects.toThrow('Write failed');
    });
  });

  describe('transformStream', () => {
    beforeEach(() => {
      const config = {
        enabled: true,
        batchSize: 3,
        bufferSize: 2,
        timeout: 1000
      };

      processor = new StreamProcessor(config);
    });

    it('should transform stream data', async () => {
      const data = [1, 2, 3, 4, 5];
      const inputStream = processor.createReadableStream(data);
      const transformer = (item: number) => item * 2;
      const outputStream = processor.transformStream(inputStream, transformer);
      const reader = outputStream.getReader();
      const results: number[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          results.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should handle transformation errors', async () => {
      const data = [1, 2, 3];
      const inputStream = processor.createReadableStream(data);
      const transformer = (item: number) => {
        if (item === 2) throw new Error('Transformation failed');
        return item * 2;
      };
      const outputStream = processor.transformStream(inputStream, transformer);
      const reader = outputStream.getReader();

      await expect(reader.read()).resolves.toEqual({ done: false, value: 2 });
      await expect(reader.read()).rejects.toThrow('Transformation failed');
    });
  });

  describe('mergeStreams', () => {
    beforeEach(() => {
      const config = {
        enabled: true,
        batchSize: 3,
        bufferSize: 2,
        timeout: 1000
      };

      processor = new StreamProcessor(config);
    });

    it('should merge multiple streams', async () => {
      const data1 = [1, 2, 3];
      const data2 = [4, 5, 6];
      const data3 = [7, 8, 9];

      const stream1 = processor.createReadableStream(data1);
      const stream2 = processor.createReadableStream(data2);
      const stream3 = processor.createReadableStream(data3);

      const mergedStream = processor.mergeStreams([stream1, stream2, stream3]);
      const reader = mergedStream.getReader();
      const results: number[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          results.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      // Results should contain all values from all streams
      expect(results).toHaveLength(9);
      expect(results).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });

    it('should handle empty streams', async () => {
      const data1: number[] = [];
      const data2 = [1, 2, 3];

      const stream1 = processor.createReadableStream(data1);
      const stream2 = processor.createReadableStream(data2);

      const mergedStream = processor.mergeStreams([stream1, stream2]);
      const reader = mergedStream.getReader();
      const results: number[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          results.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      expect(results).toEqual([1, 2, 3]);
    });

    it('should handle stream errors', async () => {
      const data1 = [1, 2, 3];
      const data2 = [4, 5, 6];

      const stream1 = processor.createReadableStream(data1);
      const stream2 = processor.createReadableStream(data2);

      const mergedStream = processor.mergeStreams([stream1, stream2]);
      const reader = mergedStream.getReader();

      // Read a few items
      await reader.read();
      await reader.read();

      // Close one stream to simulate error
      stream1.cancel();

      // Should still be able to read from other streams
      const results: number[] = [];
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          results.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      expect(results.length).toBeGreaterThan(0);
    });
  });
});