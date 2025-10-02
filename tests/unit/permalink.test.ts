import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generatePermalink, 
  createHtmlPermalink, 
  createDemoPermalink, 
  copyPermalinkToClipboard, 
  createShareButton 
} from '../../src/utils/permalink';

describe('Permalink utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock DOM methods
    const mockTextArea = {
      value: '',
      style: {},
      focus: vi.fn(),
      select: vi.fn()
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockTextArea as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockTextArea as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockTextArea as any);
    vi.spyOn(document, 'execCommand').mockReturnValue(true);

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      writable: true
    });

    // Mock alert and prompt
    global.alert = vi.fn();
    global.prompt = vi.fn().mockReturnValue('https://example.com');
  });

  describe('generatePermalink', () => {
    it('should generate valid permalink', async () => {
      const options = {
        repository: 'https://github.com/user/repo',
        branch: 'main',
        filePath: 'examples/demo.html',
        queryParams: { theme: 'dark' }
      };

      const result = await generatePermalink(options);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://raw.githubusercontent.com/user/repo/main/examples/demo.html');
      expect(result.previewUrl).toBe('https://htmlpreview.github.io/?https://raw.githubusercontent.com/user/repo/main/examples/demo.html&theme=dark');
    });

    it('should use default branch', async () => {
      const options = {
        repository: 'https://github.com/user/repo',
        filePath: 'examples/demo.html'
      };

      const result = await generatePermalink(options);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://raw.githubusercontent.com/user/repo/main/examples/demo.html');
    });

    it('should handle missing repository', async () => {
      const options = {
        filePath: 'examples/demo.html'
      } as any;

      const result = await generatePermalink(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Repository and filePath are required');
    });

    it('should handle missing filePath', async () => {
      const options = {
        repository: 'https://github.com/user/repo'
      } as any;

      const result = await generatePermalink(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Repository and filePath are required');
    });

    it('should handle invalid GitHub URL', async () => {
      const options = {
        repository: 'https://gitlab.com/user/repo',
        filePath: 'examples/demo.html'
      };

      const result = await generatePermalink(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid GitHub repository URL');
    });

    it('should handle URL without github.com', async () => {
      const options = {
        repository: 'https://example.com/user/repo',
        filePath: 'examples/demo.html'
      };

      const result = await generatePermalink(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid GitHub repository URL');
    });

    it('should handle query parameters', async () => {
      const options = {
        repository: 'https://github.com/user/repo',
        filePath: 'examples/demo.html',
        queryParams: {
          theme: 'dark',
          lang: 'en',
          debug: 'true'
        }
      };

      const result = await generatePermalink(options);

      expect(result.success).toBe(true);
      expect(result.previewUrl).toContain('theme=dark');
      expect(result.previewUrl).toContain('lang=en');
      expect(result.previewUrl).toContain('debug=true');
    });

    it('should handle empty query parameters', async () => {
      const options = {
        repository: 'https://github.com/user/repo',
        filePath: 'examples/demo.html',
        queryParams: {}
      };

      const result = await generatePermalink(options);

      expect(result.success).toBe(true);
      expect(result.previewUrl).toBe('https://htmlpreview.github.io/?https://raw.githubusercontent.com/user/repo/main/examples/demo.html');
    });

    it('should handle special characters in query parameters', async () => {
      const options = {
        repository: 'https://github.com/user/repo',
        filePath: 'examples/demo.html',
        queryParams: {
          'param with spaces': 'value with spaces',
          'param&with=special': 'value&with=special'
        }
      };

      const result = await generatePermalink(options);

      expect(result.success).toBe(true);
      expect(result.previewUrl).toContain('param%20with%20spaces=value%20with%20spaces');
      expect(result.previewUrl).toContain('param%26with%3Dspecial=value%26with%3Dspecial');
    });
  });

  describe('createHtmlPermalink', () => {
    it('should create HTML permalink', async () => {
      const htmlContent = '<html><body>Hello World</body></html>';
      const filename = 'test.html';
      const options = {
        repository: 'https://github.com/user/repo',
        branch: 'main'
      };

      const result = await createHtmlPermalink(htmlContent, filename, options);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://raw.githubusercontent.com/user/repo/main/examples/test.html');
    });

    it('should handle errors', async () => {
      const htmlContent = '<html><body>Hello World</body></html>';
      const filename = 'test.html';
      const options = {
        repository: 'invalid-url',
        branch: 'main'
      };

      const result = await createHtmlPermalink(htmlContent, filename, options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('createDemoPermalink', () => {
    it('should create demo permalink', async () => {
      const result = await createDemoPermalink(
        'advanced-pipeline',
        'https://github.com/user/repo',
        'main'
      );

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://raw.githubusercontent.com/user/repo/main/examples/advanced-pipeline.html');
    });

    it('should use default branch', async () => {
      const result = await createDemoPermalink(
        'basic-usage',
        'https://github.com/user/repo'
      );

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://raw.githubusercontent.com/user/repo/main/examples/basic-usage.html');
    });
  });

  describe('copyPermalinkToClipboard', () => {
    it('should copy to clipboard using modern API', async () => {
      const url = 'https://htmlpreview.github.io/?https://example.com';

      const result = await copyPermalinkToClipboard(url);

      expect(result).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(url);
    });

    it('should fallback to execCommand for older browsers', async () => {
      // Mock navigator.clipboard as unavailable
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true
      });

      const url = 'https://htmlpreview.github.io/?https://example.com';

      const result = await copyPermalinkToClipboard(url);

      expect(result).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it('should handle clipboard errors', async () => {
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Clipboard error'));

      const url = 'https://htmlpreview.github.io/?https://example.com';

      const result = await copyPermalinkToClipboard(url);

      expect(result).toBe(false);
    });

    it('should handle execCommand failure', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true
      });

      vi.spyOn(document, 'execCommand').mockReturnValue(false);

      const url = 'https://htmlpreview.github.io/?https://example.com';

      const result = await copyPermalinkToClipboard(url);

      expect(result).toBe(false);
    });
  });

  describe('createShareButton', () => {
    let mockContainer: HTMLElement;
    let mockButton: HTMLButtonElement;

    beforeEach(() => {
      mockContainer = document.createElement('div');
      mockButton = document.createElement('button');
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockButton);
      vi.spyOn(mockContainer, 'appendChild').mockImplementation(() => mockButton);
      
      // Mock button methods
      mockButton.addEventListener = vi.fn();
      mockButton.click = vi.fn();
    });

    it('should create share button', () => {
      const options = {
        repository: 'https://github.com/user/repo',
        filePath: 'examples/demo.html'
      };

      const button = createShareButton(mockContainer, options, 'Share Demo');

      expect(button).toBe(mockButton);
      expect(button.textContent).toBe('Share Demo');
      expect(button.className).toBe('btn btn-secondary');
      expect(mockContainer.appendChild).toHaveBeenCalledWith(button);
    });

    it('should use default button text', () => {
      const options = {
        repository: 'https://github.com/user/repo',
        filePath: 'examples/demo.html'
      };

      const button = createShareButton(mockContainer, options);

      expect(button.textContent).toBe('Share');
    });

    it('should handle button click with successful permalink', async () => {
      const options = {
        repository: 'https://github.com/user/repo',
        filePath: 'examples/demo.html'
      };

      const button = createShareButton(mockContainer, options);
      
      // Simulate click event
      const clickHandler = mockButton.addEventListener.mock.calls[0][1];
      await clickHandler();

      expect(button.disabled).toBe(false);
      expect(button.textContent).toBe('Share');
    });

    it('should handle button click with failed permalink', async () => {
      const options = {
        repository: 'invalid-url',
        filePath: 'examples/demo.html'
      };

      const button = createShareButton(mockContainer, options);
      
      // Simulate click event
      const clickHandler = mockButton.addEventListener.mock.calls[0][1];
      await clickHandler();

      expect(alert).toHaveBeenCalledWith(expect.stringContaining('Failed to generate permalink'));
      expect(button.disabled).toBe(false);
      expect(button.textContent).toBe('Share');
    });

    it('should handle clipboard copy failure', async () => {
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Clipboard error'));
      vi.spyOn(document, 'execCommand').mockReturnValue(false);

      const options = {
        repository: 'https://github.com/user/repo',
        filePath: 'examples/demo.html'
      };

      const button = createShareButton(mockContainer, options);
      
      // Simulate click event
      const clickHandler = mockButton.addEventListener.mock.calls[0][1];
      await clickHandler();

      expect(prompt).toHaveBeenCalledWith('Share this link:', expect.any(String));
      expect(button.disabled).toBe(false);
      expect(button.textContent).toBe('Share');
    });
  });
});