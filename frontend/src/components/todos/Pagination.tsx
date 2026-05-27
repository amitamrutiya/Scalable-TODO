import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Pagination as PaginationType } from '@/types';

interface PaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, total_pages } = pagination;

  if (total_pages <= 1) return null;

  const pages = Array.from({ length: total_pages }, (_, i) => i + 1);
  const visiblePages = pages.slice(
    Math.max(0, page - 3),
    Math.min(total_pages, page + 2)
  );

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {page > 3 && (
        <>
          <Button variant="ghost" size="sm" onClick={() => onPageChange(1)}>
            1
          </Button>
          <span className="px-2 text-gray-400">...</span>
        </>
      )}

      {visiblePages.map((p) => (
        <Button
          key={p}
          variant={p === page ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      ))}

      {page < total_pages - 2 && (
        <>
          <span className="px-2 text-gray-400">...</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(total_pages)}
          >
            {total_pages}
          </Button>
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= total_pages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
