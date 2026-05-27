import { useState, useCallback } from 'react';
import { Check, Trash2, Calendar, Tag, Clock, AlertCircle, Pencil } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, isOverdue } from '@/utils/date';
import type { Todo } from '@/types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, isCompleted: boolean) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
  onEdit?: (todo: Todo) => void;
}

const priorityConfig = {
  low: { 
    label: 'Low',
    gradient: 'bg-gradient-to-r from-emerald-400 to-teal-400',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/20',
  },
  medium: { 
    label: 'Medium',
    gradient: 'bg-gradient-to-r from-amber-400 to-orange-400',
    badgeColor: 'bg-amber-500/15 text-amber-700 border border-amber-500/20',
  },
  high: { 
    label: 'High',
    gradient: 'bg-gradient-to-r from-rose-400 to-red-400',
    badgeColor: 'bg-rose-500/15 text-rose-700 border border-rose-500/20',
  },
};

export function TodoItem({ todo, onToggle, onDelete, onEdit = () => {} }: TodoItemProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = useCallback(async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await onToggle(todo.id, todo.is_completed);
    } finally {
      setIsToggling(false);
    }
  }, [todo.id, todo.is_completed, onToggle, isToggling]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setIsDeleting(true);
    try {
      await onDelete(todo.id);
    } finally {
      setIsDeleting(false);
    }
  }, [todo.id, onDelete]);

  const handleEdit = useCallback(() => {
    onEdit(todo);
  }, [todo, onEdit]);

  const overdue = !todo.is_completed && isOverdue(todo.due_date);
  const priorityStyle = priorityConfig[todo.priority];

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 rounded-2xl border border-white/40 bg-white/70 p-5 shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl hover:shadow-black/5 hover:bg-white/90',
        todo.is_completed && 'opacity-60 bg-white/40'
      )}
    >
      {/* Priority indicator strip */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-300',
        priorityStyle.gradient,
        todo.is_completed && 'opacity-50'
      )} />

      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={isToggling}
        aria-label={todo.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
        className={cn(
          'relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-300',
          isToggling && 'opacity-50 cursor-not-allowed scale-90',
          todo.is_completed
            ? 'border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-500/30'
            : 'border-gray-300 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/20'
        )}
      >
        <Check 
          className={cn(
            'h-4 w-4 text-white transition-transform duration-300',
            todo.is_completed ? 'scale-100 rotate-0' : 'scale-0 -rotate-45'
          )} 
        />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              'text-sm font-semibold text-gray-900 transition-all duration-300',
              todo.is_completed && 'line-through text-gray-400'
            )}
          >
            {todo.title}
          </h3>
          <div className="flex items-center gap-1.5">
            <Badge className={cn(
              'transition-all duration-300 font-medium text-[10px] tracking-wide uppercase',
              priorityStyle.badgeColor
            )}>
              {priorityStyle.label}
            </Badge>
          </div>
        </div>

        {todo.description && (
          <p className={cn(
            'mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed transition-all duration-300',
            todo.is_completed && 'text-gray-400'
          )}>
            {todo.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {todo.due_date && (
            <span
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium transition-colors duration-300',
                overdue ? 'text-rose-600' : 'text-gray-500'
              )}
            >
              {overdue ? (
                <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
              ) : (
                <Calendar className="h-3.5 w-3.5" />
              )}
              {overdue ? 'Overdue: ' : ''}
              {formatDate(todo.due_date)}
            </span>
          )}

          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(todo.created_at)}
          </span>

          {todo.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-gray-400" />
              {todo.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 transition-colors duration-300 hover:bg-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 flex-col gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          disabled={isToggling}
          className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
          aria-label="Edit task"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          isLoading={isDeleting}
          className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
