import { X, AlertTriangle, Tag } from 'lucide-react';
import SapBadge from '../shared/SapBadge';
import SectionHeader from '../shared/SectionHeader';
import SortFilterHeader from '../shared/SortFilterHeader';
import { useSortFilter } from '../../hooks/useSortFilter';

function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function AgingChip({ days }) {
  if (days > 10) return <SapBadge variant="critical">{days}d</SapBadge>;
  if (days > 5)  return <SapBadge variant="warning">{days}d</SapBadge>;
  return <SapBadge variant="success">{days}d</SapBadge>;
}

function StatusChip({ status }) {
  if (status === 'IN_PROCESS') return <SapBadge variant="active">In Process</SapBadge>;
  return <SapBadge variant="ready">Ready</SapBadge>;
}

const COLUMNS = [
  { label: 'Invoice #',        col: 'BELNR',            align: 'left'  },
  { label: 'Supplier',         col: 'VENDOR_NAME',      align: 'left'  },
  { label: 'Amount',           col: 'WRBTR',            align: 'right' },
  { label: 'Payment Terms',    col: 'ZTERM_DESC',       align: 'left'  },
  { label: 'Age (days)',       col: 'DAYS_IN_WORKFLOW', align: 'right' },
  { label: 'Status',           col: 'WI_STAT',          align: 'left'  },
  { label: 'Current Approver', col: 'APPROVER_NAME',    align: 'left'  },
  { label: 'Discount Risk',    col: 'DAYS_TO_DISCOUNT', align: 'left', noFilter: true },
];

export default function ActionList({ data, selectedApprover, onClear }) {
  const {
    processed, sortCol, sortDir, toggleSort,
    filters, setFilter, clearAll, activeFilterCount,
  } = useSortFilter(data, 'WRBTR', 'desc');

  return (
    <div>
      <SectionHeader
        title="Invoice Action List"
        subtitle={
          selectedApprover
            ? `Filtered by approver — ${processed.length} of ${data.length} item${data.length !== 1 ? 's' : ''}`
            : `${processed.length} of ${data.length} item${data.length !== 1 ? 's' : ''} ${activeFilterCount ? `(${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active)` : ''}`
        }
        action={
          <div className="flex gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium"
              >
                <X size={12} /> Clear filters
              </button>
            )}
            {selectedApprover && (
              <button
                onClick={onClear}
                className="flex items-center gap-1 text-xs text-sap-blue hover:text-sap-darkblue font-medium"
              >
                <X size={13} /> Clear approver filter
              </button>
            )}
          </div>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[720px]">
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
                  No invoices match the current filters.
                </td>
              </tr>
            )}
            {processed.map((row, i) => (
              <tr
                key={row.WI_ID}
                className={`border-b border-sap-border transition-colors ${
                  row.DISCOUNT_AT_RISK
                    ? 'bg-red-50 hover:bg-red-100'
                    : i % 2 === 0 ? 'bg-white hover:bg-sap-gray' : 'bg-gray-50 hover:bg-sap-gray'
                }`}
              >
                <td className="py-2.5 pr-4 font-mono font-medium text-sap-blue whitespace-nowrap">
                  {row.BELNR}
                </td>
                <td className="py-2.5 pr-4 text-sap-text max-w-[160px] truncate" title={row.VENDOR_NAME}>
                  {row.VENDOR_NAME}
                </td>
                <td className="py-2.5 pr-4 font-semibold text-sap-text whitespace-nowrap text-right">
                  {fmt(row.WRBTR)}
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Tag size={11} className="text-sap-subtext" />
                    <span className="text-sap-subtext">{row.ZTERM_DESC || '—'}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <AgingChip days={row.DAYS_IN_WORKFLOW} />
                </td>
                <td className="py-2.5 pr-4">
                  <StatusChip status={row.WI_STAT} />
                </td>
                <td className="py-2.5 pr-4 text-sap-text">{row.APPROVER_NAME}</td>
                <td className="py-2.5">
                  {row.DISCOUNT_AT_RISK ? (
                    <div className="flex items-center gap-1 text-red-600 font-semibold">
                      <AlertTriangle size={12} />
                      <span>{row.DAYS_TO_DISCOUNT <= 0 ? 'EXPIRED' : `${row.DAYS_TO_DISCOUNT}d left`}</span>
                    </div>
                  ) : (
                    <span className="text-sap-subtext">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-sap-subtext">
        Click any column header to sort  •  Click <span className="font-mono bg-sap-gray px-1 rounded">▼</span> icon to filter  •
        SAP txn: <span className="font-mono bg-sap-gray px-1 rounded">FBL1N</span> vendor open items  •
        <span className="font-mono bg-sap-gray px-1 rounded ml-1">SWI2_FREQ</span> workflow by agent
      </p>
    </div>
  );
}
