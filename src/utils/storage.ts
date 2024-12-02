export const saveTablesInStorage = (tables: any[]) => {
  sessionStorage.setItem('sql_visualizer_tables', JSON.stringify(tables));
};

export const getTablesFromStorage = () => {
  const tables = sessionStorage.getItem('sql_visualizer_tables');
  if (tables) {
    return JSON.parse(tables);
  }
  return [
    {
      name: 'users',
      columns: ['id', 'name', 'email', 'age'],
      data: [
        { id: 1, name: 'John Doe', email: 'john@example.com', age: 28 },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 32 },
        { id: 3, name: 'Bob Wilson', email: 'bob@example.com', age: 45 },
      ],
    },
    {
      name: 'orders',
      columns: ['id', 'user_id', 'product', 'amount'],
      data: [
        { id: 1, user_id: 1, product: 'Laptop', amount: 1200 },
        { id: 2, user_id: 1, product: 'Mouse', amount: 25 },
        { id: 3, user_id: 2, product: 'Keyboard', amount: 100 },
      ],
    },
  ];
};