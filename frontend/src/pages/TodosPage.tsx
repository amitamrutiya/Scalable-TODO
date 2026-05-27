import { useState, useMemo, useCallback } from 'react';
import { ListTodo, CheckCircle2, CircleDashed, TrendingUp, Sparkles } from 'lucide-react';
import { TodoForm } from '@/components/todos/TodoForm';
import { TodoList } from '@/components/todos/TodoList';
import { TodoFilters } from '@/components/todos/TodoFilters';
import { TodoEditModal } from '@/components/todos/TodoEditModal';
import { Pagination } from '@/components/todos/Pagination';
import { useTodos } from '@/hooks/useTodos';
import type { CreateTodoData, Todo, UpdateTodoData } from '@/types';

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">Progress</span>
        <span className="font-bold text-gray-900">{percentage}%</span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-gray-200/60 backdrop-blur-sm">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        <span>{completed} of {total} completed</span>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color,
  delay 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number; 
  color: string;
  delay: string;
}) {
  return (
    <div 
      className={`flex items-center gap-3 rounded-2xl border border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-white/80 animate-in fade-in zoom-in-95 ${delay}`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} shadow-lg`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

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
    updateTodo,
    deleteTodo,
    toggleTodo,
  } = useTodos();

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const handleCreateTodo = useCallback(async (data: CreateTodoData) => {
    setIsCreating(true);
    try {
      await createTodo(data);
    } finally {
      setIsCreating(false);
    }
  }, [createTodo]);

  const handleEditStart = useCallback((todo: Todo) => {
    setEditingTodo(todo);
    setIsEditing(true);
  }, []);

  const handleEditClose = useCallback(() => {
    setIsEditing(false);
    setEditingTodo(null);
  }, []);

  const handleEditSubmit = useCallback(async (id: string, data: UpdateTodoData) => {
    setIsEditing(true);
    try {
      await updateTodo(id, data);
    } finally {
      setIsEditing(false);
    }
  }, [updateTodo]);

  const totalCount = pagination?.total ?? todos.length;

  const stats = useMemo(() => {
    const completed = todos.filter((t) => t.is_completed).length;
    const active = todos.filter((t) => !t.is_completed).length;
    return { completed, active, total: todos.length };
  }, [todos]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
              My Tasks
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and organize your daily tasks with style
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/60 border border-white/40 px-4 py-2 shadow-sm backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Stay productive!</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <StatCard
            icon={ListTodo}
            label="Total Tasks"
            value={stats.total}
            color="bg-gradient-to-br from-blue-400 to-indigo-500"
            delay="delay-100"
          />
          <StatCard
            icon={CircleDashed}
            label="Active"
            value={stats.active}
            color="bg-gradient-to-br from-amber-400 to-orange-500"
            delay="delay-200"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={stats.completed}
            color="bg-gradient-to-br from-emerald-400 to-teal-500"
            delay="delay-300"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Left Column - Task List */}
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
              onEdit={handleEditStart}
            />

            {pagination && pagination.total_pages > 1 && (
              <Pagination
                pagination={pagination}
                onPageChange={setPage}
              />
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="hidden lg:block space-y-6">
            {/* Progress */}
            <div className="sticky top-8 space-y-6">
              <div className="rounded-2xl border border-white/40 bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:bg-white/80">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  <h2 className="font-semibold text-gray-900">Overview</h2>
                </div>
                <ProgressBar completed={stats.completed} total={stats.total} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <TodoEditModal
        todo={editingTodo}
        isOpen={isEditing}
        onClose={handleEditClose}
        onSubmit={handleEditSubmit}
        isLoading={isEditing}
      />
    </div>
  );
}
