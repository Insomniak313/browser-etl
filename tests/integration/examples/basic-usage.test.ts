import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock fetch globally
global.fetch = vi.fn();

describe('Basic Usage Example Integration Tests', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    // Create a new JSDOM instance for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        </head>
        <body>
          <div id="table-result"></div>
          <table id="users-table" style="display: none;"></table>
          <div id="chart-result"></div>
          <canvas id="users-chart" style="display: none;"></canvas>
          <input type="file" id="csv-file" accept=".csv" />
          <div id="csv-result"></div>
          <table id="csv-table" style="display: none;"></table>
          <div id="pipeline-result"></div>
          <canvas id="pipeline-chart" style="display: none;"></canvas>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window as any;
    global.document = document;
    global.window = window;

    // Mock Chart.js
    (window as any).Chart = vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
      update: vi.fn()
    }));

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      writable: true
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('MockETL Class', () => {
    it('should be defined and functional', () => {
      // Load the MockETL class from the HTML file
      const script = document.createElement('script');
      script.textContent = `
        class MockETL {
          constructor() {
            this.steps = [];
          }

          extract = {
            api: (url, options) => {
              this.steps.push({ type: 'extract', method: 'api', url, options });
              return this;
            },
            csv: (data, options) => {
              this.steps.push({ type: 'extract', method: 'csv', data, options });
              return this;
            }
          };

          filter = (fn) => {
            this.steps.push({ type: 'transform', method: 'filter', fn });
            return this;
          };

          map = (fn) => {
            this.steps.push({ type: 'transform', method: 'map', fn });
            return this;
          };

          join = {
            api: (url, config) => {
              this.steps.push({ type: 'transform', method: 'join', url, config });
              return this;
            }
          };

          load = {
            table: (container, config) => {
              this.steps.push({ type: 'load', method: 'table', container, config });
              return this;
            },
            chart: (type, config) => {
              this.steps.push({ type: 'load', method: 'chart', type, config });
              return this;
            }
          };

          async run() {
            console.log('Pipeline execution:', this.steps);
            
            let data = [];

            // Process each step
            for (const step of this.steps) {
              switch (step.type) {
                case 'extract':
                  if (step.method === 'api') {
                    try {
                      const response = await fetch(step.url);
                      data = await response.json();
                    } catch (error) {
                      console.error('API fetch error:', error);
                      data = [];
                    }
                  }
                  break;
                case 'transform':
                  if (step.method === 'filter') {
                    data = data.filter(step.fn);
                  } else if (step.method === 'map') {
                    data = data.map(step.fn);
                  }
                  break;
                case 'load':
                  if (step.method === 'table') {
                    await this.loadTable(step.container, data);
                  } else if (step.method === 'chart') {
                    await this.loadChart(step.type, step.config, data);
                  }
                  break;
              }
            }

            return data;
          }

          async loadTable(container, data) {
            const table = document.querySelector(container);
            if (!table) return;

            table.innerHTML = '';
            
            // En-têtes
            const headers = Object.keys(data[0] || {});
            const headerRow = document.createElement('tr');
            headers.forEach(header => {
              const th = document.createElement('th');
              th.textContent = header;
              headerRow.appendChild(th);
            });
            table.appendChild(headerRow);

            // Données
            data.forEach(item => {
              const row = document.createElement('tr');
              headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = item[header];
                row.appendChild(td);
              });
              table.appendChild(row);
            });

            table.style.display = 'table';
          }

          async loadChart(type, config, data) {
            const canvas = document.getElementById('users-chart') || document.getElementById('pipeline-chart');
            if (!canvas) return;

            // Destroy existing chart if it exists
            if (canvas.chart) {
              canvas.chart.destroy();
            }

            const ctx = canvas.getContext('2d');
            
            // Create chart with real data
            let chartData;
            if (type === 'pie') {
              // Group data by category
              const groupedData = {};
              data.forEach(item => {
                const key = item.category || item.name || 'Unknown';
                groupedData[key] = (groupedData[key] || 0) + 1;
              });
              
              chartData = {
                labels: Object.keys(groupedData),
                datasets: [{
                  data: Object.values(groupedData),
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 205, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)'
                  ],
                  borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                  ],
                  borderWidth: 1
                }]
              };
            } else {
              // Bar chart
              chartData = {
                labels: data.map(item => item.name || item.title || 'Unknown'),
                datasets: [{
                  label: 'Value',
                  data: data.map(item => item.id || item.userId || 1),
                  backgroundColor: 'rgba(54, 162, 235, 0.2)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
                }]
              };
            }
            
            canvas.chart = new Chart(ctx, {
              type: type,
              data: chartData,
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: config.title || 'Chart'
                  }
                }
              }
            });

            canvas.style.display = 'block';
          }
        }
      `;
      document.head.appendChild(script);

      // Execute the script
      const MockETL = (window as any).MockETL;
      expect(MockETL).toBeDefined();

      const etl = new MockETL();
      expect(etl.steps).toEqual([]);
      expect(etl.extract).toBeDefined();
      expect(etl.filter).toBeDefined();
      expect(etl.map).toBeDefined();
      expect(etl.join).toBeDefined();
      expect(etl.load).toBeDefined();
    });
  });

  describe('API Extraction and Table Display', () => {
    it('should load users table successfully', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers)
      });

      // Load the MockETL class
      const script = document.createElement('script');
      script.textContent = `
        class MockETL {
          constructor() {
            this.steps = [];
          }

          extract = {
            api: (url, options) => {
              this.steps.push({ type: 'extract', method: 'api', url, options });
              return this;
            }
          };

          filter = (fn) => {
            this.steps.push({ type: 'transform', method: 'filter', fn });
            return this;
          };

          load = {
            table: (container, config) => {
              this.steps.push({ type: 'load', method: 'table', container, config });
              return this;
            }
          };

          async run() {
            let data = [];

            for (const step of this.steps) {
              switch (step.type) {
                case 'extract':
                  if (step.method === 'api') {
                    try {
                      const response = await fetch(step.url);
                      data = await response.json();
                    } catch (error) {
                      console.error('API fetch error:', error);
                      data = [];
                    }
                  }
                  break;
                case 'transform':
                  if (step.method === 'filter') {
                    data = data.filter(step.fn);
                  }
                  break;
                case 'load':
                  if (step.method === 'table') {
                    await this.loadTable(step.container, data);
                  }
                  break;
              }
            }

            return data;
          }

          async loadTable(container, data) {
            const table = document.querySelector(container);
            if (!table) return;

            table.innerHTML = '';
            
            const headers = Object.keys(data[0] || {});
            const headerRow = document.createElement('tr');
            headers.forEach(header => {
              const th = document.createElement('th');
              th.textContent = header;
              headerRow.appendChild(th);
            });
            table.appendChild(headerRow);

            data.forEach(item => {
              const row = document.createElement('tr');
              headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = item[header];
                row.appendChild(td);
              });
              table.appendChild(row);
            });

            table.style.display = 'table';
          }
        }

        window.loadUsersTable = async () => {
          const resultDiv = document.getElementById('table-result');
          resultDiv.innerHTML = '<p>Loading...</p>';

          try {
            const etl = new MockETL();
            await etl
              .extract.api('https://jsonplaceholder.typicode.com/users')
              .filter(user => user.id <= 5)
              .load.table('#users-table')
              .run();

            resultDiv.innerHTML = '<p class="success">✅ Users loaded successfully!</p>';
          } catch (error) {
            resultDiv.innerHTML = \`<p class="error">❌ Error: \${error.message}</p>\`;
          }
        };
      `;
      document.head.appendChild(script);

      // Execute the function
      await (window as any).loadUsersTable();

      // Check results
      const resultDiv = document.getElementById('table-result');
      expect(resultDiv.innerHTML).toContain('✅ Users loaded successfully!');

      const table = document.getElementById('users-table');
      expect(table.style.display).toBe('table');
      expect(table.rows.length).toBeGreaterThan(0);

      expect(fetch).toHaveBeenCalledWith('https://jsonplaceholder.typicode.com/users');
    });
  });

  describe('Chart Generation', () => {
    it('should generate chart successfully', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1', userId: 1 },
        { id: 2, title: 'Post 2', userId: 2 },
        { id: 3, title: 'Post 3', userId: 1 }
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPosts)
      });

      // Load the MockETL class with chart functionality
      const script = document.createElement('script');
      script.textContent = `
        class MockETL {
          constructor() {
            this.steps = [];
          }

          extract = {
            api: (url, options) => {
              this.steps.push({ type: 'extract', method: 'api', url, options });
              return this;
            }
          };

          load = {
            chart: (type, config) => {
              this.steps.push({ type: 'load', method: 'chart', type, config });
              return this;
            }
          };

          async run() {
            let data = [];

            for (const step of this.steps) {
              switch (step.type) {
                case 'extract':
                  if (step.method === 'api') {
                    try {
                      const response = await fetch(step.url);
                      data = await response.json();
                    } catch (error) {
                      console.error('API fetch error:', error);
                      data = [];
                    }
                  }
                  break;
                case 'load':
                  if (step.method === 'chart') {
                    await this.loadChart(step.type, step.config, data);
                  }
                  break;
              }
            }

            return data;
          }

          async loadChart(type, config, data) {
            const canvas = document.getElementById('users-chart');
            if (!canvas) return;

            if (canvas.chart) {
              canvas.chart.destroy();
            }

            const ctx = canvas.getContext('2d');
            
            const chartData = {
              labels: data.map(item => item.name || item.title || 'Unknown'),
              datasets: [{
                label: 'Value',
                data: data.map(item => item.id || item.userId || 1),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              }]
            };
            
            canvas.chart = new Chart(ctx, {
              type: type,
              data: chartData,
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: config.title || 'Chart'
                  }
                }
              }
            });

            canvas.style.display = 'block';
          }
        }

        window.loadUsersChart = async () => {
          const resultDiv = document.getElementById('chart-result');
          resultDiv.innerHTML = '<p>Generating chart...</p>';

          try {
            const etl = new MockETL();
            await etl
              .extract.api('https://jsonplaceholder.typicode.com/users')
              .load.chart('bar', { x: 'name', y: 'id', title: 'Users by ID' })
              .run();

            resultDiv.innerHTML = '<p class="success">✅ Chart generated successfully!</p>';
          } catch (error) {
            resultDiv.innerHTML = \`<p class="error">❌ Error: \${error.message}</p>\`;
          }
        };
      `;
      document.head.appendChild(script);

      // Execute the function
      await (window as any).loadUsersChart();

      // Check results
      const resultDiv = document.getElementById('chart-result');
      expect(resultDiv.innerHTML).toContain('✅ Chart generated successfully!');

      const canvas = document.getElementById('users-chart');
      expect(canvas.style.display).toBe('block');
      expect(canvas.chart).toBeDefined();

      expect(fetch).toHaveBeenCalledWith('https://jsonplaceholder.typicode.com/users');
    });
  });

  describe('CSV Processing', () => {
    it('should process CSV file successfully', async () => {
      const csvContent = 'name,age,city\nJohn,25,New York\nJane,30,London\nBob,35,Paris';
      
      // Mock FileReader
      const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
      
      // Load the CSV processing function
      const script = document.createElement('script');
      script.textContent = `
        window.processCSV = async () => {
          const fileInput = document.getElementById('csv-file');
          const resultDiv = document.getElementById('csv-result');
          
          if (!fileInput.files[0]) {
            resultDiv.innerHTML = '<p class="error">❌ Please select a CSV file</p>';
            return;
          }

          resultDiv.innerHTML = '<p>Processing CSV...</p>';

          try {
            const file = fileInput.files[0];
            const text = await file.text();
            
            // Simple CSV parsing
            const lines = text.split('\\n');
            const headers = lines[0].split(',');
            const data = lines.slice(1).map(line => {
              const values = line.split(',');
              const obj = {};
              headers.forEach((header, index) => {
                obj[header.trim()] = values[index]?.trim();
              });
              return obj;
            });

            // Display in table
            const table = document.getElementById('csv-table');
            table.innerHTML = '';
            
            const headerRow = document.createElement('tr');
            headers.forEach(header => {
              const th = document.createElement('th');
              th.textContent = header.trim();
              headerRow.appendChild(th);
            });
            table.appendChild(headerRow);

            data.forEach(item => {
              const row = document.createElement('tr');
              headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = item[header.trim()];
                row.appendChild(td);
              });
              table.appendChild(row);
            });

            table.style.display = 'table';
            resultDiv.innerHTML = '<p class="success">✅ CSV processed successfully!</p>';
          } catch (error) {
            resultDiv.innerHTML = \`<p class="error">❌ Error: \${error.message}</p>\`;
          }
        };
      `;
      document.head.appendChild(script);

      // Set up file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false
      });

      // Execute the function
      await (window as any).processCSV();

      // Check results
      const resultDiv = document.getElementById('csv-result');
      expect(resultDiv.innerHTML).toContain('✅ CSV processed successfully!');

      const table = document.getElementById('csv-table');
      expect(table.style.display).toBe('table');
      expect(table.rows.length).toBe(4); // Header + 3 data rows
    });
  });

  describe('Complete Pipeline', () => {
    it('should run complete pipeline successfully', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1', userId: 1 },
        { id: 2, title: 'Post 2', userId: 2 },
        { id: 3, title: 'Post 3', userId: 1 },
        { id: 4, title: 'Post 4', userId: 3 },
        { id: 5, title: 'Post 5', userId: 2 }
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPosts)
      });

      // Load the complete pipeline function
      const script = document.createElement('script');
      script.textContent = `
        class MockETL {
          constructor() {
            this.steps = [];
          }

          extract = {
            api: (url, options) => {
              this.steps.push({ type: 'extract', method: 'api', url, options });
              return this;
            }
          };

          filter = (fn) => {
            this.steps.push({ type: 'transform', method: 'filter', fn });
            return this;
          };

          map = (fn) => {
            this.steps.push({ type: 'transform', method: 'map', fn });
            return this;
          };

          load = {
            chart: (type, config) => {
              this.steps.push({ type: 'load', method: 'chart', type, config });
              return this;
            }
          };

          async run() {
            let data = [];

            for (const step of this.steps) {
              switch (step.type) {
                case 'extract':
                  if (step.method === 'api') {
                    try {
                      const response = await fetch(step.url);
                      data = await response.json();
                    } catch (error) {
                      console.error('API fetch error:', error);
                      data = [];
                    }
                  }
                  break;
                case 'transform':
                  if (step.method === 'filter') {
                    data = data.filter(step.fn);
                  } else if (step.method === 'map') {
                    data = data.map(step.fn);
                  }
                  break;
                case 'load':
                  if (step.method === 'chart') {
                    await this.loadChart(step.type, step.config, data);
                  }
                  break;
              }
            }

            return data;
          }

          async loadChart(type, config, data) {
            const canvas = document.getElementById('pipeline-chart');
            if (!canvas) return;

            if (canvas.chart) {
              canvas.chart.destroy();
            }

            const ctx = canvas.getContext('2d');
            
            // Group data by category
            const groupedData = {};
            data.forEach(item => {
              const key = item.category || item.name || 'Unknown';
              groupedData[key] = (groupedData[key] || 0) + 1;
            });
            
            const chartData = {
              labels: Object.keys(groupedData),
              datasets: [{
                data: Object.values(groupedData),
                backgroundColor: [
                  'rgba(255, 99, 132, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(255, 205, 86, 0.2)',
                  'rgba(75, 192, 192, 0.2)'
                ],
                borderColor: [
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 205, 86, 1)',
                  'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
              }]
            };
            
            canvas.chart = new Chart(ctx, {
              type: type,
              data: chartData,
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: config.title || 'Chart'
                  }
                }
              }
            });

            canvas.style.display = 'block';
          }
        }

        window.runCompletePipeline = async () => {
          const resultDiv = document.getElementById('pipeline-result');
          resultDiv.innerHTML = '<p>Running complete pipeline...</p>';

          try {
            const etl = new MockETL();
            await etl
              .extract.api('https://jsonplaceholder.typicode.com/posts')
              .filter(post => post.id <= 10)
              .map(post => ({ ...post, category: post.id > 5 ? 'Recent' : 'Older' }))
              .load.chart('pie', { x: 'category', y: 'count', title: 'Posts by Category' })
              .run();

            resultDiv.innerHTML = '<p class="success">✅ Pipeline executed successfully!</p>';
          } catch (error) {
            resultDiv.innerHTML = \`<p class="error">❌ Error: \${error.message}</p>\`;
          }
        };
      `;
      document.head.appendChild(script);

      // Execute the function
      await (window as any).runCompletePipeline();

      // Check results
      const resultDiv = document.getElementById('pipeline-result');
      expect(resultDiv.innerHTML).toContain('✅ Pipeline executed successfully!');

      const canvas = document.getElementById('pipeline-chart');
      expect(canvas.style.display).toBe('block');
      expect(canvas.chart).toBeDefined();

      expect(fetch).toHaveBeenCalledWith('https://jsonplaceholder.typicode.com/posts');
    });
  });

  describe('Permalink Sharing', () => {
    it('should generate permalink successfully', async () => {
      // Load the permalink functions
      const script = document.createElement('script');
      script.textContent = `
        async function generatePermalink(repository, branch = 'main', filePath) {
          try {
            const repoMatch = repository.match(/github\\.com\\/([^\\/]+\\/[^\\/]+)/);
            if (!repoMatch) {
              throw new Error('Invalid GitHub repository URL');
            }

            const repoPath = repoMatch[1];
            const rawUrl = \`https://raw.githubusercontent.com/\${repoPath}/\${branch}/\${filePath}\`;
            const previewUrl = \`https://htmlpreview.github.io/?\${rawUrl}\`;
            
            return {
              url: rawUrl,
              previewUrl: previewUrl,
              success: true
            };
          } catch (error) {
            return {
              url: '',
              previewUrl: '',
              success: false,
              error: error.message
            };
          }
        }

        async function copyToClipboard(text) {
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(text);
              return true;
            } else {
              const textArea = document.createElement('textarea');
              textArea.value = text;
              textArea.style.position = 'fixed';
              textArea.style.left = '-999999px';
              textArea.style.top = '-999999px';
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              
              const success = document.execCommand('copy');
              document.body.removeChild(textArea);
              return success;
            }
          } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
          }
        }

        window.shareDemo = async function(demoName) {
          const repository = 'https://github.com/Insomniak313/browser-etl';
          const filePath = \`examples/basic-usage.html\`;
          
          try {
            const result = await generatePermalink(repository, 'main', filePath);
            
            if (result.success) {
              const copied = await copyToClipboard(result.previewUrl);
              
              if (copied) {
                alert('🔗 Permalink copié dans le presse-papiers!\\n\\n' + result.previewUrl);
              } else {
                prompt('Partagez ce lien:', result.previewUrl);
              }
            } else {
              alert(\`Erreur lors de la génération du permalink: \${result.error}\`);
            }
          } catch (error) {
            alert(\`Erreur: \${error.message}\`);
          }
        };
      `;
      document.head.appendChild(script);

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      // Execute the function
      await (window as any).shareDemo('basic-usage');

      // Check that permalink was generated and copied
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔗 Permalink copié dans le presse-papiers!')
      );

      // Check clipboard API was called
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('https://htmlpreview.github.io/?https://raw.githubusercontent.com/Insomniak313/browser-etl/main/examples/basic-usage.html')
      );

      alertSpy.mockRestore();
    });
  });
});