import { DatabaseState, Table } from '../types/sql';

export const saveToStorage = (state: DatabaseState) => {
  sessionStorage.setItem('sqlSimulator', JSON.stringify(state));
};

export const loadFromStorage = (): DatabaseState => {
  const stored = sessionStorage.getItem('sqlSimulator');
  return stored ? JSON.parse(stored) : { tables: {} };
};

export const getTable = (tableName: string): Table | null => {
  const state = loadFromStorage();
  return state.tables[tableName] || null;
};