import { IExtractor } from '../types';
import { parseCSV } from '../utils/csv-parser';

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

    return parseCSV(csvString, options);
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

}