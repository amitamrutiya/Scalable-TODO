import { useState } from 'react';
import { Check, Trash2, Calendar, Tag, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, isOverdue } from '@/utils/date';
import type { Todo } from '@/types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, isCompleted: boolean) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
}

const priorityConfig = {
  low: { color: 'bg-green-100 text-green-800', label: 'Low' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  high: { color: 'bg-red-100 text-red-800', label: 'High' },
};

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(todo.id, todo.is_completed);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setIsDeleting(true);
    try {
      await onDelete(todo.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const overdue = !todo.is_completed && isOverdue(todo.due_date);

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md',
        todo.is_completed && 'opacity-60'
      )}
    >
      <button
        onClick={handleToggle}
        disabled={isToggling}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
          todo.is_completed
            ? 'border-blue-500 bg-blue-500'
            : 'border-gray-300 hover:border-blue-400'
        )}
      >
        {todo.is_completed && <Check className="h-3.5 w-3.5 text-white" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              'text-sm font-medium text-gray-900',
              todo.is_completed && 'line-through text-gray-500'
            )}
          >
            {todo.title}
          </h3>
          <div className="flex items-center gap-1">
            <Badge
              variant={
                todo.priority === 'high'
                  ? 'error'
                  : todo.priority === 'medium'
                  ? 'warning'
                  : 'success'
              }
            >
              {priorityConfig[todo.priority].label}
            </Badge>
          </div>
        </div>

        {todo.description && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{todo.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {todo.due_date && (
            <span
              className={cn(
                'flex items-center gap-1 text-xs',
                overdue ? 'text-red-600' : 'text-gray-500'
              )}
            >
              {overdue ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              {overdue ? 'Overdue: ' : ''}
              {formatDate(todo.due_date)}
            </span>
          )}

          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {formatDate(todo.created_at)}
          </span>

          {todo.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <Tag className="h-3 w-3 text-gray-400" />
              {todo.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        isLoading={isDeleting}
        className="shrink-0 opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}
