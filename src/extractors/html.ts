import { IExtractor } from '../types';

export interface HtmlExtractorConfig {
  selector: string;
  url?: string;
  attribute?: string;
  text?: boolean;
  html?: boolean;
  multiple?: boolean;
}

/**
 * HTML Extractor - extracts data from HTML elements
 */
export class HtmlExtractor implements IExtractor {
  readonly name = 'html';

  async extract(config: HtmlExtractorConfig): Promise<any> {
    const {
      selector,
      url,
      attribute,
      text = false,
      html = false,
      multiple = false
    } = config;

    if (!selector) {
      throw new Error('Selector is required for HTML extraction');
    }

    let document: Document;

    if (url) {
      // Fetch HTML from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch HTML from ${url}: ${response.statusText}`);
      }
      const htmlContent = await response.text();
      const parser = new DOMParser();
      document = parser.parseFromString(htmlContent, 'text/html');
    } else {
      // Use current document
      document = window.document;
    }

    const elements = document.querySelectorAll(selector);

    if (elements.length === 0) {
      return multiple ? [] : null;
    }

    if (multiple) {
      return Array.from(elements).map(element => this.extractElementData(element, { 
        ...(attribute && { attribute }), 
        text, 
        html 
      }));
    } else {
      return this.extractElementData(elements[0], { 
        ...(attribute && { attribute }), 
        text, 
        html 
      });
    }
  }

  supports(config: any): boolean {
    return config && typeof config.selector === 'string';
  }

  private extractElementData(element: Element, options: {
    attribute?: string;
    text?: boolean;
    html?: boolean;
  }): any {
    const { attribute, text, html } = options;

    if (attribute) {
      return element.getAttribute(attribute);
    }

    if (html) {
      return element.innerHTML;
    }

    if (text) {
      return element.textContent?.trim();
    }

    // Default: return text content
    return element.textContent?.trim();
  }
}