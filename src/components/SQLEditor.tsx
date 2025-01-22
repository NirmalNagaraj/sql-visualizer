import React, { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { Column, Table, WhereCondition, JoinType } from '../types/sql';

const SQLEditor: React.FC = () => {
  const [operation, setOperation] = useState<'CREATE' | 'INSERT' | 'SELECT' | 'DELETE' | 'UPDATE' | 'JOIN'>('CREATE');
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<Column[]>([]);
  const [insertValues, setInsertValues] = useState<Record<string, any>>({});
  const [updateValues, setUpdateValues] = useState<Record<string, any>>({});
  const [whereConditions, setWhereConditions] = useState<WhereCondition[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [joinConfig, setJoinConfig] = useState<{
    type: JoinType;
    table1: string;
    table2: string;
    column1: string;
    column2: string;
  }>({
    type: 'INNER',
    table1: '',
    table2: '',
    column1: '',
    column2: '',
  });
  const [result, setResult] = useState<any[]>([]);
  const [sqlQuery, setSqlQuery] = useState('');

  useEffect(() => {
    const state = loadFromStorage();
    setAvailableTables(Object.keys(state.tables));
  }, [operation, result]);

  const handleCreateTable = () => {
    if (!tableName.trim()) {
      alert('Please provide a table name');
      return;
    }
    if (columns.length === 0) {
      alert('Please add at least one column');
      return;
    }
    if (columns.some(col => !col.name.trim())) {
      alert('Please provide names for all columns');
      return;
    }

    const state = loadFromStorage();
    
    if (state.tables[tableName]) {
      alert(`Table "${tableName}" already exists`);
      return;
    }

    state.tables[tableName] = {
      name: tableName,
      columns: columns.map(col => ({
        name: col.name.trim(),
        type: col.type
      })),
      data: []
    };

    saveToStorage(state);

    const query = `CREATE TABLE ${tableName} (
  ${columns.map(col => `${col.name} ${col.type}`).join(',\n  ')}
);`;
    setSqlQuery(query);
    setResult([]);
    setAvailableTables(Object.keys(state.tables));
  };

  const handleInsert = () => {
    const state = loadFromStorage();
    const table = state.tables[tableName];
    if (table) {
      table.data.push(insertValues);
      saveToStorage(state);
      const query = `INSERT INTO ${tableName} (${Object.keys(insertValues).join(', ')})
VALUES (${Object.values(insertValues).map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')});`;
      setSqlQuery(query);
      setResult([insertValues]);
      setInsertValues({});
    }
  };

  const handleSelect = () => {
    const state = loadFromStorage();
    const table = state.tables[tableName];
    if (table) {
      let filteredData = [...table.data];
      
      if (whereConditions.length > 0) {
        filteredData = filteredData.filter(row => {
          return whereConditions.every(condition => {
            const value = row[condition.column];
            switch (condition.operator) {
              case '=': return value === condition.value;
              case '!=': return value !== condition.value;
              case '>': return value > condition.value;
              case '<': return value < condition.value;
              case '>=': return value >= condition.value;
              case '<=': return value <= condition.value;
              default: return true;
            }
          });
        });
      }
      
      const query = `SELECT ${selectedColumns.length > 0 ? selectedColumns.join(', ') : '*'} 
FROM ${tableName}${whereConditions.length > 0 
        ? `\nWHERE ${whereConditions.map(c => 
          `${c.column} ${c.operator} ${typeof c.value === 'string' ? `'${c.value}'` : c.value}`
        ).join(' AND ')}`
        : ''};`;
      setSqlQuery(query);
      setResult(filteredData);
    }
  };

  const handleDelete = () => {
    const state = loadFromStorage();
    const table = state.tables[tableName];
    if (table) {
      let newData = [...table.data];
      if (whereConditions.length > 0) {
        newData = newData.filter(row => {
          return !whereConditions.every(condition => {
            const value = row[condition.column];
            switch (condition.operator) {
              case '=': return value === condition.value;
              case '!=': return value !== condition.value;
              case '>': return value > condition.value;
              case '<': return value < condition.value;
              case '>=': return value >= condition.value;
              case '<=': return value <= condition.value;
              default: return true;
            }
          });
        });
      }
      table.data = newData;
      saveToStorage(state);
      const query = `DELETE FROM ${tableName}${whereConditions.length > 0 
        ? `\nWHERE ${whereConditions.map(c => 
          `${c.column} ${c.operator} ${typeof c.value === 'string' ? `'${c.value}'` : c.value}`
        ).join(' AND ')}`
        : ''};`;
      setSqlQuery(query);
      setResult([]);
    }
  };

  const handleUpdate = () => {
    const state = loadFromStorage();
    const table = state.tables[tableName];
    if (table) {
      let updatedData = table.data.map(row => {
        if (whereConditions.length === 0 || whereConditions.every(condition => {
          const value = row[condition.column];
          switch (condition.operator) {
            case '=': return value === condition.value;
            case '!=': return value !== condition.value;
            case '>': return value > condition.value;
            case '<': return value < condition.value;
            case '>=': return value >= condition.value;
            case '<=': return value <= condition.value;
            default: return true;
          }
        })) {
          return { ...row, ...updateValues };
        }
        return row;
      });
      table.data = updatedData;
      saveToStorage(state);
      const query = `UPDATE ${tableName}
SET ${Object.entries(updateValues).map(([key, value]) => 
        `${key} = ${typeof value === 'string' ? `'${value}'` : value}`
      ).join(', ')}${whereConditions.length > 0 
        ? `\nWHERE ${whereConditions.map(c => 
          `${c.column} ${c.operator} ${typeof c.value === 'string' ? `'${c.value}'` : c.value}`
        ).join(' AND ')}`
        : ''};`;
      setSqlQuery(query);
      setResult(updatedData);
    }
  };

  const handleJoin = () => {
    const state = loadFromStorage();
    const table1 = state.tables[joinConfig.table1];
    const table2 = state.tables[joinConfig.table2];
    
    if (table1 && table2) {
      let joinedData: any[] = [];
      
      switch (joinConfig.type) {
        case 'INNER':
          joinedData = table1.data.flatMap(t1 => 
            table2.data
              .filter(t2 => t1[joinConfig.column1] === t2[joinConfig.column2])
              .map(t2 => ({ ...t1, ...t2 }))
          );
          break;
        case 'LEFT':
          joinedData = table1.data.map(t1 => {
            const match = table2.data.find(t2 => t1[joinConfig.column1] === t2[joinConfig.column2]);
            return match ? { ...t1, ...match } : { ...t1 };
          });
          break;
        case 'RIGHT':
          joinedData = table2.data.map(t2 => {
            const match = table1.data.find(t1 => t1[joinConfig.column1] === t2[joinConfig.column2]);
            return match ? { ...match, ...t2 } : { ...t2 };
          });
          break;
        case 'FULL':
          const leftJoin = table1.data.map(t1 => {
            const match = table2.data.find(t2 => t1[joinConfig.column1] === t2[joinConfig.column2]);
            return match ? { ...t1, ...match } : { ...t1 };
          });
          const rightOnly = table2.data.filter(t2 => 
            !table1.data.some(t1 => t1[joinConfig.column1] === t2[joinConfig.column2])
          );
          joinedData = [...leftJoin, ...rightOnly];
          break;
      }
      
      const query = `SELECT *
FROM ${joinConfig.table1}
${joinConfig.type} JOIN ${joinConfig.table2}
ON ${joinConfig.table1}.${joinConfig.column1} = ${joinConfig.table2}.${joinConfig.column2};`;
      setSqlQuery(query);
      setResult(joinedData);
    }
  };

  const copyQuery = async () => {
    try {
      await navigator.clipboard.writeText(sqlQuery);
    } catch (err) {
      console.error('Failed to copy query:', err);
    }
  };

  const getTableColumns = (tableName: string) => {
    const state = loadFromStorage();
    const table = state.tables[tableName];
    return table ? table.columns.map(col => col.name) : [];
  };

  const renderOperationForm = () => {
    switch (operation) {
      case 'CREATE':
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Table Name"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <div className="space-y-2">
              {columns.map((col, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Column Name"
                    value={col.name}
                    onChange={(e) => {
                      const newColumns = [...columns];
                      newColumns[idx].name = e.target.value;
                      setColumns(newColumns);
                    }}
                    className="flex-1 p-2 border rounded"
                  />
                  <select
                    value={col.type}
                    onChange={(e) => {
                      const newColumns = [...columns];
                      newColumns[idx].type = e.target.value as any;
                      setColumns(newColumns);
                    }}
                    className="p-2 border rounded"
                  >
                    <option value="TEXT">TEXT</option>
                    <option value="NUMBER">NUMBER</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="DATE">DATE</option>
                  </select>
                  <button
                    onClick={() => setColumns(columns.filter((_, i) => i !== idx))}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => setColumns([...columns, { name: '', type: 'TEXT' }])}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Column
              </button>
            </div>
          </div>
        );

      case 'INSERT':
        return (
          <div className="space-y-4">
            <select
              value={tableName}
              onChange={(e) => {
                setTableName(e.target.value);
                setInsertValues({});
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Table</option>
              {availableTables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
            {tableName && getTableColumns(tableName).map(colName => (
              <div key={colName} className="flex gap-2">
                <label className="w-1/4">{colName}:</label>
                <input
                  type="text"
                  value={insertValues[colName] || ''}
                  onChange={(e) => setInsertValues({ ...insertValues, [colName]: e.target.value })}
                  className="flex-1 p-2 border rounded"
                />
              </div>
            ))}
          </div>
        );

      case 'SELECT':
        return (
          <div className="space-y-4">
            <select
              value={tableName}
              onChange={(e) => {
                setTableName(e.target.value);
                setSelectedColumns([]);
                setWhereConditions([]);
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Table</option>
              {availableTables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
            {tableName && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Select Columns</h3>
                  <div className="flex flex-wrap gap-2">
                    {getTableColumns(tableName).map(colName => (
                      <label key={colName} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(colName)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColumns([...selectedColumns, colName]);
                            } else {
                              setSelectedColumns(selectedColumns.filter(col => col !== colName));
                            }
                          }}
                        />
                        {colName}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Where Conditions</h3>
                  {whereConditions.map((condition, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <select
                        value={condition.column}
                        onChange={(e) => {
                          const newConditions = [...whereConditions];
                          newConditions[idx].column = e.target.value;
                          setWhereConditions(newConditions);
                        }}
                        className="p-2 border rounded"
                      >
                        <option value="">Select Column</option>
                        {getTableColumns(tableName).map(colName => (
                          <option key={colName} value={colName}>{colName}</option>
                        ))}
                      </select>
                      <select
                        value={condition.operator}
                        onChange={(e) => {
                          const newConditions = [...whereConditions];
                          newConditions[idx].operator = e.target.value as any;
                          setWhereConditions(newConditions);
                        }}
                        className="p-2 border rounded"
                      >
                        <option value="=">=</option>
                        <option value="!=">!=</option>
                        <option value=">">{'>'}</option>
                        <option value="<">{'<'}</option>
                        <option value=">=">{'>='}</option>
                        <option value="<=">{'<='}</option>
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => {
                          const newConditions = [...whereConditions];
                          newConditions[idx].value = e.target.value;
                          setWhereConditions(newConditions);
                        }}
                        className="flex-1 p-2 border rounded"
                        placeholder="Value"
                      />
                      <button
                        onClick={() => setWhereConditions(whereConditions.filter((_, i) => i !== idx))}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setWhereConditions([...whereConditions, { column: '', operator: '=', value: '' }])}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add Condition
                  </button>
                </div>
              </>
            )}
          </div>
        );

      case 'DELETE':
        return (
          <div className="space-y-4">
            <select
              value={tableName}
              onChange={(e) => {
                setTableName(e.target.value);
                setWhereConditions([]);
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Table</option>
              {availableTables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
            {tableName && (
              <div>
                <h3 className="font-semibold mb-2">Where Conditions</h3>
                {whereConditions.map((condition, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select
                      value={condition.column}
                      onChange={(e) => {
                        const newConditions = [...whereConditions];
                        newConditions[idx].column = e.target.value;
                        setWhereConditions(newConditions);
                      }}
                      className="p-2 border rounded"
                    >
                      <option value="">Select Column</option>
                      {getTableColumns(tableName).map(colName => (
                        <option key={colName} value={colName}>{colName}</option>
                      ))}
                    </select>
                    <select
                      value={condition.operator}
                      onChange={(e) => {
                        const newConditions = [...whereConditions];
                        newConditions[idx].operator = e.target.value as any;
                        setWhereConditions(newConditions);
                      }}
                      className="p-2 border rounded"
                    >
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value=">">{'>'}</option>
                      <option value="<">{'<'}</option>
                      <option value=">=">{'>='}</option>
                      <option value="<=">{'<='}</option>
                    </select>
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => {
                        const newConditions = [...whereConditions];
                        newConditions[idx].value = e.target.value;
                        setWhereConditions(newConditions);
                      }}
                      className="flex-1 p-2 border rounded"
                      placeholder="Value"
                    />
                    <button
                      onClick={() => setWhereConditions(whereConditions.filter((_, i) => i !== idx))}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setWhereConditions([...whereConditions, { column: '', operator: '=', value: '' }])}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add Condition
                </button>
              </div>
            )}
          </div>
        );

      case 'UPDATE':
        return (
          <div className="space-y-4">
            <select
              value={tableName}
              onChange={(e) => {
                setTableName(e.target.value);
                setUpdateValues({});
                setWhereConditions([]);
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Table</option>
              {availableTables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
            {tableName && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Set Values</h3>
                  {getTableColumns(tableName).map(colName => (
                    <div key={colName} className="flex gap-2 mb-2">
                      <label className="w-1/4">{colName}:</label>
                      <input
                        type="text"
                        value={updateValues[colName] || ''}
                        onChange={(e) => setUpdateValues({ ...updateValues, [colName]: e.target.value })}
                        className="flex-1 p-2 border rounded"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Where Conditions</h3>
                  {whereConditions.map((condition, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <select
                        value={condition.column}
                        onChange={(e) => {
                          const newConditions = [...whereConditions];
                          newConditions[idx].column = e.target.value;
                          setWhereConditions(newConditions);
                        }}
                        className="p-2 border rounded"
                      >
                        <option value="">Select Column</option>
                        {getTableColumns(tableName).map(colName => (
                          <option key={colName} value={colName}>{colName}</option>
                        ))}
                      </select>
                      <select
                        value={condition.operator}
                        onChange={(e) => {
                          const newConditions = [...whereConditions];
                          newConditions[idx].operator = e.target.value as any;
                          setWhereConditions(newConditions);
                        }}
                        className="p-2 border rounded"
                      >
                        <option value="=">=</option>
                        <option value="!=">!=</option>
                        <option value=">">{'>'}</option>
                        <option value="<">{'<'}</option>
                        <option value=">=">{'>='}</option>
                        <option value="<=">{'<='}</option>
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => {
                          const newConditions = [...whereConditions];
                          newConditions[idx].value = e.target.value;
                          setWhereConditions(newConditions);
                        }}
                        className="flex-1 p-2 border rounded"
                        placeholder="Value"
                      />
                      <button
                        onClick={() => setWhereConditions(whereConditions.filter((_, i) => i !== idx))}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setWhereConditions([...whereConditions, { column: '', operator: '=', value: '' }])}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add Condition
                  </button>
                </div>
              </>
            )}
          </div>
        );

      case 'JOIN':
        return (
          <div className="space-y-4">
            <select
              value={joinConfig.type}
              onChange={(e) => setJoinConfig({ ...joinConfig, type: e.target.value as JoinType })}
              className="w-full p-2 border rounded"
            >
              <option value="INNER">INNER JOIN</option>
              <option value="LEFT">LEFT JOIN</option>
              <option value="RIGHT">RIGHT JOIN</option>
              <option value="FULL">FULL JOIN</option>
            </select>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <select
                  value={joinConfig.table1}
                  onChange={(e) => setJoinConfig({ ...joinConfig, table1: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select First Table</option>
                  {availableTables.map(table => (
                    <option key={table} value={table}>{table}</option>
                  ))}
                </select>
                {joinConfig.table1 && (
                  <select
                    value={joinConfig.column1}
                    onChange={(e) => setJoinConfig({ ...joinConfig, column1: e.target.value })}
                    className="w-full p-2 border rounded mt-2"
                  >
                    <option value="">Select Column</option>
                    {getTableColumns(joinConfig.table1).map(colName => (
                      <option key={colName} value={colName}>{colName}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <select
                  value={joinConfig.table2}
                  onChange={(e) => setJoinConfig({ ...joinConfig, table2: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Second Table</option>
                  {availableTables.map(table => (
                    <option key={table} value={table}>{table}</option>
                  ))}
                </select>
                {joinConfig.table2 && (
                  <select
                    value={joinConfig.column2}
                    onChange={(e) => setJoinConfig({ ...joinConfig, column2: e.target.value })}
                    className="w-full p-2 border rounded mt-2"
                  >
                    <option value="">Select Column</option>
                    {getTableColumns(joinConfig.table2).map(colName => (
                      <option key={colName} value={colName}>{colName}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">SQL Learning Platform</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 mb-4">
            {['CREATE', 'INSERT', 'SELECT', 'DELETE', 'UPDATE', 'JOIN'].map(op => (
              <button
                key={op}
                onClick={() => {
                  setOperation(op as any);
                  setTableName('');
                  setColumns([]);
                  setInsertValues({});
                  setUpdateValues({});
                  setWhereConditions([]);
                  setSelectedColumns([]);
                  setJoinConfig({
                    type: 'INNER',
                    table1: '',
                    table2: '',
                    column1: '',
                    column2: '',
                  });
                }}
                className={`px-4 py-2 rounded ${
                  operation === op 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {op}
              </button>
            ))}
          </div>

          {renderOperationForm()}

          <div className="mt-4">
            <button
              onClick={() => {
                switch (operation) {
                  case 'CREATE':
                    handleCreateTable();
                    break;
                  case 'INSERT':
                    handleInsert();
                    break;
                  case 'SELECT':
                    handleSelect();
                    break;
                  case 'DELETE':
                    handleDelete();
                    break;
                  case 'UPDATE':
                    handleUpdate();
                    break;
                  case 'JOIN':
                    handleJoin();
                    break;
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Execute
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Generated SQL Query</h2>
            <button
              onClick={copyQuery}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              <Copy size={16} /> Copy
            </button>
          </div>
          <pre className="bg-gray-100 p-4 rounded mb-6 overflow-x-auto">
            {sqlQuery}
          </pre>

          <h2 className="text-xl font-semibold mb-4">Result</h2>
          {result.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(result[0]).map(key => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((value: any, valueIdx) => (
                        <td key={valueIdx} className="px-6 py-4 whitespace-nowrap">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table> </div>
          ) : (
            <p className="text-gray-500">No results to display</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SQLEditor;