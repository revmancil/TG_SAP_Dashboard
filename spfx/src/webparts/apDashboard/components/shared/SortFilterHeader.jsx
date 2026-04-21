import { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Filter, X } from 'lucide-react';

/**
 * A <th> replacement that supports click-to-sort and an inline filter popover.
 *
 * Props:
 *   label       - display text
 *   col         - data key used for sort/filter
 *   sortCol     - currently active sort column key
 *   sortDir     - 'asc' | 'desc'
 *   onSort      - (col) => void
 *   filter      - current filter string for this column
 *   onFilter    - (col, value) => void
 *   align       - 'left' | 'right' | 'center'  (default: 'left')
 *   noFilter    - disable filter input (e.g. badge/icon columns)
 *   className   - extra <th> classes
 */
export default function SortFilterHeader({
  label, col, sortCol, sortDir, onSort,
  filter, onFilter,
  align = 'left', noFilter = false, className = '',
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef();
  const thRef    = useRef();

  const isActive  = sortCol === col;
  const hasFilter = filter && filter.length > 0;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (thRef.current && !thRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const SortIcon = isActive
    ? (sortDir === 'asc' ? ArrowUp : ArrowDown)
    : ArrowUpDown;

  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <th ref={thRef} className={`relative py-2 pr-3 last:pr-0 font-semibold text-sap-subtext uppercase tracking-wide whitespace-nowrap select-none ${alignClass} ${className}`}>
      <div className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {/* Sort trigger */}
        <button
          onClick={() => onSort(col)}
          className={`flex items-center gap-1 hover:text-sap-text transition-colors ${isActive ? 'text-sap-blue' : ''}`}
          title={`Sort by ${label}`}
        >
          {label}
          <SortIcon size={11} className={isActive ? 'text-sap-blue' : 'text-sap-border'} />
        </button>

        {/* Filter trigger */}
        {!noFilter && (
          <button
            onClick={() => setOpen((v) => !v)}
            className={`transition-colors hover:text-sap-blue ${hasFilter ? 'text-sap-blue' : 'text-sap-border hover:text-sap-subtext'}`}
            title={`Filter ${label}`}
          >
            <Filter size={10} />
          </button>
        )}
      </div>

      {/* Filter popover */}
      {open && !noFilter && (
        <div className="absolute top-full left-0 z-20 mt-1 bg-white border border-sap-border rounded shadow-lg p-2 min-w-[160px]">
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={filter || ''}
              onChange={(e) => onFilter(col, e.target.value)}
              placeholder={`Filter ${label}…`}
              className="flex-1 text-xs border border-sap-border rounded px-2 py-1 focus:outline-none focus:border-sap-blue"
            />
            {hasFilter && (
              <button
                onClick={() => { onFilter(col, ''); setOpen(false); }}
                className="text-sap-subtext hover:text-red-500"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </th>
  );
}
