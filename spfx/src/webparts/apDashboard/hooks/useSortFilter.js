import { useState, useMemo } from 'react';

/**
 * Provides sort + text-filter logic for a data array.
 *
 * @param {Array}  data         - source array of objects
 * @param {string} defaultSortCol - optional initial sort column key
 * @param {string} defaultSortDir - 'asc' | 'desc'
 */
export function useSortFilter(data, defaultSortCol = null, defaultSortDir = 'desc') {
  const [sortCol, setSortCol] = useState(defaultSortCol);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [filters, setFilters] = useState({});

  function toggleSort(col) {
    if (sortCol === col) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        // third click clears sort
        setSortCol(null);
        setSortDir('desc');
      }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  function setFilter(col, value) {
    setFilters((prev) => {
      if (!value.trim()) {
        const next = { ...prev };
        delete next[col];
        return next;
      }
      return { ...prev, [col]: value };
    });
  }

  function clearAll() {
    setFilters({});
    setSortCol(defaultSortCol);
    setSortDir(defaultSortDir);
  }

  const activeFilterCount = Object.keys(filters).length;

  const processed = useMemo(() => {
    let result = [...data];

    // Apply text filters
    Object.entries(filters).forEach(([col, val]) => {
      const lower = val.toLowerCase();
      result = result.filter((row) => {
        const v = String(row[col] ?? '').toLowerCase();
        return v.includes(lower);
      });
    });

    // Apply sort
    if (sortCol) {
      result.sort((a, b) => {
        const av = a[sortCol];
        const bv = b[sortCol];
        const isNum = typeof av === 'number' && typeof bv === 'number';
        const cmp = isNum
          ? av - bv
          : String(av ?? '').localeCompare(String(bv ?? ''), undefined, { sensitivity: 'base' });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, filters, sortCol, sortDir]);

  return { processed, sortCol, sortDir, toggleSort, filters, setFilter, clearAll, activeFilterCount };
}
