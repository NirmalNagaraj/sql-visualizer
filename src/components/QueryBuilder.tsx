import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const QueryBuilder = ({ tables, activeQuery, setActiveQuery, onApply, setTables }) => {
  const handleTableSelect = (tableName) => {
    if (!activeQuery.tables.includes(tableName)) {
      const selectedTable = tables.find(t => t.name === tableName);
      setActiveQuery({
        ...activeQuery,
        tables: [...activeQuery.tables, tableName],
        columns: activeQuery.type === 'INSERT' ? selectedTable.columns : activeQuery.columns,
        values: activeQuery.type === 'INSERT' ? Array(selectedTable.columns.length).fill('') : activeQuery.values,
      });
    }
  };

  const handleInsertValueChange = (index, value) => {
    const newValues = [...activeQuery.values];
    newValues[index] = value;
    setActiveQuery({
      ...activeQuery,
      values: newValues,
    });
  };

  const addCondition = () => {
    setActiveQuery({
      ...activeQuery,
      conditions: [...activeQuery.conditions, { column: '', operator: '=', value: '' }],
    });
  };

  const removeCondition = (index) => {
    setActiveQuery({
      ...activeQuery,
      conditions: activeQuery.conditions.filter((_, i) => i !== index),
    });
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...activeQuery.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setActiveQuery({
      ...activeQuery,
      conditions: newConditions,
    });
  };

  const addJoin = () => {
    setActiveQuery({
      ...activeQuery,
      joins: [...activeQuery.joins, { 
        table: '', 
        type: 'INNER', 
        on: { leftTable: '', leftColumn: '', rightTable: '', rightColumn: '' } 
      }],
    });
  };

  const removeJoin = (index) => {
    setActiveQuery({
      ...activeQuery,
      joins: activeQuery.joins.filter((_, i) => i !== index),
    });
  };

  const updateJoin = (index, field, value) => {
    const newJoins = [...activeQuery.joins];
    if (field.includes('.')) {
      const [onField, subField] = field.split('.');
      newJoins[index] = {
        ...newJoins[index],
        on: {
          ...newJoins[index].on,
          [subField]: value
        }
      };
    } else {
      newJoins[index] = { ...newJoins[index], [field]: value };
    }
    setActiveQuery({
      ...activeQuery,
      joins: newJoins,
    });
  };

  const getTableColumns = (tableName) => {
    const table = tables.find(t => t.name === tableName);
    return table ? table.columns : [];
  };

  return (
    <div className="space-y-6">
      {/* Query Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Query Type</label>
        <select
          className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={activeQuery.type}
          onChange={(e) => {
            const selectedTable = tables.find(t => t.name === activeQuery.tables[0]);
            setActiveQuery({ 
              ...activeQuery, 
              type: e.target.value,
              columns: e.target.value === 'INSERT' && selectedTable ? selectedTable.columns : ['*'],
              values: e.target.value === 'INSERT' && selectedTable ? Array(selectedTable.columns.length).fill('') : [],
            });
          }}
        >
          <option value="select">SELECT</option>
          <option value="insert">INSERT</option>
          <option value="update">UPDATE</option>
          <option value="delete">DELETE</option>
        </select>
      </div>

      {/* Tables */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tables</label>
        <div className="flex flex-wrap gap-2">
          {tables.map((table) => (
            <button
              key={table.name}
              onClick={() => handleTableSelect(table.name)}
              className={`px-3 py-1 rounded-full text-sm ${
                activeQuery.tables.includes(table.name)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {table.name}
            </button>
          ))}
        </div>
      </div>

      {/* Insert Values */}
      {activeQuery.type === 'INSERT' && activeQuery.tables.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Insert Values</label>
          <div className="space-y-2">
            {getTableColumns(activeQuery.tables[0]).map((column, index) => (
              <div key={column} className="flex items-center space-x-2">
                <span className="w-1/3">{column}:</span>
                <input
                  type="text"
                  value={activeQuery.values[index] || ''}
                  onChange={(e) => handleInsertValueChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter value"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Columns for SELECT */}
      {activeQuery.type === 'SELECT' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Columns</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveQuery({ ...activeQuery, columns: ['*'] })}
              className={`px-3 py-1 rounded-full text-sm ${
                activeQuery.columns[0] === '*'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              *
            </button>
            {tables
              .filter((table) => activeQuery.tables.includes(table.name))
              .map((table) =>
                table.columns.map((column) => (
                  <button
                    key={`${table.name}-${column}`}
                    onClick={() => {
                      if (activeQuery.columns[0] === '*') {
                        setActiveQuery({
                          ...activeQuery,
                          columns: [`${table.name}.${column}`],
                        });
                      } else if (!activeQuery.columns.includes(`${table.name}.${column}`)) {
                        setActiveQuery({
                          ...activeQuery,
                          columns: [...activeQuery.columns, `${table.name}.${column}`],
                        });
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeQuery.columns.includes(`${table.name}.${column}`)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {table.name}.{column}
                  </button>
                ))
              )}
          </div>
        </div>
      )}

      {/* Joins */}
      {activeQuery.type === 'SELECT' && activeQuery.tables.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Joins</label>
            <button
              onClick={addJoin}
              className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Join</span>
            </button>
          </div>
          {activeQuery.joins.map((join, index) => (
            <div key={index} className="p-4 mb-2 border border-gray-200 rounded-lg">
              <div className="flex justify-between mb-2">
                <select
                  value={join.type}
                  onChange={(e) => updateJoin(index, 'type', e.target.value)}
                  className="px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="INNER">INNER JOIN</option>
                  <option value="LEFT">LEFT JOIN</option>
                  <option value="RIGHT">RIGHT JOIN</option>
                  <option value="FULL">FULL JOIN</option>
                  <option value="CROSS">CROSS JOIN</option>
                </select>
                <button
                  onClick={() => removeJoin(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={join.table}
                  onChange={(e) => updateJoin(index, 'table', e.target.value)}
                  className="px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select table</option>
                  {tables
                    .filter((table) => !activeQuery.tables.includes(table.name))
                    .map((table) => (
                      <option key={table.name} value={table.name}>
                        {table.name}
                      </option>
                    ))}
                </select>

                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <select
                    value={join.on.leftColumn}
                    onChange={(e) => {
                      updateJoin(index, 'on.leftColumn', e.target.value);
                      updateJoin(index, 'on.leftTable', activeQuery.tables[0]);
                    }}
                    className="px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">ON (Left Column)</option>
                    {getTableColumns(activeQuery.tables[0]).map(column => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                  <select
                    value={join.on.rightColumn}
                    onChange={(e) => {
                      updateJoin(index, 'on.rightColumn', e.target.value);
                      updateJoin(index, 'on.rightTable', join.table);
                    }}
                    className="px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">= (Right Column)</option>
                    {join.table && getTableColumns(join.table).map(column => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conditions */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">Conditions</label>
          <button
            onClick={addCondition}
            className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Condition</span>
          </button>
        </div>
        {activeQuery.conditions.map((condition, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <select
              value={condition.column}
              onChange={(e) => updateCondition(index, 'column', e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select column</option>
              {tables
                .filter((table) => activeQuery.tables.includes(table.name))
                .map((table) =>
                  table.columns.map((column) => (
                    <option 
                      key={`${table.name}-${column}`} 
                      value={`${table.name}.${column}`}
                      disabled={activeQuery.conditions.some(
                        (c, i) => i !== index && c.column === `${table.name}.${column}`
                      )}
                    >
                      {table.name}.{column}
                    </option>
                  ))
                )}
            </select>
            <select
              value={condition.operator}
              onChange={(e) => updateCondition(index, 'operator', e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="=">=</option>
              <option value="!=">!=</option>
              <option value=">">{">"}</option>
              <option value="<">{"<"}</option>
              <option value=">=">{"≥"}</option>
              <option value="<=">{"≤"}</option>
              <option value="LIKE">LIKE</option>
            </select>
            <input
              type="text"
              value={condition.value}
              onChange={(e) => updateCondition(index, 'value', e.target.value)}
              placeholder="Value"
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <button
              onClick={() => removeCondition(index)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Apply Button */}
      <div className="flex justify-end">
        <button
          onClick={onApply}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Apply Query
        </button>
      </div>
    </div>
  );
};

export default QueryBuilder;