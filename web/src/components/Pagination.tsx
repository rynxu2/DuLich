import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, pageSize, totalItems }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/10">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Hiển thị <span className="font-semibold text-slate-700 dark:text-slate-300">{totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> - <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(currentPage * pageSize, totalItems)}</span> trong <span className="font-semibold text-slate-700 dark:text-slate-300">{totalItems}</span> kết quả
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        {getPages().map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' ? onPageChange(page) : null}
            disabled={page === '...'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              page === currentPage 
                ? 'bg-blue-600 text-white shadow-sm' 
                : page === '...' 
                  ? 'text-slate-400 cursor-default'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {page}
          </button>
        ))}
        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
