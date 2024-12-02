import React, { useState, useEffect } from 'react';
import { Database, Table2, Search, Plus, Filter, ArrowLeftRight } from 'lucide-react';
import QueryBuilder from './components/QueryBuilder';
import QueryVisualizer from './components/QueryVisualizer';
import SyntaxDisplay from './components/SyntaxDisplay';
import TableView from './components/TableView';
import CreateTable from './components/CreateTable';
import { getTablesFromStorage, saveTablesInStorage } from './utils/storage';

function App() {
  const [activeQuery, setActiveQuery] = useState({
    type: 'select',
    tables: [],
    columns: ['*'],
    conditions: [],
    joins: [],
    values: [],
  });

  const [showResults, setShowResults] = useState(false);
  const [tables, setTables] = useState(() => getTablesFromStorage());

  useEffect(() => {
    saveTablesInStorage(tables);
  }, [tables]);

  const handleApplyQuery = () => {
    setShowResults(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white py-6 px-8 shadow-lg">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Interactive SQL Visualizer</h1>
        </div>
        <p className="mt-2 text-indigo-100">Build and visualize SQL queries with an interactive interface</p>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Create Table Section */}
        <div className="mb-8">
          <CreateTable tables={tables} setTables={setTables} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Query Builder */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Table2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold">Query Builder</h2>
              </div>
              <QueryBuilder
                tables={tables}
                activeQuery={activeQuery}
                setActiveQuery={setActiveQuery}
                onApply={handleApplyQuery}
                setTables={setTables}
              />
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Search className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold">SQL Syntax</h2>
              </div>
              <SyntaxDisplay query={activeQuery} />
            </div>
          </div>

          {/* Right Column - Visualization */}
          <div className="space-y-6">
            {showResults && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold">Query Result</h2>
                </div>
                <QueryVisualizer query={activeQuery} tables={tables} setTables={setTables} />
              </div>
            )}

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold">Available Tables</h2>
              </div>
              <div className="space-y-4">
                {tables.map((table) => (
                  <TableView key={table.name} table={table} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;