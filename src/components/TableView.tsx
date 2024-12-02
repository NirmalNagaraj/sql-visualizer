import React from 'react';

const TableView = ({ table }) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h3 className="font-medium text-gray-700">{table.name}</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {table.columns.map((column) => (
            <div
              key={column}
              className="text-sm px-2 py-1 bg-gray-100 rounded text-gray-700"
            >
              {column}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableView;