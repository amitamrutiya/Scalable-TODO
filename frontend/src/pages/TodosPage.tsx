import { TodoForm } from '@/components/todos/TodoForm';
import { TodoList } from '@/components/todos/TodoList';
import { TodoFilters } from '@/components/todos/TodoFilters';
import { Pagination } from '@/components/todos/Pagination';
import { useTodos } from '@/hooks/useTodos';
import { useState } from 'react';
import type { CreateTodoData } from '@/types';

export function TodosPage() {
  const {
    todos,
    pagination,
    isLoading,
    error,
    filters,
    setPage,
    setFilters,
    createTodo,
    toggleTodo,
    deleteTodo,
  } = useTodos();

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTodo = async (data: CreateTodoData) => {
    setIsCreating(true);
    try {
      await createTodo(data);
    } finally {
      setIsCreating(false);
    }
  };

  const totalCount = pagination?.total ?? todos.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage and organize your daily tasks
        </p>
      </div>

      <div className="space-y-6">
        <TodoForm onSubmit={handleCreateTodo} isLoading={isCreating} />

        <TodoFilters
          filters={filters}
          onFiltersChange={setFilters}
          totalCount={totalCount}
        />

        <TodoList
          todos={todos}
          isLoading={isLoading}
          error={error}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
        />

        {pagination && pagination.total_pages > 1 && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
