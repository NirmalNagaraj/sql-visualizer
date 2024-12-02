import React from 'react';
import { generateSQLSyntax } from '../utils/sqlGenerator';

const SyntaxDisplay = ({ query }) => {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
        {generateSQLSyntax(query)}
      </pre>
    </div>
  );
};

export default SyntaxDisplay;