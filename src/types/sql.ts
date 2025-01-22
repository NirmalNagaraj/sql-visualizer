export interface Column {
  name: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE';
}

export interface Table {
  name: string;
  columns: Column[];
  data: Record<string, any>[];
}

export interface DatabaseState {
  tables: Record<string, Table>;
}

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'OUTER';

export interface WhereCondition {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=';
  value: any;
}

export interface JoinCondition {
  type: JoinType;
  table1: string;
  table2: string;
  column1: string;
  column2: string;
}