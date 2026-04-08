import { useState, useCallback, useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';
import SapBadge from '../shared/SapBadge';
import SectionHeader from '../shared/SectionHeader';
import SortFilterHeader from '../shared/SortFilterHeader';
import Pagination from '../shared/Pagination';
import ExportButtons from '../shared/ExportButtons';
import { useSortFilter } from '../../hooks/useSortFilter';

function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function TypeBadge({ type }) {
  if (type === 'GR_WITHOUT_IR') return <SapBadge variant="critical">GR w/o IR</SapBadge>;
  return <SapBadge variant="warning">IR w/o GR</SapBadge>;
}

function AgeBadge({ days }) {
  if (days > 45) return <SapBadge variant="critical">{days}d</SapBadge>;
  if (days > 20) return <SapBadge variant="warning">{days}d</SapBadge>;
  return <SapBadge variant="success">{days}d</SapBadge>;
}

const COLUMNS = [
  { label: 'Purchasing Document',  col: 'EBELN',           align: 'left'  },
  { label: 'Invoice Document No.', col: 'INVOICE_NUM',     align: 'left'  },
  { label: 'Supplier',             col: 'VENDOR_NAME',     align: 'left'  },
  { label: 'Material / Svc',       col: 'TXZ01',           align: 'left'  },
  { label: 'Requester',            col: 'REQUESTER',       align: 'left'  },
  { label: 'Qty GR',               col: 'QTY_GR',          align: 'right' },
  { label: 'Qty IR',               col: 'QTY_IR',          align: 'right' },
  { label: 'Open Balance',         col: 'BALANCE_QTY',     align: 'right' },
  { label: 'Open Value',           col: 'BALANCE_VAL',     align: 'right' },
  { label: 'Age (days)',           col: 'DAYS_OPEN',       align: 'right' },
  { label: 'Type',                 col: 'DISCREPANCY_TYPE',align: 'left'  },
  { label: 'SAP Txn',             col: 'SAP_TRANSACTION', align: 'left', noFilter: true },
];

const LS_RESOLVED_KEY = 'mrbr_resolved_v2';

// Unique key per blocked invoice — EBELN+EBELP alone collides when EBELP defaults to '00010'
function rowKey(r) {
  return `${r.EBELN}|${r.INVOICE_NUM}|${r.BALANCE_VAL}`;
}

export default function ExceptionsTable({ data }) {
  const [typeFilter, setTypeFilter]   = useState('ALL');
  const [hideResolved, setHideResolved] = useState(false);
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(25);

  const [resolved, setResolved] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_RESOLVED_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    try { localStorage.setItem(LS_RESOLVED_KEY, JSON.stringify([...resolved])); }
    catch {}
  }, [resolved]);

  const toggleResolved = useCallback((key) => {
    setResolved((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const typeFiltered = data
    .filter((d) => typeFilter === 'ALL' || d.DISCREPANCY_TYPE === typeFilter)
    .filter((d) => !hideResolved || !resolved.has(rowKey(d)));

  const {
    processed, sortCol, sortDir, toggleSort,
    filters, setFilter, clearAll, activeFilterCount,
  } = useSortFilter(typeFiltered, 'BALANCE_VAL', 'desc');

  const pageData = processed.slice((page - 1) * pageSize, page * pageSize);
  const resolvedCount = data.filter((r) => resolved.has(rowKey(r))).length;

  return (
    <div>
      <SectionHeader
        title="GR/IR Exceptions Detail"
        subtitle={`${processed.length} of ${data.length} items${resolvedCount ? ` · ${resolvedCount} resolved` : ''}${activeFilterCount ? ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active)` : ''} — sorted by open value`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium"
              >
                <X size={12} /> Clear filters
              </button>
            )}
            <ExportButtons
              data={processed}
              filename="gr_ir_exceptions"
              columns={COLUMNS.filter(c => c.col !== 'SAP_TRANSACTION').map(({ label, col }) => ({ key: col, label }))}
            />
            {resolvedCount > 0 && (
              <button
                onClick={() => setHideResolved((v) => !v)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors border ${
                  hideResolved
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-green-700 border-green-400 hover:bg-green-50'
                }`}
              >
                {hideResolved ? `Show resolved (${resolvedCount})` : `Hide resolved (${resolvedCount})`}
              </button>
            )}
            <div className="flex gap-1">
              {['ALL', 'GR_WITHOUT_IR', 'IR_WITHOUT_GR'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                    typeFilter === f
                      ? 'bg-sap-blue text-white'
                      : 'bg-sap-gray text-sap-subtext hover:bg-sap-lightblue'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f === 'GR_WITHOUT_IR' ? 'GR w/o IR' : 'IR w/o GR'}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[960px]">
          <thead>
            <tr className="border-b-2 border-sap-border">
              <th className="py-2 pr-3 text-center font-semibold text-sap-subtext uppercase tracking-wide whitespace-nowrap">
                Resolved
              </th>
              {COLUMNS.map(({ label, col, align, noFilter }) => (
                <SortFilterHeader
                  key={col}
                  label={label}
                  col={col}
                  sortCol={sortCol}
                  sortDir={sortDir}
                  onSort={toggleSort}
                  filter={filters[col] || ''}
                  onFilter={setFilter}
                  align={align}
                  noFilter={noFilter}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="py-6 text-center text-sap-subtext text-xs">
                  No items match the current filters.
                </td>
              </tr>
            )}
            {pageData.map((row, i) => {
              const rk = rowKey(row);
              const isResolved = resolved.has(rk);
              return (
              <tr
                key={`${rk}-${i}`}
                className={`border-b border-sap-border transition-colors ${
                  isResolved
                    ? 'bg-green-50 opacity-60'
                    : row.DISCREPANCY_TYPE === 'GR_WITHOUT_IR'
                      ? i % 2 === 0 ? 'bg-red-50 hover:bg-red-100' : 'bg-red-50/60 hover:bg-red-100'
                      : i % 2 === 0 ? 'bg-amber-50 hover:bg-amber-100' : 'bg-amber-50/60 hover:bg-amber-100'
                }`}
              >
                <td className="py-2.5 pr-3 text-center">
                  <input
                    type="checkbox"
                    checked={isResolved}
                    onChange={() => toggleResolved(rk)}
                    className="w-4 h-4 rounded border-sap-border cursor-pointer accent-green-600"
                    title={isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
                  />
                </td>
                <td className={`py-2.5 pr-3 font-mono font-medium whitespace-nowrap ${isResolved ? 'text-sap-subtext line-through' : 'text-sap-blue'}`}>
                  {row.EBELN}
                </td>
                <td className="py-2.5 pr-3 font-mono text-sap-text whitespace-nowrap">
                  {row.INVOICE_NUM && row.INVOICE_NUM !== row.EBELN ? row.INVOICE_NUM : '—'}
                </td>
                <td className="py-2.5 pr-3 max-w-[130px] truncate" title={row.VENDOR_NAME}>
                  {row.VENDOR_NAME}
                </td>
                <td className="py-2.5 pr-3 max-w-[140px]">
                  <div className="truncate font-medium text-sap-text" title={row.TXZ01}>
                    {row.TXZ01 !== '—' ? row.TXZ01 : ''}
                  </div>
                  {row.MATNR !== '—' && <div className="text-sap-subtext font-mono">{row.MATNR}</div>}
                </td>
                <td className="py-2.5 pr-3 max-w-[120px] truncate" title={row.REQUESTER}>
                  {row.REQUESTER !== '—' ? row.REQUESTER : <span className="text-sap-subtext">—</span>}
                </td>
                <td className="py-2.5 pr-3 text-right font-mono text-sap-text">
                  {row.QTY_GR > 0 ? row.QTY_GR.toLocaleString() : <span className="text-sap-subtext">—</span>}
                </td>
                <td className="py-2.5 pr-3 text-right font-mono text-sap-text">
                  {row.QTY_IR > 0 ? row.QTY_IR.toLocaleString() : <span className="text-sap-subtext">—</span>}
                </td>
                <td className={`py-2.5 pr-3 text-right font-mono font-semibold ${
                  row.DISCREPANCY_TYPE === 'GR_WITHOUT_IR' ? 'text-red-700' : 'text-amber-700'
                }`}>
                  {row.BALANCE_QTY > 0 ? `${row.BALANCE_QTY.toLocaleString()} ${row.MEINS}` : <span className="text-sap-subtext">—</span>}
                </td>
                <td className="py-2.5 pr-3 text-right font-semibold text-sap-text whitespace-nowrap">
                  {fmt(row.BALANCE_VAL)}
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <AgeBadge days={row.DAYS_OPEN} />
                </td>
                <td className="py-2.5 pr-3">
                  <TypeBadge type={row.DISCREPANCY_TYPE} />
                </td>
                <td className="py-2.5">
                  <span className="inline-flex items-center gap-1 font-mono text-xs bg-sap-gray px-1.5 py-0.5 rounded text-sap-text font-medium">
                    {row.SAP_TRANSACTION}
                    <ExternalLink size={9} className="text-sap-subtext" />
                  </span>
                </td>
              </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-sap-border bg-sap-gray">
              <td colSpan={9} className="py-2 pr-3 text-right text-xs font-semibold text-sap-subtext uppercase tracking-wide">
                Total Open Value ({processed.length} items)
              </td>
              <td className="py-2 pr-3 text-right text-sm font-bold text-sap-text">
                {fmt(processed.reduce((s, d) => s + d.BALANCE_VAL, 0))}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      <Pagination
        total={processed.length}
        page={page}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={(n) => { setPageSize(n); setPage(1); }}
      />

      <p className="mt-2 text-xs text-sap-subtext">
        Click any column header to sort  •  Click <span className="font-mono bg-sap-gray px-1 rounded">▼</span> icon to filter
      </p>
    </div>
  );
}
