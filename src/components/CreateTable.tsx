import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const CreateTable = ({ tables, setTables }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState([{ name: '', type: 'TEXT' }]);

  const handleAddColumn = () => {
    setColumns([...columns, { name: '', type: 'TEXT' }]);
  };

  const handleRemoveColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleColumnChange = (index, field, value) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setColumns(newColumns);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tableName && columns.every(col => col.name)) {
      const newTable = {
        name: tableName,
        columns: columns.map(col => col.name),
        data: []
      };
      setTables([...tables, newTable]);
      setTableName('');
      setColumns([{ name: '', type: 'TEXT' }]);
      setIsOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Table</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table Name
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter table name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Columns</label>
            {columns.map((column, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={column.name}
                  onChange={(e) => handleColumnChange(index, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Column name"
                />
                <select
                  value={column.type}
                  onChange={(e) => handleColumnChange(index, 'type', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="TEXT">TEXT</option>
                  <option value="INTEGER">INTEGER</option>
                  <option value="REAL">REAL</option>
                  <option value="DATE">DATE</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveColumn(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddColumn}
              className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Column</span>
            </button>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Table
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateTable;