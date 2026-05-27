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
  onEdit: (todo: Todo) => void;
}

export function TodoList({ todos, isLoading, error, onToggle, onDelete, onEdit }: TodoListProps) {
  if (isLoading && todos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200 p-6 text-center">
        <p className="text-sm text-red-600 font-medium">{error}</p>
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
      {todos.map((todo, index) => (
        <div
          key={todo.id}
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <TodoItem
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </div>
      ))}
    </div>
  );
}
