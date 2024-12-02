import { saveTablesInStorage } from './storage';

export const executeQuery = (query: any, tables: any[]) => {
  let result: any[] = [];
  let updatedTables = [...tables];
  
  switch (query.type.toUpperCase()) {
    case 'SELECT':
      // Get the main table data
      const mainTable = tables.find((t) => t.name === query.tables[0]);
      if (!mainTable) return [];
      
      result = mainTable.data.map((row) => ({ 
        ...row,
        // Add table prefix to column names
        ...Object.fromEntries(
          Object.entries(row).map(([key, value]) => [`${mainTable.name}.${key}`, value])
        )
      }));

      // Apply joins
      query.joins.forEach((join: any) => {
        const joinTable = tables.find((t) => t.name === join.table);
        if (!joinTable || !join.on.leftColumn || !join.on.rightColumn) return;

        const leftKey = `${join.on.leftTable || query.tables[0]}.${join.on.leftColumn}`;
        const rightKey = `${join.table}.${join.on.rightColumn}`;

        switch (join.type) {
          case 'INNER':
            result = result.filter(row => {
              const leftValue = row[`${query.tables[0]}.${join.on.leftColumn}`];
              return joinTable.data.some(jr => leftValue === jr[join.on.rightColumn]);
            }).map(row => {
              const leftValue = row[`${query.tables[0]}.${join.on.leftColumn}`];
              const joinedRow = joinTable.data.find(jr => leftValue === jr[join.on.rightColumn]);
              return joinedRow ? {
                ...row,
                ...Object.fromEntries(
                  Object.entries(joinedRow).map(([key, value]) => [`${join.table}.${key}`, value])
                )
              } : row;
            });
            break;

          case 'LEFT':
            result = result.map(row => {
              const leftValue = row[`${query.tables[0]}.${join.on.leftColumn}`];
              const joinedRow = joinTable.data.find(jr => leftValue === jr[join.on.rightColumn]);
              return {
                ...row,
                ...(joinedRow ? Object.fromEntries(
                  Object.entries(joinedRow).map(([key, value]) => [`${join.table}.${key}`, value])
                ) : Object.fromEntries(
                  joinTable.columns.map(col => [`${join.table}.${col}`, null])
                ))
              };
            });
            break;

          case 'RIGHT':
            const rightResult = joinTable.data.map(jr => ({
              ...Object.fromEntries(
                Object.entries(jr).map(([key, value]) => [`${join.table}.${key}`, value])
              )
            }));

            result = rightResult.map(rightRow => {
              const rightValue = rightRow[`${join.table}.${join.on.rightColumn}`];
              const leftRow = result.find(r => 
                r[`${query.tables[0]}.${join.on.leftColumn}`] === rightValue
              );
              return {
                ...(leftRow || Object.fromEntries(
                  mainTable.columns.map(col => [`${mainTable.name}.${col}`, null])
                )),
                ...rightRow
              };
            });
            break;

          case 'FULL':
            const leftJoin = result.map(row => {
              const leftValue = row[`${query.tables[0]}.${join.on.leftColumn}`];
              const joinedRow = joinTable.data.find(jr => leftValue === jr[join.on.rightColumn]);
              return {
                ...row,
                ...(joinedRow ? Object.fromEntries(
                  Object.entries(joinedRow).map(([key, value]) => [`${join.table}.${key}`, value])
                ) : Object.fromEntries(
                  joinTable.columns.map(col => [`${join.table}.${col}`, null])
                ))
              };
            });

            const rightOnly = joinTable.data.filter(jr =>
              !result.some(row => 
                row[`${query.tables[0]}.${join.on.leftColumn}`] === jr[join.on.rightColumn]
              )
            ).map(jr => ({
              ...Object.fromEntries(
                mainTable.columns.map(col => [`${mainTable.name}.${col}`, null])
              ),
              ...Object.fromEntries(
                Object.entries(jr).map(([key, value]) => [`${join.table}.${key}`, value])
              )
            }));

            result = [...leftJoin, ...rightOnly];
            break;

          case 'CROSS':
            const crossResult: any[] = [];
            result.forEach(row => {
              joinTable.data.forEach(jr => {
                crossResult.push({
                  ...row,
                  ...Object.fromEntries(
                    Object.entries(jr).map(([key, value]) => [`${join.table}.${key}`, value])
                  )
                });
              });
            });
            result = crossResult;
            break;
        }
      });

      // Apply conditions
      query.conditions.forEach((condition: any) => {
        result = result.filter((row) => {
          const [tableName, columnName] = condition.column.split('.');
          const value = row[`${tableName}.${columnName}`];
          
          switch (condition.operator) {
            case '=':
              return value == condition.value;
            case '!=':
              return value != condition.value;
            case '>':
              return value > condition.value;
            case '<':
              return value < condition.value;
            case '>=':
              return value >= condition.value;
            case '<=':
              return value <= condition.value;
            case 'LIKE':
              return String(value).includes(condition.value);
            default:
              return true;
          }
        });
      });

      // Select specific columns if not *
      if (query.columns[0] !== '*') {
        result = result.map((row) => {
          const newRow: any = {};
          query.columns.forEach((col: string) => {
            newRow[col] = row[col];
          });
          return newRow;
        });
      }
      break;

    case 'INSERT':
      const targetTable = tables.find(t => t.name === query.tables[0]);
      if (targetTable) {
        // Generate new ID based on existing data
        const maxId = Math.max(...targetTable.data.map(row => row.id || 0), 0);
        const newId = maxId + 1;

        // Create new row with proper type conversion
        const newRow = Object.fromEntries(
          targetTable.columns.map((col, index) => {
            const value = query.values[index];
            if (value === '') return [col, null];
            if (col === 'id') return [col, newId];
            if (!isNaN(value) && value !== '') return [col, Number(value)];
            return [col, value];
          })
        );
        
        const tableIndex = updatedTables.findIndex(t => t.name === query.tables[0]);
        updatedTables[tableIndex] = {
          ...targetTable,
          data: [...targetTable.data, newRow]
        };
        
        saveTablesInStorage(updatedTables);
        result = [newRow];
      }
      break;

    case 'DELETE':
      const tableToDelete = tables.find(t => t.name === query.tables[0]);
      if (tableToDelete) {
        let filteredData = [...tableToDelete.data];
        
        // Apply conditions
        query.conditions.forEach((condition: any) => {
          const [tableName, columnName] = condition.column.split('.');
          filteredData = filteredData.filter(row => {
            const value = row[columnName];
            switch (condition.operator) {
              case '=':
                return value != condition.value;
              case '!=':
                return value == condition.value;
              case '>':
                return value <= condition.value;
              case '<':
                return value >= condition.value;
              case '>=':
                return value < condition.value;
              case '<=':
                return value > condition.value;
              case 'LIKE':
                return !String(value).includes(condition.value);
              default:
                return true;
            }
          });
        });
        
        const tableIndex = updatedTables.findIndex(t => t.name === query.tables[0]);
        updatedTables[tableIndex] = {
          ...tableToDelete,
          data: filteredData
        };
        
        saveTablesInStorage(updatedTables);
        result = filteredData;
      }
      break;
  }

  return result;
};