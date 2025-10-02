import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChartLoader } from '../../src/loaders/chart';

describe('ChartLoader', () => {
  let loader: ChartLoader;
  let mockChart: any;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: any;

  beforeEach(() => {
    loader = new ChartLoader();
    vi.clearAllMocks();

    // Mock Chart.js
    mockChart = vi.fn();
    (window as any).Chart = mockChart;

    // Mock canvas and context
    mockContext = {
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn()
    };

    mockCanvas = {
      getContext: vi.fn().mockReturnValue(mockContext),
      width: 400,
      height: 300
    } as any;

    // Mock document methods
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas);
    vi.spyOn(document, 'querySelector').mockReturnValue(document.body);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockCanvas);
  });

  describe('load method', () => {
    it('should create bar chart with array data', async () => {
      const data = [
        { label: 'A', value: 10 },
        { label: 'B', value: 20 },
        { label: 'C', value: 30 }
      ];

      await loader.load(data, {
        type: 'bar',
        config: { label: 'Test Data' }
      });

      expect(document.createElement).toHaveBeenCalledWith('canvas');
      expect(mockChart).toHaveBeenCalledWith(mockContext, {
        type: 'bar',
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [{
            label: 'Test Data',
            data: [10, 20, 30],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: expect.any(Object)
      });
    });

    it('should create pie chart with array data', async () => {
      const data = [
        { label: 'Red', value: 30 },
        { label: 'Blue', value: 50 },
        { label: 'Green', value: 20 }
      ];

      await loader.load(data, {
        type: 'pie',
        config: { label: 'Colors' }
      });

      expect(mockChart).toHaveBeenCalledWith(mockContext, {
        type: 'pie',
        data: {
          labels: ['Red', 'Blue', 'Green'],
          datasets: [{
            data: [30, 50, 20],
            backgroundColor: expect.any(Array),
            borderColor: expect.any(Array),
            borderWidth: 1
          }]
        },
        options: expect.any(Object)
      });
    });

    it('should create scatter chart', async () => {
      const data = [
        { x: 1, y: 2 },
        { x: 2, y: 4 },
        { x: 3, y: 6 }
      ];

      await loader.load(data, {
        type: 'scatter',
        config: { label: 'Points' }
      });

      expect(mockChart).toHaveBeenCalledWith(mockContext, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Points',
            data: [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: expect.any(Object)
      });
    });

    it('should create chart with object data', async () => {
      const data = { apples: 10, bananas: 20, oranges: 30 };

      await loader.load(data, {
        type: 'bar',
        config: { label: 'Fruits' }
      });

      expect(mockChart).toHaveBeenCalledWith(mockContext, {
        type: 'bar',
        data: {
          labels: ['apples', 'bananas', 'oranges'],
          datasets: [{
            label: 'Fruits',
            data: [10, 20, 30],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: expect.any(Object)
      });
    });

    it('should create chart with primitive data', async () => {
      const data = 42;

      await loader.load(data, {
        type: 'bar',
        config: { label: 'Value' }
      });

      expect(mockChart).toHaveBeenCalledWith(mockContext, {
        type: 'bar',
        data: {
          labels: ['Data'],
          datasets: [{
            label: 'Value',
            data: [42],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: expect.any(Object)
      });
    });

    it('should use custom container', async () => {
      const mockContainer = document.createElement('div');
      vi.spyOn(document, 'querySelector').mockReturnValue(mockContainer);
      vi.spyOn(mockContainer, 'appendChild').mockImplementation(() => mockCanvas);

      await loader.load([1, 2, 3], {
        type: 'bar',
        config: {},
        container: '#my-chart'
      });

      expect(document.querySelector).toHaveBeenCalledWith('#my-chart');
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockCanvas);
    });

    it('should use HTMLElement container', async () => {
      const mockContainer = document.createElement('div');
      vi.spyOn(mockContainer, 'appendChild').mockImplementation(() => mockCanvas);

      await loader.load([1, 2, 3], {
        type: 'bar',
        config: {},
        container: mockContainer
      });

      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockCanvas);
    });

    it('should use custom dimensions', async () => {
      await loader.load([1, 2, 3], {
        type: 'bar',
        config: {},
        width: 800,
        height: 600
      });

      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(600);
    });

    it('should throw error when chart type is missing', async () => {
      await expect(loader.load([1, 2, 3], {
        config: {}
      } as any)).rejects.toThrow('Chart type is required');
    });

    it('should throw error when Chart.js is not available', async () => {
      delete (window as any).Chart;

      await expect(loader.load([1, 2, 3], {
        type: 'bar',
        config: {}
      })).rejects.toThrow('Chart.js is not available. Please include Chart.js in your page.');
    });

    it('should throw error when window is not available', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      await expect(loader.load([1, 2, 3], {
        type: 'bar',
        config: {}
      })).rejects.toThrow('Chart.js is not available. Please include Chart.js in your page.');

      global.window = originalWindow;
    });

    it('should throw error when container element not found', async () => {
      vi.spyOn(document, 'querySelector').mockReturnValue(null);

      await expect(loader.load([1, 2, 3], {
        type: 'bar',
        config: {},
        container: '#non-existent'
      })).rejects.toThrow('Container element \'#non-existent\' not found');
    });

    it('should handle custom chart configuration', async () => {
      const data = [1, 2, 3];

      await loader.load(data, {
        type: 'bar',
        config: {
          label: 'Custom Data',
          backgroundColor: 'red',
          borderColor: 'blue',
          borderWidth: 2,
          title: 'My Chart',
          showLegend: false,
          scales: { y: { beginAtZero: true } },
          options: { responsive: false }
        }
      });

      expect(mockChart).toHaveBeenCalledWith(mockContext, {
        type: 'bar',
        data: {
          labels: ['Item 1', 'Item 2', 'Item 3'],
          datasets: [{
            label: 'Custom Data',
            data: [1, 2, 3],
            backgroundColor: 'red',
            borderColor: 'blue',
            borderWidth: 2
          }]
        },
        options: expect.objectContaining({
          responsive: false,
          plugins: expect.objectContaining({
            title: expect.objectContaining({
              display: true,
              text: 'My Chart'
            }),
            legend: expect.objectContaining({
              display: false
            })
          }),
          scales: { y: { beginAtZero: true } }
        })
      });
    });
  });

  describe('supports method', () => {
    it('should support valid config', () => {
      expect(loader.supports({
        type: 'bar',
        config: {}
      })).toBe(true);
    });

    it('should not support config without type', () => {
      expect(loader.supports({
        config: {}
      })).toBe(false);
    });

    it('should not support config without config', () => {
      expect(loader.supports({
        type: 'bar'
      })).toBe(false);
    });
  });

  describe('name property', () => {
    it('should have correct name', () => {
      expect(loader.name).toBe('chart');
    });
  });
});