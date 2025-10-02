/**
 * Utility functions for generating permalinks using htmlpreview.github.com
 * This allows sharing HTML content through GitHub's preview service
 */

export interface PermalinkOptions {
  /** The GitHub repository URL (e.g., 'https://github.com/user/repo') */
  repository: string;
  /** The branch name (default: 'main') */
  branch?: string;
  /** The file path in the repository */
  filePath: string;
  /** Additional query parameters for the preview */
  queryParams?: Record<string, string>;
}

export interface PermalinkResult {
  /** The generated permalink URL */
  url: string;
  /** The htmlpreview URL */
  previewUrl: string;
  /** Whether the permalink was generated successfully */
  success: boolean;
  /** Error message if generation failed */
  error?: string;
}

/**
 * Generates a permalink using htmlpreview.github.com
 * @param options Configuration for the permalink
 * @returns Promise with the permalink result
 */
export async function generatePermalink(options: PermalinkOptions): Promise<PermalinkResult> {
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
 * Creates a shareable permalink for HTML content
 * @param htmlContent The HTML content to share
 * @param filename The filename for the content
 * @param options Additional options for the permalink
 * @returns Promise with the permalink result
 */
export async function createHtmlPermalink(
  htmlContent: string,
  filename: string,
  options: Omit<PermalinkOptions, 'filePath'>
): Promise<PermalinkResult> {
  try {
    // For demo purposes, we'll create a data URL or use a temporary approach
    // In a real implementation, you might want to:
    // 1. Create a GitHub gist with the content
    // 2. Upload to a GitHub repository
    // 3. Use a different service for temporary hosting
    
    const filePath = `examples/${filename}`;
    
    return await generatePermalink({
      ...options,
      filePath
    });
  } catch (error) {
    return {
      url: '',
      previewUrl: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create HTML permalink'
    };
  }
}

/**
 * Generates a permalink for the current demo page
 * @param demoName The name of the demo
 * @param repository The GitHub repository URL
 * @param branch The branch name (default: 'main')
 * @returns Promise with the permalink result
 */
export async function createDemoPermalink(
  demoName: string,
  repository: string,
  branch: string = 'main'
): Promise<PermalinkResult> {
  const filePath = `examples/${demoName}.html`;
  
  return await generatePermalink({
    repository,
    branch,
    filePath
  });
}

/**
 * Utility function to copy permalink to clipboard
 * @param url The URL to copy
 * @returns Promise indicating success
 */
export async function copyPermalinkToClipboard(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
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

/**
 * Creates a share button element with permalink functionality
 * @param container The container element to append the button to
 * @param options Permalink options
 * @param buttonText Text for the button (default: 'Share')
 * @returns The created button element
 */
export function createShareButton(
  container: HTMLElement,
  options: PermalinkOptions,
  buttonText: string = 'Share'
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = buttonText;
  button.className = 'btn btn-secondary';
  button.style.marginLeft = '10px';
  
  button.addEventListener('click', async () => {
    try {
      button.disabled = true;
      button.textContent = 'Generating...';
      
      const result = await generatePermalink(options);
      
      if (result.success) {
        const copied = await copyPermalinkToClipboard(result.previewUrl);
        
        if (copied) {
          button.textContent = 'Copied!';
          setTimeout(() => {
            button.textContent = buttonText;
            button.disabled = false;
          }, 2000);
        } else {
          // Show the URL in a prompt if clipboard copy fails
          prompt('Share this link:', result.previewUrl);
          button.textContent = buttonText;
          button.disabled = false;
        }
      } else {
        alert(`Failed to generate permalink: ${result.error}`);
        button.textContent = buttonText;
        button.disabled = false;
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      button.textContent = buttonText;
      button.disabled = false;
    }
  });
  
  container.appendChild(button);
  return button;
}