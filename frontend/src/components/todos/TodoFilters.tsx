import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { TodoFilters as TodoFiltersType } from '@/types';

interface TodoFiltersProps {
  filters: TodoFiltersType;
  onFiltersChange: (filters: TodoFiltersType) => void;
  totalCount: number;
}

export function TodoFilters({ filters, onFiltersChange, totalCount }: TodoFiltersProps) {
  const hasActiveFilters =
    filters.status || filters.priority || filters.tag || filters.search;

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = (key: keyof TodoFiltersType, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <span className="text-sm text-gray-500">{totalCount} tasks</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value || undefined)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <Select
          value={filters.status || ''}
          onChange={(e) => updateFilter('status', e.target.value || undefined)}
          options={[
            { value: '', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
          ]}
        />

        <Select
          value={filters.priority || ''}
          onChange={(e) => updateFilter('priority', e.target.value || undefined)}
          options={[
            { value: '', label: 'All Priorities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
        />

        <div className="flex items-end gap-2">
          <Select
            value={`${filters.sort || 'created_at'}-${filters.order || 'desc'}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split('-');
              onFiltersChange({ ...filters, sort, order: order as 'asc' | 'desc' });
            }}
            options={[
              { value: 'created_at-desc', label: 'Newest First' },
              { value: 'created_at-asc', label: 'Oldest First' },
              { value: 'priority-desc', label: 'Priority: High → Low' },
              { value: 'priority-asc', label: 'Priority: Low → High' },
              { value: 'due_date-asc', label: 'Due Date: Earliest' },
              { value: 'due_date-desc', label: 'Due Date: Latest' },
            ]}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="text-gray-500"
        >
          <X className="mr-1 h-3 w-3" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
