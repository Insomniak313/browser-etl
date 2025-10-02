import { IExtractor } from '../types';

export interface FileExtractorConfig {
  file: File;
  type?: 'text' | 'json' | 'csv' | 'binary';
  encoding?: string;
}

/**
 * File Extractor - extracts data from uploaded files
 */
export class FileExtractor implements IExtractor {
  readonly name = 'file';

  async extract(config: FileExtractorConfig): Promise<any> {
    const { file, type = 'text', encoding = 'utf-8' } = config;

    if (!file) {
      throw new Error('File is required for file extraction');
    }

    switch (type) {
      case 'text':
        return await this.readAsText(file, encoding);
      case 'json':
        return await this.readAsJSON(file, encoding);
      case 'csv':
        return await this.readAsCSV(file, encoding);
      case 'binary':
        return await this.readAsBinary(file);
      default:
        throw new Error(`Unsupported file type: ${type}`);
    }
  }

  supports(config: any): boolean {
    return config && config.file instanceof File;
  }

  private async readAsText(file: File, encoding: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file as text'));
      reader.readAsText(file, encoding);
    });
  }

  private async readAsJSON(file: File, encoding: string): Promise<any> {
    const text = await this.readAsText(file, encoding);
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error('Failed to parse file as JSON');
    }
  }

  private async readAsCSV(file: File, encoding: string): Promise<any[]> {
    const text = await this.readAsText(file, encoding);
    return this.parseCSV(text);
  }

  private async readAsBinary(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file as binary'));
      reader.readAsArrayBuffer(file);
    });
  }

  private parseCSV(csvString: string): any[] {
    const lines = csvString.split('\n');
    const rows: any[] = [];

    for (const line of lines) {
      if (line.trim()) {
        const values = line.split(',').map(v => v.trim());
        rows.push(values);
      }
    }

    return rows;
  }
}