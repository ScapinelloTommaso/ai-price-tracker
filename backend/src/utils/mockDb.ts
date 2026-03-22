import fs from 'fs';
import path from 'path';
import { Product, PriceHistory } from '../models/interfaces';

const DB_FILE = path.join(__dirname, '../../../mock-db.json');

export interface MockDbSchema {
  Products: Product[];
  PriceHistory: PriceHistory[];
}

export function getMockDb(): MockDbSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const defaultData: MockDbSchema = { Products: [], PriceHistory: [] };
      saveMockDb(defaultData);
      return defaultData;
    }
    const rawData = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error(`[Mock DB] Errore critico lettura DB locale (${DB_FILE}):`, error);
    return { Products: [], PriceHistory: [] };
  }
}

export function saveMockDb(data: MockDbSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Mock DB] Errore critico scrittura DB locale:', error);
  }
}
