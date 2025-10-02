import { ILoader } from '../types';

export interface FileLoaderConfig {
  filename: string;
  format?: 'json' | 'csv' | 'txt' | 'xml';
  mimeType?: string;
  download?: boolean;
}

/**
 * File Loader - loads data into downloadable files
 */
export class FileLoader implements ILoader {
  readonly name = 'file';

  async load(data: any, config: FileLoaderConfig): Promise<void> {
    const {
      filename,
      format = 'json',
      mimeType,
      download = true
    } = config;

    if (!filename) {
      throw new Error('Filename is required for file loading');
    }

    const content = this.formatData(data, format);
    const finalMimeType = mimeType || this.getMimeType(format);
    const finalFilename = this.ensureExtension(filename, format);

    if (download) {
      this.downloadFile(content, finalFilename, finalMimeType);
    } else {
      // Store in memory or return the content
      return content;
    }
  }

  supports(config: any): boolean {
    return config && typeof config.filename === 'string';
  }

  private formatData(data: any, format: string): string {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return this.convertToCSV(data);
      
      case 'txt':
        return this.convertToText(data);
      
      case 'xml':
        return this.convertToXML(data);
      
      default:
        return String(data);
    }
  }

  private convertToCSV(data: any): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const firstItem = data[0];
      if (typeof firstItem === 'object' && firstItem !== null) {
        // Object array
        const headers = Object.keys(firstItem);
        const csvRows = [headers.join(',')];
        
        data.forEach(item => {
          const values = headers.map(header => {
            const value = item[header];
            // Escape commas and quotes
            const stringValue = String(value || '');
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          });
          csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
      } else {
        // Primitive array
        return data.join(',');
      }
    }
    
    if (typeof data === 'object' && data !== null) {
      // Single object
      const headers = Object.keys(data);
      const csvRows = [headers.join(',')];
      const values = headers.map(header => {
        const value = data[header];
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
      return csvRows.join('\n');
    }
    
    return String(data);
  }

  private convertToText(data: any): string {
    if (Array.isArray(data)) {
      return data.map(item => String(item)).join('\n');
    }
    
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data, null, 2);
    }
    
    return String(data);
  }

  private convertToXML(data: any): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    
    if (Array.isArray(data)) {
      const items = data.map(item => this.objectToXML(item, 'item')).join('\n');
      return `${xmlHeader}<root>\n${items}\n</root>`;
    }
    
    if (typeof data === 'object' && data !== null) {
      return `${xmlHeader}<root>\n${this.objectToXML(data, 'item')}\n</root>`;
    }
    
    return `${xmlHeader}<root>${String(data)}</root>`;
  }

  private objectToXML(obj: any, rootName: string): string {
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      const entries = Object.entries(obj);
      const xmlEntries = entries.map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `  <${key}>\n${this.objectToXML(value, key)}\n  </${key}>`;
        } else {
          return `  <${key}>${String(value)}</${key}>`;
        }
      });
      return xmlEntries.join('\n');
    }
    
    return `  <${rootName}>${String(obj)}</${rootName}>`;
  }

  private getMimeType(format: string): string {
    switch (format.toLowerCase()) {
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'txt':
        return 'text/plain';
      case 'xml':
        return 'application/xml';
      default:
        return 'text/plain';
    }
  }

  private ensureExtension(filename: string, format: string): string {
    const extension = this.getExtension(format);
    if (filename.endsWith(extension)) {
      return filename;
    }
    return `${filename}.${extension}`;
  }

  private getExtension(format: string): string {
    switch (format.toLowerCase()) {
      case 'json':
        return 'json';
      case 'csv':
        return 'csv';
      case 'txt':
        return 'txt';
      case 'xml':
        return 'xml';
      default:
        return 'txt';
    }
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }
}