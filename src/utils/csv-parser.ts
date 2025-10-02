/**
 * CSV Parser utility for Browser ETL
 */

export interface CSVParserOptions {
  header?: boolean;
  delimiter?: string;
  skipEmptyLines?: boolean;
  transform?: (row: any) => any;
}

/**
 * Parse CSV string into array of objects or arrays
 */
export function parseCSV(csvString: string, options: CSVParserOptions = {}): any[] {
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

    const values = parseCSVLine(line, delimiter);

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

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
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