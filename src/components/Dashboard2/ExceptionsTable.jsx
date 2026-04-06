import { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import SapBadge from '../shared/SapBadge';
import SectionHeader from '../shared/SectionHeader';
import SortFilterHeader from '../shared/SortFilterHeader';
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
  { label: 'Purchasing Document', col: 'EBELN',          align: 'left'  },
  { label: 'Supplier',         col: 'VENDOR_NAME',      align: 'left'  },
  { label: 'Material / Svc',   col: 'TXZ01',            align: 'left'  },
  { label: 'Requester',        col: 'REQUESTER',        align: 'left'  },
  { label: 'Qty GR',           col: 'QTY_GR',           align: 'right' },
  { label: 'Qty IR',           col: 'QTY_IR',           align: 'right' },
  { label: 'Open Balance',     col: 'BALANCE_QTY',      align: 'right' },
  { label: 'Open Value',       col: 'BALANCE_VAL',      align: 'right' },
  { label: 'Age (days)',       col: 'DAYS_OPEN',        align: 'right' },
  { label: 'Type',             col: 'DISCREPANCY_TYPE', align: 'left'  },
  { label: 'SAP Txn',         col: 'SAP_TRANSACTION',  align: 'left', noFilter: true },
];

export default function ExceptionsTable({ data }) {
  const [typeFilter, setTypeFilter] = useState('ALL');

  const typeFiltered = typeFilter === 'ALL'
    ? data
    : data.filter((d) => d.DISCREPANCY_TYPE === typeFilter);

  const {
    processed, sortCol, sortDir, toggleSort,
    filters, setFilter, clearAll, activeFilterCount,
  } = useSortFilter(typeFiltered, 'BALANCE_VAL', 'desc');

  return (
    <div>
      <SectionHeader
        title="GR/IR Exceptions Detail"
        subtitle={`${processed.length} of ${data.length} items${activeFilterCount ? ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active)` : ''} — sorted by open value`}
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
        <table className="w-full text-xs min-w-[860px]">
          <thead>
            <tr className="border-b-2 border-sap-border">
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
            {processed.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="py-6 text-center text-sap-subtext text-xs">
                  No items match the current filters.
                </td>
              </tr>
            )}
            {processed.map((row, i) => (
              <tr
                key={`${row.EBELN}-${row.EBELP}-${i}`}
                className={`border-b border-sap-border transition-colors ${
                  row.DISCREPANCY_TYPE === 'GR_WITHOUT_IR'
                    ? i % 2 === 0 ? 'bg-red-50 hover:bg-red-100' : 'bg-red-50/60 hover:bg-red-100'
                    : i % 2 === 0 ? 'bg-amber-50 hover:bg-amber-100' : 'bg-amber-50/60 hover:bg-amber-100'
                }`}
              >
                <td className="py-2.5 pr-3 font-mono font-medium text-sap-blue whitespace-nowrap">
                  <div>{row.EBELN}</div>
                  {row.INVOICE_NUM && row.INVOICE_NUM !== row.EBELN && (
                    <div className="text-sap-subtext text-xs">{row.INVOICE_NUM}</div>
                  )}
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
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-sap-border bg-sap-gray">
              <td colSpan={7} className="py-2 pr-3 text-right text-xs font-semibold text-sap-subtext uppercase tracking-wide">
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

      <p className="mt-3 text-xs text-sap-subtext">
        Click any column header to sort  •  Click <span className="font-mono bg-sap-gray px-1 rounded">▼</span> icon to filter  •
        <span className="font-mono bg-sap-gray px-1 rounded ml-1">MRBR</span> release blocked invoices  •
        <span className="font-mono bg-sap-gray px-1 rounded ml-1">MB5S</span> GR/IR balance  •
        <span className="font-mono bg-sap-gray px-1 rounded ml-1">MR11</span> clear GR/IR accounts
      </p>
    </div>
  );
}
