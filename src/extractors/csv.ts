import { IExtractor } from '../types';

export interface CsvExtractorConfig {
  data: string | File;
  options?: {
    header?: boolean;
    delimiter?: string;
    skipEmptyLines?: boolean;
    transform?: (row: any) => any;
  };
}

/**
 * CSV Extractor - extracts data from CSV strings or files
 */
export class CsvExtractor implements IExtractor {
  readonly name = 'csv';

  async extract(config: CsvExtractorConfig): Promise<any> {
    const { data, options = {} } = config;

    if (!data) {
      throw new Error('Data is required for CSV extraction');
    }

    let csvString: string;

    if (data instanceof File) {
      csvString = await this.readFile(data);
    } else {
      csvString = data;
    }

    return this.parseCSV(csvString, options);
  }

  supports(config: any): boolean {
    return config && (typeof config.data === 'string' || config.data instanceof File);
  }

  private async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private parseCSV(csvString: string, options: {
    header?: boolean;
    delimiter?: string;
    skipEmptyLines?: boolean;
    transform?: (row: any) => any;
  }): any[] {
    const {
      header = true,
      delimiter = ',',
      skipEmptyLines = true,
      transform
    } = options;

    const lines = csvString.split('\n');
    const rows: any[] = [];

    let headers: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (skipEmptyLines && !line) {
        continue;
      }

      const values = this.parseCSVLine(line, delimiter);

      if (i === 0 && header) {
        headers = values;
        continue;
      }

      let row: any;

      if (header && headers.length > 0) {
        row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
      } else {
        row = values;
      }

      if (transform) {
        row = transform(row);
      }

      rows.push(row);
    }

    return rows;
  }

  private parseCSVLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
          continue;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }

      i++;
    }

    values.push(current);
    return values;
  }
}