import { ILoader } from '../types';

export interface ChartLoaderConfig {
  type: string;
  config: any;
  container?: string | HTMLElement;
  width?: number;
  height?: number;
}

/**
 * Chart Loader - loads data into Chart.js charts
 */
export class ChartLoader implements ILoader {
  readonly name = 'chart';

  async load(data: any, config: ChartLoaderConfig): Promise<void> {
    const { type, config: chartConfig, container, width = 400, height = 300 } = config;

    if (!type) {
      throw new Error('Chart type is required');
    }

    // Check if Chart.js is available
    if (typeof window === 'undefined' || !(window as any).Chart) {
      throw new Error('Chart.js is not available. Please include Chart.js in your page.');
    }

    const Chart = (window as any).Chart;
    const canvas = this.createCanvas(container, width, height);
    const ctx = canvas.getContext('2d');

    const chartData = this.prepareChartData(data, type, chartConfig);
    const options = this.prepareChartOptions(chartConfig);

    new Chart(ctx, {
      type,
      data: chartData,
      options
    });
  }

  supports(config: any): boolean {
    return config && config.type && config.config;
  }

  private createCanvas(container?: string | HTMLElement, width: number = 400, height: number = 300): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    let targetContainer: HTMLElement;

    if (typeof container === 'string') {
      targetContainer = document.querySelector(container) as HTMLElement;
      if (!targetContainer) {
        throw new Error(`Container element '${container}' not found`);
      }
    } else if (container instanceof HTMLElement) {
      targetContainer = container;
    } else {
      // Default to body
      targetContainer = document.body;
    }

    targetContainer.appendChild(canvas);
    return canvas;
  }

  private prepareChartData(data: any, type: string, config: any): any {
    if (Array.isArray(data)) {
      switch (type) {
        case 'bar':
        case 'line':
          return {
            labels: data.map((item, index) => item.label || `Item ${index + 1}`),
            datasets: [{
              label: config.label || 'Data',
              data: data.map(item => item.value || item.y || item),
              backgroundColor: config.backgroundColor || 'rgba(54, 162, 235, 0.2)',
              borderColor: config.borderColor || 'rgba(54, 162, 235, 1)',
              borderWidth: config.borderWidth || 1
            }]
          };

        case 'pie':
        case 'doughnut':
          return {
            labels: data.map((item, index) => item.label || `Item ${index + 1}`),
            datasets: [{
              data: data.map(item => item.value || item),
              backgroundColor: config.backgroundColor || [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 205, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)'
              ],
              borderColor: config.borderColor || [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 205, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)'
              ],
              borderWidth: config.borderWidth || 1
            }]
          };

        case 'scatter':
          return {
            datasets: [{
              label: config.label || 'Data',
              data: data.map(item => ({
                x: item.x || item[0],
                y: item.y || item[1]
              })),
              backgroundColor: config.backgroundColor || 'rgba(54, 162, 235, 0.2)',
              borderColor: config.borderColor || 'rgba(54, 162, 235, 1)',
              borderWidth: config.borderWidth || 1
            }]
          };

        default:
          return {
            labels: data.map((_, index) => `Item ${index + 1}`),
            datasets: [{
              label: config.label || 'Data',
              data: data,
              backgroundColor: config.backgroundColor || 'rgba(54, 162, 235, 0.2)',
              borderColor: config.borderColor || 'rgba(54, 162, 235, 1)',
              borderWidth: config.borderWidth || 1
            }]
          };
      }
    }

    // Handle object data
    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      const values = Object.values(data);

      return {
        labels: keys,
        datasets: [{
          label: config.label || 'Data',
          data: values,
          backgroundColor: config.backgroundColor || 'rgba(54, 162, 235, 0.2)',
          borderColor: config.borderColor || 'rgba(54, 162, 235, 1)',
          borderWidth: config.borderWidth || 1
        }]
      };
    }

    // Handle primitive data
    return {
      labels: ['Data'],
      datasets: [{
        label: config.label || 'Value',
        data: [data],
        backgroundColor: config.backgroundColor || 'rgba(54, 162, 235, 0.2)',
        borderColor: config.borderColor || 'rgba(54, 162, 235, 1)',
        borderWidth: config.borderWidth || 1
      }]
    };
  }

  private prepareChartOptions(config: any): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!config.title,
          text: config.title || 'Chart'
        },
        legend: {
          display: config.showLegend !== false
        }
      },
      scales: config.scales || {},
      ...config.options
    };
  }
}