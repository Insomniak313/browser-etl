import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock fetch globally
global.fetch = vi.fn();

describe('Advanced Pipeline Example Integration Tests', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    // Create a new JSDOM instance for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <div id="advanced-result" class="result-area">
            Click "Run Advanced Pipeline" to see the complete ETL process with permalink sharing
          </div>
          <div id="pipeline-results"></div>
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

  describe('Advanced Pipeline Functionality', () => {
    it('should run advanced pipeline successfully', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com', company: { name: 'Acme Corp' } },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', company: { name: 'Tech Inc' } },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', company: { name: 'Acme Corp' } }
      ];

      const mockPosts = [
        { id: 1, title: 'Post 1', userId: 1, body: 'Content 1' },
        { id: 2, title: 'Post 2', userId: 2, body: 'Content 2' },
        { id: 3, title: 'Post 3', userId: 1, body: 'Content 3' },
        { id: 4, title: 'Post 4', userId: 3, body: 'Content 4' }
      ];

      // Mock API responses
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPosts)
        });

      // Load the AdvancedETLPipeline class
      const script = document.createElement('script');
      script.textContent = `
        class AdvancedETLPipeline {
          constructor() {
            this.data = [];
            this.results = [];
            this.shareButtons = new Map();
          }

          async runCompletePipeline() {
            try {
              console.log('🚀 Starting advanced ETL pipeline...');
              
              // Step 1: Extract data from multiple sources
              const usersData = await this.extractUsers();
              const postsData = await this.extractPosts();
              
              // Step 2: Transform and join data
              const enrichedData = await this.enrichData(usersData, postsData);
              
              // Step 3: Filter and aggregate
              const filteredData = this.filterAndAggregate(enrichedData);
              
              // Step 4: Load results
              await this.loadResults(filteredData);
              
              // Step 5: Generate shareable permalink
              await this.generateShareableLink();
              
              console.log('✅ Pipeline completed successfully!');
              return filteredData;
              
            } catch (error) {
              console.error('❌ Pipeline failed:', error);
              throw error;
            }
          }

          async extractUsers() {
            console.log('📥 Extracting users data...');
            const response = await fetch('https://jsonplaceholder.typicode.com/users');
            const users = await response.json();
            console.log(\`✅ Extracted \${users.length} users\`);
            return users;
          }

          async extractPosts() {
            console.log('📥 Extracting posts data...');
            const response = await fetch('https://jsonplaceholder.typicode.com/posts');
            const posts = await response.json();
            console.log(\`✅ Extracted \${posts.length} posts\`);
            return posts;
          }

          async enrichData(users, posts) {
            console.log('🔄 Enriching data...');
            
            const enrichedPosts = posts.map(post => {
              const user = users.find(u => u.id === post.userId);
              return {
                ...post,
                user: user ? {
                  name: user.name,
                  email: user.email,
                  company: user.company.name
                } : null
              };
            });
            
            console.log(\`✅ Enriched \${enrichedPosts.length} posts\`);
            return enrichedPosts;
          }

          filterAndAggregate(data) {
            console.log('🔍 Filtering and aggregating data...');
            
            // Filter posts with user information
            const validPosts = data.filter(post => post.user !== null);
            
            // Group by company
            const groupedByCompany = validPosts.reduce((acc, post) => {
              const company = post.user.company;
              if (!acc[company]) {
                acc[company] = [];
              }
              acc[company].push(post);
              return acc;
            }, {});
            
            // Create summary
            const summary = Object.entries(groupedByCompany).map(([company, posts]) => ({
              company,
              postCount: posts.length,
              avgTitleLength: posts.reduce((sum, post) => sum + post.title.length, 0) / posts.length,
              users: [...new Set(posts.map(p => p.user.name))]
            }));
            
            console.log(\`✅ Created summary for \${summary.length} companies\`);
            return summary;
          }

          async loadResults(data) {
            console.log('📊 Loading results to UI...');
            
            // Create or update results container
            let container = document.getElementById('pipeline-results');
            if (!container) {
              container = document.createElement('div');
              container.id = 'pipeline-results';
              container.innerHTML = '<h3>📊 Pipeline Results</h3>';
              document.body.appendChild(container);
            }
            
            // Create table
            const table = document.createElement('table');
            table.style.cssText = \`
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-family: Arial, sans-serif;
            \`;
            
            // Header
            const headerRow = document.createElement('tr');
            headerRow.style.backgroundColor = '#f2f2f2';
            ['Company', 'Posts', 'Avg Title Length', 'Users'].forEach(header => {
              const th = document.createElement('th');
              th.textContent = header;
              th.style.cssText = 'padding: 12px; border: 1px solid #ddd; text-align: left;';
              headerRow.appendChild(th);
            });
            table.appendChild(headerRow);
            
            // Data rows
            data.forEach(item => {
              const row = document.createElement('tr');
              [item.company, item.postCount, item.avgTitleLength.toFixed(1), item.users.join(', ')].forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                td.style.cssText = 'padding: 12px; border: 1px solid #ddd;';
                row.appendChild(td);
              });
              table.appendChild(row);
            });
            
            container.appendChild(table);
            
            // Store data for sharing
            this.data = data;
            console.log('✅ Results loaded to UI');
          }

          async generateShareableLink() {
            console.log('🔗 Generating shareable permalink...');
            
            try {
              // Create a summary of the results
              const summary = {
                timestamp: new Date().toISOString(),
                dataCount: this.data.length,
                companies: this.data.map(item => item.company),
                totalPosts: this.data.reduce((sum, item) => sum + item.postCount, 0)
              };
              
              // Generate permalink using the utility function
              const permalinkResult = await this.generatePermalink({
                repository: 'https://github.com/Insomniak313/browser-etl',
                branch: 'main',
                filePath: 'examples/advanced-pipeline.js',
                queryParams: {
                  summary: JSON.stringify(summary),
                  timestamp: summary.timestamp
                }
              });
              
              if (permalinkResult.success) {
                // Create share button
                this.createShareButton(permalinkResult.previewUrl);
                console.log('✅ Shareable permalink generated:', permalinkResult.previewUrl);
              } else {
                console.error('❌ Failed to generate permalink:', permalinkResult.error);
              }
              
            } catch (error) {
              console.error('❌ Error generating shareable link:', error);
            }
          }

          async generatePermalink(options) {
            try {
              const { repository, branch = 'main', filePath, queryParams = {} } = options;
              
              // Validate inputs
              if (!repository || !filePath) {
                return {
                  url: '',
                  previewUrl: '',
                  success: false,
                  error: 'Repository and filePath are required'
                };
              }

              // Extract repository path from GitHub URL
              const repoMatch = repository.match(/github\\.com\\/([^\\/]+\\/[^\\/]+)/);
              if (!repoMatch) {
                return {
                  url: '',
                  previewUrl: '',
                  success: false,
                  error: 'Invalid GitHub repository URL'
                };
              }

              const repoPath = repoMatch[1];
              
              // Construct the raw GitHub URL
              const rawUrl = \`https://raw.githubusercontent.com/\${repoPath}/\${branch}/\${filePath}\`;
              
              // Construct the htmlpreview URL
              const previewUrl = \`https://htmlpreview.github.io/?\${rawUrl}\`;
              
              // Add query parameters if provided
              const queryString = Object.entries(queryParams)
                .map(([key, value]) => \`\${encodeURIComponent(key)}=\${encodeURIComponent(value)}\`)
                .join('&');
              
              const finalPreviewUrl = queryString ? \`\${previewUrl}&\${queryString}\` : previewUrl;

              return {
                url: rawUrl,
                previewUrl: finalPreviewUrl,
                success: true
              };
            } catch (error) {
              return {
                url: '',
                previewUrl: '',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
              };
            }
          }

          createShareButton(previewUrl) {
            // Remove existing share button if any
            const existingButton = document.getElementById('share-button');
            if (existingButton) {
              existingButton.remove();
            }
            
            // Create new share button
            const button = document.createElement('button');
            button.id = 'share-button';
            button.textContent = '🔗 Share Results';
            button.style.cssText = \`
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 25px;
              cursor: pointer;
              font-size: 16px;
              font-weight: 600;
              margin: 20px 0;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
              transition: all 0.3s ease;
            \`;
            
            button.addEventListener('click', async () => {
              try {
                button.disabled = true;
                button.textContent = '📋 Copying...';
                
                const success = await this.copyToClipboard(previewUrl);
                
                if (success) {
                  button.textContent = '✅ Copied!';
                  setTimeout(() => {
                    button.textContent = '🔗 Share Results';
                    button.disabled = false;
                  }, 2000);
                } else {
                  // Fallback: show URL in prompt
                  prompt('Share this link:', previewUrl);
                  button.textContent = '🔗 Share Results';
                  button.disabled = false;
                }
              } catch (error) {
                console.error('Error copying to clipboard:', error);
                prompt('Share this link:', previewUrl);
                button.textContent = '🔗 Share Results';
                button.disabled = false;
              }
            });
            
            // Append to results container
            const container = document.getElementById('pipeline-results');
            if (container) {
              container.appendChild(button);
            } else {
              document.body.appendChild(button);
            }
          }

          async copyToClipboard(text) {
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
              } else {
                // Fallback for older browsers
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
        }

        window.runAdvancedPipeline = async function() {
          const pipeline = new AdvancedETLPipeline();
          
          try {
            const results = await pipeline.runCompletePipeline();
            console.log('Pipeline results:', results);
            
            // Show success message
            const message = document.createElement('div');
            message.innerHTML = \`
              <div style="
                background: #d4edda;
                color: #155724;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border: 1px solid #c3e6cb;
              ">
                <strong>✅ Advanced Pipeline Completed!</strong><br>
                Processed data from \${results.length} companies with \${results.reduce((sum, item) => sum + item.postCount, 0)} total posts.
                Use the share button to create a permalink for these results.
              </div>
            \`;
            document.body.appendChild(message);
            
          } catch (error) {
            console.error('Pipeline failed:', error);
            
            // Show error message
            const message = document.createElement('div');
            message.innerHTML = \`
              <div style="
                background: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border: 1px solid #f5c6cb;
              ">
                <strong>❌ Pipeline Failed:</strong><br>
                \${error.message}
              </div>
            \`;
            document.body.appendChild(message);
          }
        };
      `;
      document.head.appendChild(script);

      // Execute the function
      await (window as any).runAdvancedPipeline();

      // Check that API calls were made
      expect(fetch).toHaveBeenCalledWith('https://jsonplaceholder.typicode.com/users');
      expect(fetch).toHaveBeenCalledWith('https://jsonplaceholder.typicode.com/posts');

      // Check that results were loaded
      const resultsContainer = document.getElementById('pipeline-results');
      expect(resultsContainer).toBeTruthy();
      expect(resultsContainer.innerHTML).toContain('📊 Pipeline Results');

      // Check that table was created
      const table = resultsContainer.querySelector('table');
      expect(table).toBeTruthy();
      expect(table.rows.length).toBeGreaterThan(1); // Header + data rows

      // Check that share button was created
      const shareButton = document.getElementById('share-button');
      expect(shareButton).toBeTruthy();
      expect(shareButton.textContent).toBe('🔗 Share Results');
    });

    it('should handle pipeline errors gracefully', async () => {
      // Mock API failure
      (fetch as any).mockRejectedValue(new Error('Network error'));

      // Load the AdvancedETLPipeline class
      const script = document.createElement('script');
      script.textContent = `
        class AdvancedETLPipeline {
          constructor() {
            this.data = [];
            this.results = [];
            this.shareButtons = new Map();
          }

          async runCompletePipeline() {
            try {
              console.log('🚀 Starting advanced ETL pipeline...');
              
              // Step 1: Extract data from multiple sources
              const usersData = await this.extractUsers();
              const postsData = await this.extractPosts();
              
              // Step 2: Transform and join data
              const enrichedData = await this.enrichData(usersData, postsData);
              
              // Step 3: Filter and aggregate
              const filteredData = this.filterAndAggregate(enrichedData);
              
              // Step 4: Load results
              await this.loadResults(filteredData);
              
              // Step 5: Generate shareable permalink
              await this.generateShareableLink();
              
              console.log('✅ Pipeline completed successfully!');
              return filteredData;
              
            } catch (error) {
              console.error('❌ Pipeline failed:', error);
              throw error;
            }
          }

          async extractUsers() {
            console.log('📥 Extracting users data...');
            const response = await fetch('https://jsonplaceholder.typicode.com/users');
            const users = await response.json();
            console.log(\`✅ Extracted \${users.length} users\`);
            return users;
          }

          async extractPosts() {
            console.log('📥 Extracting posts data...');
            const response = await fetch('https://jsonplaceholder.typicode.com/posts');
            const posts = await response.json();
            console.log(\`✅ Extracted \${posts.length} posts\`);
            return posts;
          }

          async enrichData(users, posts) {
            console.log('🔄 Enriching data...');
            
            const enrichedPosts = posts.map(post => {
              const user = users.find(u => u.id === post.userId);
              return {
                ...post,
                user: user ? {
                  name: user.name,
                  email: user.email,
                  company: user.company.name
                } : null
              };
            });
            
            console.log(\`✅ Enriched \${enrichedPosts.length} posts\`);
            return enrichedPosts;
          }

          filterAndAggregate(data) {
            console.log('🔍 Filtering and aggregating data...');
            
            // Filter posts with user information
            const validPosts = data.filter(post => post.user !== null);
            
            // Group by company
            const groupedByCompany = validPosts.reduce((acc, post) => {
              const company = post.user.company;
              if (!acc[company]) {
                acc[company] = [];
              }
              acc[company].push(post);
              return acc;
            }, {});
            
            // Create summary
            const summary = Object.entries(groupedByCompany).map(([company, posts]) => ({
              company,
              postCount: posts.length,
              avgTitleLength: posts.reduce((sum, post) => sum + post.title.length, 0) / posts.length,
              users: [...new Set(posts.map(p => p.user.name))]
            }));
            
            console.log(\`✅ Created summary for \${summary.length} companies\`);
            return summary;
          }

          async loadResults(data) {
            console.log('📊 Loading results to UI...');
            
            // Create or update results container
            let container = document.getElementById('pipeline-results');
            if (!container) {
              container = document.createElement('div');
              container.id = 'pipeline-results';
              container.innerHTML = '<h3>📊 Pipeline Results</h3>';
              document.body.appendChild(container);
            }
            
            // Create table
            const table = document.createElement('table');
            table.style.cssText = \`
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-family: Arial, sans-serif;
            \`;
            
            // Header
            const headerRow = document.createElement('tr');
            headerRow.style.backgroundColor = '#f2f2f2';
            ['Company', 'Posts', 'Avg Title Length', 'Users'].forEach(header => {
              const th = document.createElement('th');
              th.textContent = header;
              th.style.cssText = 'padding: 12px; border: 1px solid #ddd; text-align: left;';
              headerRow.appendChild(th);
            });
            table.appendChild(headerRow);
            
            // Data rows
            data.forEach(item => {
              const row = document.createElement('tr');
              [item.company, item.postCount, item.avgTitleLength.toFixed(1), item.users.join(', ')].forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                td.style.cssText = 'padding: 12px; border: 1px solid #ddd;';
                row.appendChild(td);
              });
              table.appendChild(row);
            });
            
            container.appendChild(table);
            
            // Store data for sharing
            this.data = data;
            console.log('✅ Results loaded to UI');
          }

          async generateShareableLink() {
            console.log('🔗 Generating shareable permalink...');
            
            try {
              // Create a summary of the results
              const summary = {
                timestamp: new Date().toISOString(),
                dataCount: this.data.length,
                companies: this.data.map(item => item.company),
                totalPosts: this.data.reduce((sum, item) => sum + item.postCount, 0)
              };
              
              // Generate permalink using the utility function
              const permalinkResult = await this.generatePermalink({
                repository: 'https://github.com/Insomniak313/browser-etl',
                branch: 'main',
                filePath: 'examples/advanced-pipeline.js',
                queryParams: {
                  summary: JSON.stringify(summary),
                  timestamp: summary.timestamp
                }
              });
              
              if (permalinkResult.success) {
                // Create share button
                this.createShareButton(permalinkResult.previewUrl);
                console.log('✅ Shareable permalink generated:', permalinkResult.previewUrl);
              } else {
                console.error('❌ Failed to generate permalink:', permalinkResult.error);
              }
              
            } catch (error) {
              console.error('❌ Error generating shareable link:', error);
            }
          }

          async generatePermalink(options) {
            try {
              const { repository, branch = 'main', filePath, queryParams = {} } = options;
              
              // Validate inputs
              if (!repository || !filePath) {
                return {
                  url: '',
                  previewUrl: '',
                  success: false,
                  error: 'Repository and filePath are required'
                };
              }

              // Extract repository path from GitHub URL
              const repoMatch = repository.match(/github\\.com\\/([^\\/]+\\/[^\\/]+)/);
              if (!repoMatch) {
                return {
                  url: '',
                  previewUrl: '',
                  success: false,
                  error: 'Invalid GitHub repository URL'
                };
              }

              const repoPath = repoMatch[1];
              
              // Construct the raw GitHub URL
              const rawUrl = \`https://raw.githubusercontent.com/\${repoPath}/\${branch}/\${filePath}\`;
              
              // Construct the htmlpreview URL
              const previewUrl = \`https://htmlpreview.github.io/?\${rawUrl}\`;
              
              // Add query parameters if provided
              const queryString = Object.entries(queryParams)
                .map(([key, value]) => \`\${encodeURIComponent(key)}=\${encodeURIComponent(value)}\`)
                .join('&');
              
              const finalPreviewUrl = queryString ? \`\${previewUrl}&\${queryString}\` : previewUrl;

              return {
                url: rawUrl,
                previewUrl: finalPreviewUrl,
                success: true
              };
            } catch (error) {
              return {
                url: '',
                previewUrl: '',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
              };
            }
          }

          createShareButton(previewUrl) {
            // Remove existing share button if any
            const existingButton = document.getElementById('share-button');
            if (existingButton) {
              existingButton.remove();
            }
            
            // Create new share button
            const button = document.createElement('button');
            button.id = 'share-button';
            button.textContent = '🔗 Share Results';
            button.style.cssText = \`
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 25px;
              cursor: pointer;
              font-size: 16px;
              font-weight: 600;
              margin: 20px 0;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
              transition: all 0.3s ease;
            \`;
            
            button.addEventListener('click', async () => {
              try {
                button.disabled = true;
                button.textContent = '📋 Copying...';
                
                const success = await this.copyToClipboard(previewUrl);
                
                if (success) {
                  button.textContent = '✅ Copied!';
                  setTimeout(() => {
                    button.textContent = '🔗 Share Results';
                    button.disabled = false;
                  }, 2000);
                } else {
                  // Fallback: show URL in prompt
                  prompt('Share this link:', previewUrl);
                  button.textContent = '🔗 Share Results';
                  button.disabled = false;
                }
              } catch (error) {
                console.error('Error copying to clipboard:', error);
                prompt('Share this link:', previewUrl);
                button.textContent = '🔗 Share Results';
                button.disabled = false;
              }
            });
            
            // Append to results container
            const container = document.getElementById('pipeline-results');
            if (container) {
              container.appendChild(button);
            } else {
              document.body.appendChild(button);
            }
          }

          async copyToClipboard(text) {
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
              } else {
                // Fallback for older browsers
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
        }

        window.runAdvancedPipeline = async function() {
          const pipeline = new AdvancedETLPipeline();
          
          try {
            const results = await pipeline.runCompletePipeline();
            console.log('Pipeline results:', results);
            
            // Show success message
            const message = document.createElement('div');
            message.innerHTML = \`
              <div style="
                background: #d4edda;
                color: #155724;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border: 1px solid #c3e6cb;
              ">
                <strong>✅ Advanced Pipeline Completed!</strong><br>
                Processed data from \${results.length} companies with \${results.reduce((sum, item) => sum + item.postCount, 0)} total posts.
                Use the share button to create a permalink for these results.
              </div>
            \`;
            document.body.appendChild(message);
            
          } catch (error) {
            console.error('Pipeline failed:', error);
            
            // Show error message
            const message = document.createElement('div');
            message.innerHTML = \`
              <div style="
                background: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border: 1px solid #f5c6cb;
              ">
                <strong>❌ Pipeline Failed:</strong><br>
                \${error.message}
              </div>
            \`;
            document.body.appendChild(message);
          }
        };
      `;
      document.head.appendChild(script);

      // Execute the function
      await (window as any).runAdvancedPipeline();

      // Check that error message was displayed
      const errorMessage = document.querySelector('div[style*="background: #f8d7da"]');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.innerHTML).toContain('❌ Pipeline Failed:');
      expect(errorMessage.innerHTML).toContain('Network error');
    });
  });

  describe('Permalink Generation', () => {
    it('should generate valid permalink', async () => {
      // Load the permalink generation function
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

        window.shareAdvancedDemo = async function() {
          const repository = 'https://github.com/Insomniak313/browser-etl';
          const filePath = \`examples/advanced-pipeline.html\`;
          
          try {
            const result = await generatePermalink(repository, 'main', filePath);
            
            if (result.success) {
              const copied = await navigator.clipboard.writeText(result.previewUrl);
              
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
      await (window as any).shareAdvancedDemo();

      // Check that permalink was generated and copied
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔗 Permalink copié dans le presse-papiers!')
      );

      // Check clipboard API was called
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('https://htmlpreview.github.io/?https://raw.githubusercontent.com/Insomniak313/browser-etl/main/examples/advanced-pipeline.html')
      );

      alertSpy.mockRestore();
    });

    it('should handle invalid repository URL', async () => {
      // Load the permalink generation function
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

        window.shareAdvancedDemo = async function() {
          const repository = 'https://invalid-url.com/repo';
          const filePath = \`examples/advanced-pipeline.html\`;
          
          try {
            const result = await generatePermalink(repository, 'main', filePath);
            
            if (result.success) {
              const copied = await navigator.clipboard.writeText(result.previewUrl);
              
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
      await (window as any).shareAdvancedDemo();

      // Check that error message was displayed
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('Erreur lors de la génération du permalink: Invalid GitHub repository URL')
      );

      alertSpy.mockRestore();
    });
  });
});