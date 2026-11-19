import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv-parser.js';

describe('parseCsv', () => {
  it('should parse standard comma-separated CSV with headers', () => {
    const csv = `name,price,category,sku\nKopi Tubruk,12000,Minuman,SKU-001\nTeh Manis,8000,Minuman,SKU-002`;
    const result = parseCsv(csv);

    expect(result.headers).toEqual(['name', 'price', 'category', 'sku']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].data.name).toBe('Kopi Tubruk');
    expect(result.rows[0].data.price).toBe('12000');
    expect(result.rows[0].rowNumber).toBe(2);
    expect(result.rows[1].data.name).toBe('Teh Manis');
  });

  it('should handle quoted fields with commas and escaped quotes', () => {
    const csv = `name,description,price,category\n"Kopi, Mantap","Enak ""banget"" bro",15000,Minuman`;
    const result = parseCsv(csv);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].data.name).toBe('Kopi, Mantap');
    expect(result.rows[0].data.description).toBe('Enak "banget" bro');
    expect(result.rows[0].data.price).toBe('15000');
  });

  it('should handle semicolon-separated CSV', () => {
    const csv = `name;price;category\nRoti Bakar;15000;Makanan`;
    const result = parseCsv(csv);

    expect(result.headers).toEqual(['name', 'price', 'category']);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].data.name).toBe('Roti Bakar');
  });

  it('should return empty when content is blank', () => {
    const result = parseCsv('   \n  \n');
    expect(result.rows).toHaveLength(0);
    expect(result.headers).toHaveLength(0);
  });
});
