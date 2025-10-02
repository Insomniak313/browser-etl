/**
 * Advanced Pipeline Example with Permalink Sharing
 * This example demonstrates how to use the Browser ETL library
 * with permalink functionality for sharing results
 */

// Import the permalink utilities (in a real implementation, this would be from the compiled library)
// import { generatePermalink, createShareButton, copyPermalinkToClipboard } from '../src/utils/permalink.js';

class AdvancedETLPipeline {
    constructor() {
        this.data = [];
        this.results = [];
        this.shareButtons = new Map();
    }

    /**
     * Run a complete ETL pipeline with data processing
     */
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

    /**
     * Extract users data from API
     */
    async extractUsers() {
        console.log('📥 Extracting users data...');
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        const users = await response.json();
        console.log(`✅ Extracted ${users.length} users`);
        return users;
    }

    /**
     * Extract posts data from API
     */
    async extractPosts() {
        console.log('📥 Extracting posts data...');
        const response = await fetch('https://jsonplaceholder.typicode.com/posts');
        const posts = await response.json();
        console.log(`✅ Extracted ${posts.length} posts`);
        return posts;
    }

    /**
     * Enrich posts with user information
     */
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
        
        console.log(`✅ Enriched ${enrichedPosts.length} posts`);
        return enrichedPosts;
    }

    /**
     * Filter and aggregate data
     */
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
        
        console.log(`✅ Created summary for ${summary.length} companies`);
        return summary;
    }

    /**
     * Load results to UI
     */
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
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-family: Arial, sans-serif;
        `;
        
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

    /**
     * Generate a shareable permalink using htmlpreview.github.com
     */
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

    /**
     * Generate permalink using htmlpreview.github.com
     */
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
            const repoMatch = repository.match(/github\.com\/([^\/]+\/[^\/]+)/);
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
            const rawUrl = `https://raw.githubusercontent.com/${repoPath}/${branch}/${filePath}`;
            
            // Construct the htmlpreview URL
            const previewUrl = `https://htmlpreview.github.io/?${rawUrl}`;
            
            // Add query parameters if provided
            const queryString = Object.entries(queryParams)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&');
            
            const finalPreviewUrl = queryString ? `${previewUrl}&${queryString}` : previewUrl;

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

    /**
     * Create a share button for the permalink
     */
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
        button.style.cssText = `
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
        `;
        
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
        
        // Add hover effect
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        });
        
        // Append to results container
        const container = document.getElementById('pipeline-results');
        if (container) {
            container.appendChild(button);
        } else {
            document.body.appendChild(button);
        }
    }

    /**
     * Copy text to clipboard
     */
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

// Example usage
async function runAdvancedPipeline() {
    const pipeline = new AdvancedETLPipeline();
    
    try {
        const results = await pipeline.runCompletePipeline();
        console.log('Pipeline results:', results);
        
        // Show success message
        const message = document.createElement('div');
        message.innerHTML = `
            <div style="
                background: #d4edda;
                color: #155724;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border: 1px solid #c3e6cb;
            ">
                <strong>✅ Advanced Pipeline Completed!</strong><br>
                Processed data from ${results.length} companies with ${results.reduce((sum, item) => sum + item.postCount, 0)} total posts.
                Use the share button to create a permalink for these results.
            </div>
        `;
        document.body.appendChild(message);
        
    } catch (error) {
        console.error('Pipeline failed:', error);
        
        // Show error message
        const message = document.createElement('div');
        message.innerHTML = `
            <div style="
                background: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border: 1px solid #f5c6cb;
            ">
                <strong>❌ Pipeline Failed:</strong><br>
                ${error.message}
            </div>
        `;
        document.body.appendChild(message);
    }
}

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined') {
    // Add a button to run the pipeline
    const runButton = document.createElement('button');
    runButton.textContent = '🚀 Run Advanced Pipeline';
    runButton.style.cssText = `
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        color: white;
        border: none;
        padding: 15px 30px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 18px;
        font-weight: 600;
        margin: 20px;
        box-shadow: 0 4px 15px rgba(67, 233, 123, 0.3);
        transition: all 0.3s ease;
    `;
    
    runButton.addEventListener('click', runAdvancedPipeline);
    runButton.addEventListener('mouseenter', () => {
        runButton.style.transform = 'translateY(-2px)';
        runButton.style.boxShadow = '0 6px 20px rgba(67, 233, 123, 0.4)';
    });
    runButton.addEventListener('mouseleave', () => {
        runButton.style.transform = 'translateY(0)';
        runButton.style.boxShadow = '0 4px 15px rgba(67, 233, 123, 0.3)';
    });
    
    document.body.appendChild(runButton);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedETLPipeline, runAdvancedPipeline };
}