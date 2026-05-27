import { ClipboardList } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = 'No items found',
  description = 'Get started by creating a new item.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-200/40 to-purple-200/40 blur-xl" />
        <div className="relative rounded-full bg-gradient-to-br from-white/80 to-slate-50/80 border border-white/60 p-6 shadow-lg backdrop-blur-sm">
          <ClipboardList className="h-10 w-10 text-gray-400" />
        </div>
      </div>
      <h3 className="mt-6 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-xs leading-relaxed">{description}</p>
    </div>
  );
}
