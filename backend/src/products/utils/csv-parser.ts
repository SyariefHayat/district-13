export interface ParsedCsvResult {
  headers: string[];
  rows: Array<{ rowNumber: number; data: Record<string, string> }>;
}

/**
 * Parses a CSV string respecting RFC 4180 rules (quotes, escaped quotes, commas, newlines).
 */
export function parseCsv(csvText: string, maxLines = 5000): ParsedCsvResult {
  if (!csvText || !csvText.trim()) {
    return { headers: [], rows: [] };
  }

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: ""
          currentField += '"';
          i += 2;
          continue;
        } else {
          // End of quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',' || char === ';') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField);
        lines.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
        if (lines.length > maxLines + 1) break;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        lines.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
        if (lines.length > maxLines + 1) break;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push last field and row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    lines.push(currentRow);
  }

  // Filter out empty rows
  const nonEmptyLines = lines.filter((row) =>
    row.some((field) => field.trim().length > 0),
  );

  if (nonEmptyLines.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = nonEmptyLines[0];
  const headers = rawHeaders.map((h) => h.trim());

  const rows: Array<{ rowNumber: number; data: Record<string, string> }> = [];

  for (let r = 1; r < nonEmptyLines.length; r++) {
    if (r > maxLines) break;
    const rowValues = nonEmptyLines[r];
    const data: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const headerKey = headers[c];
      if (headerKey) {
        data[headerKey] = (rowValues[c] ?? '').trim();
      }
    }
    rows.push({ rowNumber: r + 1, data });
  }

  return { headers, rows };
}
