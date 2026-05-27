import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  ListTodo,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useTodos } from '@/hooks/useTodos';
import { useProfile } from '@/hooks/useProfile';
import { formatDate, isOverdue } from '@/utils/date';
import type { Todo } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const {
    todos,
    isLoading: todosLoading,
    error,
    fetchTodos,
  } = useTodos({ status: 'pending', sort: 'due_date', order: 'asc' });

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const stats = profile?.stats || {
    total_todos: 0,
    completed_todos: 0,
    pending_todos: 0,
  };

  const completionRate =
    stats.total_todos > 0
      ? Math.round((stats.completed_todos / stats.total_todos) * 100)
      : 0;

  const upcomingTodos = todos.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.display_name || user?.display_name || 'User'}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's an overview of your tasks
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tasks"
          value={stats.total_todos}
          icon={<ListTodo className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Completed"
          value={stats.completed_todos}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-100"
        />
        <StatCard
          title="Pending"
          value={stats.pending_todos}
          icon={<Circle className="h-5 w-5 text-yellow-600" />}
          iconBg="bg-yellow-100"
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-100"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Upcoming Tasks</CardTitle>
            </div>
            <Link to="/todos">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todosLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
                <p className="text-sm">{error}</p>
              </div>
            ) : upcomingTodos.length === 0 ? (
              <EmptyState
                title="All caught up!"
                description="You have no pending tasks."
              />
            ) : (
              <div className="space-y-3">
                {upcomingTodos.map((todo) => (
                  <UpcomingTaskItem key={todo.id} todo={todo} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link
                to="/todos"
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="rounded-lg bg-blue-100 p-2">
                  <ListTodo className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">Manage Tasks</h3>
                  <p className="text-xs text-gray-500">View and manage all your tasks</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="rounded-lg bg-purple-100 p-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">View Profile</h3>
                  <p className="text-xs text-gray-500">Check your stats and settings</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconBg,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`rounded-xl ${iconBg} p-3`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingTaskItem({ todo }: { todo: Todo }) {
  const overdue = !todo.is_completed && isOverdue(todo.due_date);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div
        className={`h-2 w-2 shrink-0 rounded-full ${
          todo.priority === 'high'
            ? 'bg-red-500'
            : todo.priority === 'medium'
            ? 'bg-yellow-500'
            : 'bg-green-500'
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{todo.title}</p>
        {todo.due_date && (
          <p className={`text-xs ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
            {overdue && <AlertCircle className="mr-1 inline h-3 w-3" />}
            Due {formatDate(todo.due_date)}
          </p>
        )}
      </div>
      <Badge
        variant={
          todo.priority === 'high'
            ? 'error'
            : todo.priority === 'medium'
            ? 'warning'
            : 'success'
        }
      >
        {todo.priority}
      </Badge>
    </div>
  );
}
