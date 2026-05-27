import { TodoItem } from './TodoItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import type { Todo } from '@/types';

interface TodoListProps {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  onToggle: (id: string, isCompleted: boolean) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
}

export function TodoList({ todos, isLoading, error, onToggle, onDelete }: TodoListProps) {
  if (isLoading && todos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <EmptyState
        title="No tasks yet"
        description="Create your first task to get started."
      />
    );
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
