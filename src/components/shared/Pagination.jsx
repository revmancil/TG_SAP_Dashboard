import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZES = [25, 50, 90];

export default function Pagination({ total, page, pageSize, onPage, onPageSize }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  function handleSize(n) {
    onPageSize(n);
    onPage(1);
  }

  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-sap-border text-xs text-sap-subtext flex-wrap gap-2">
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-sap-text">Show:</span>
        {PAGE_SIZES.map((n) => (
          <button
            key={n}
            onClick={() => handleSize(n)}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              pageSize === n
                ? 'bg-sap-blue text-white'
                : 'bg-sap-gray text-sap-subtext hover:bg-sap-lightblue hover:text-sap-blue'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span>Showing {start}–{end} of {total}</span>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="p-1 rounded hover:bg-sap-gray disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="font-medium text-sap-text px-1">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="p-1 rounded hover:bg-sap-gray disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
