export const generateSQLSyntax = (query: any) => {
  let sql = '';

  switch (query.type.toUpperCase()) {
    case 'SELECT':
      // Format SELECT clause
      const columns = query.columns[0] === '*' 
        ? '*' 
        : query.columns.join(', ');
      
      sql = `SELECT ${columns}\nFROM ${query.tables[0]}`;
      
      // Add JOINS with proper ON clause
      query.joins.forEach((join: any) => {
        if (join.table && join.on.leftColumn && join.on.rightColumn) {
          const leftTable = join.on.leftTable || query.tables[0];
          sql += `\n${join.type} JOIN ${join.table}`;
          sql += ` ON ${leftTable}.${join.on.leftColumn} = ${join.table}.${join.on.rightColumn}`;
        }
      });

      // Add WHERE conditions
      if (query.conditions.length > 0) {
        const validConditions = query.conditions.filter((c: any) => c.column && c.operator && c.value);
        if (validConditions.length > 0) {
          sql += '\nWHERE ' + validConditions
            .map((c: any) => {
              const value = isNaN(c.value) ? `'${c.value}'` : c.value;
              return `${c.column} ${c.operator} ${value}`;
            })
            .join('\n  AND ');
        }
      }
      break;

    case 'INSERT':
      sql = `INSERT INTO ${query.tables[0]}`;
      if (query.columns && query.columns.length > 0) {
        sql += ` (${query.columns.join(', ')})`;
        if (query.values && query.values.length > 0) {
          sql += `\nVALUES (${query.values.map((v: any) => isNaN(v) ? `'${v}'` : v).join(', ')})`;
        }
      }
      break;

    case 'UPDATE':
      sql = `UPDATE ${query.tables[0]}`;
      if (query.set && Object.keys(query.set).length > 0) {
        sql += '\nSET ' + Object.entries(query.set)
          .map(([col, val]) => `${col} = ${isNaN(val) ? `'${val}'` : val}`)
          .join(',\n    ');
      }
      if (query.conditions.length > 0) {
        const validConditions = query.conditions.filter((c: any) => c.column && c.operator && c.value);
        if (validConditions.length > 0) {
          sql += '\nWHERE ' + validConditions
            .map((c: any) => {
              const value = isNaN(c.value) ? `'${c.value}'` : c.value;
              return `${c.column} ${c.operator} ${value}`;
            })
            .join('\n  AND ');
        }
      }
      break;

    case 'DELETE':
      sql = `DELETE FROM ${query.tables[0]}`;
      if (query.conditions.length > 0) {
        const validConditions = query.conditions.filter((c: any) => c.column && c.operator && c.value);
        if (validConditions.length > 0) {
          sql += '\nWHERE ' + validConditions
            .map((c: any) => {
              const value = isNaN(c.value) ? `'${c.value}'` : c.value;
              return `${c.column} ${c.operator} ${value}`;
            })
            .join('\n  AND ');
        }
      }
      break;
  }

  return sql + ';';
};