import { useState, useMemo } from 'react';
import { FileText, X, DollarSign, Users, Clock } from 'lucide-react';
import FileUpload from '../../components/shared/FileUpload';
import SortFilterHeader from '../../components/shared/SortFilterHeader';
import SectionHeader from '../../components/shared/SectionHeader';
import KPICard from '../../components/shared/KPICard';
import SapBadge from '../../components/shared/SapBadge';
import { useSortFilter } from '../../hooks/useSortFilter';
import { parsePendingReceiptsCSV, PENDING_RECEIPTS_EXPECTED_COLUMNS } from '../../utils/pendingReceiptsParser';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function AgingChip({ days }) {
  if (days > 90) return <SapBadge variant="critical">{days}d</SapBadge>;
  if (days > 60) return <SapBadge variant="warning">{days}d</SapBadge>;
  if (days > 30) return <SapBadge variant="ready">{days}d</SapBadge>;
  return <SapBadge variant="success">{days}d</SapBadge>;
}

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS = [
  { label: 'Invoice Number', col: 'INVOICE_NUM',  align: 'left'  },
  { label: 'Venue Name',     col: 'VENUE_NAME',   align: 'left'  },
  { label: 'Supplier Name',  col: 'VENDOR_NAME',  align: 'left'  },
  { label: 'Invoice Date',   col: 'INVOICE_DATE', align: 'left'  },
  { label: 'Requester',      col: 'REQUESTER',    align: 'left'  },
  { label: 'PO Number',      col: 'PO_NUMBER',    align: 'left'  },
  { label: 'Invoice Total',  col: 'AMOUNT',       align: 'right' },
  { label: 'Invoice Year',   col: 'INVOICE_YEAR', align: 'left'  },
  { label: 'AP Comments',    col: 'AP_COMMENTS',  align: 'left'  },
  { label: 'Follow Up',      col: 'FOLLOW_UP',    align: 'left'  },
  { label: 'Age (days)',     col: 'DAYS_OPEN',    align: 'right' },
];

// ── Inner table component (receives parsed data array) ────────────────────────

function PendingTable({ data }) {
  const {
    processed, sortCol, sortDir, toggleSort,
    filters, setFilter, clearAll, activeFilterCount,
  } = useSortFilter(data, 'AMOUNT', 'desc');

  return (
    <div className="bg-white border border-sap-border rounded-lg shadow-sm p-4">
      <SectionHeader
        title="Pending Receipts"
        subtitle={`${processed.length} of ${data.length} invoice${data.length !== 1 ? 's' : ''} ${activeFilterCount ? `(${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active)` : ''}`}
        action={
          activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium"
            >
              <X size={12} /> Clear filters
            </button>
          )
        }
      />

      <div className="overflow-x-auto">
        <div className="max-h-[32rem] overflow-y-auto">
        <table className="w-full text-xs min-w-[900px]">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b-2 border-sap-border">
              {COLUMNS.map(({ label, col, align }) => (
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
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {processed.length === 0 && (
              <tr className="table-row">
                <td colSpan={COLUMNS.length} className="py-6 text-center text-sap-subtext text-xs">
                  No invoices match the current filters.
                </td>
              </tr>
            )}
            {processed.map((row, i) => (
              <tr
                key={`${row.INVOICE_NUM}-${i}`}
                className={`table-row border-b border-sap-border transition-colors ${
                  i % 2 === 0 ? 'bg-white hover:bg-sap-gray' : 'bg-gray-50 hover:bg-sap-gray'
                }`}
              >
                <td className="py-2.5 pr-4 font-mono font-medium text-sap-blue whitespace-nowrap">
                  {row.INVOICE_NUM}
                </td>
                <td className="py-2.5 pr-4 text-sap-text max-w-[130px] truncate" title={row.VENUE_NAME}>
                  {row.VENUE_NAME}
                </td>
                <td className="py-2.5 pr-4 text-sap-text max-w-[160px] truncate" title={row.VENDOR_NAME}>
                  {row.VENDOR_NAME}
                </td>
                <td className="py-2.5 pr-4 text-sap-subtext whitespace-nowrap">
                  {row.INVOICE_DATE || '—'}
                </td>
                <td className="py-2.5 pr-4 text-sap-text max-w-[120px] truncate" title={row.REQUESTER}>
                  {row.REQUESTER}
                </td>
                <td className="py-2.5 pr-4 font-mono text-sap-text whitespace-nowrap">
                  {row.PO_NUMBER}
                </td>
                <td className="py-2.5 pr-4 font-semibold text-sap-text whitespace-nowrap text-right">
                  {fmtCurrency(row.AMOUNT)}
                </td>
                <td className="py-2.5 pr-4 text-sap-subtext whitespace-nowrap">
                  {row.INVOICE_YEAR}
                </td>
                <td className="py-2.5 pr-4 text-sap-text max-w-[160px] truncate" title={row.AP_COMMENTS}>
                  {row.AP_COMMENTS || '—'}
                </td>
                <td className="py-2.5 pr-4 text-sap-text max-w-[120px] truncate" title={row.FOLLOW_UP}>
                  {row.FOLLOW_UP || '—'}
                </td>
                <td className="py-2.5 text-right">
                  <AgingChip days={row.DAYS_OPEN} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-sap-subtext">
        Click any column header to sort  •  Click <span className="font-mono bg-sap-gray px-1 rounded">▼</span> icon to filter
      </p>
    </div>
  );
}

// ── Main Dashboard4 component ─────────────────────────────────────────────────

export default function Dashboard4({ pendingData, onUpload, onClear, hasUpload }) {
  // KPI calculations
  const kpis = useMemo(() => {
    if (!pendingData || pendingData.length === 0) {
      return { totalValue: 0, count: 0, avgDaysOpen: 0 };
    }
    const totalValue  = pendingData.reduce((sum, r) => sum + (r.AMOUNT || 0), 0);
    const count       = pendingData.length;
    const avgDaysOpen = pendingData.reduce((sum, r) => sum + (r.DAYS_OPEN || 0), 0) / count;
    return { totalValue, count, avgDaysOpen };
  }, [pendingData]);

  function handleUploadData(rawRows) {
    const { data, errors } = parsePendingReceiptsCSV(rawRows);
    onUpload(data, errors);
  }

  return (
    <div className="space-y-4">
      {/* ── Upload panel ─────────────────────────────────────────────────── */}
      <FileUpload
        label="Upload Pending Receipts Report"
        expectedColumns={PENDING_RECEIPTS_EXPECTED_COLUMNS}
        onData={handleUploadData}
        onClear={onClear}
        hasData={hasUpload}
      />

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      {pendingData && pendingData.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard
              title="Total Invoice Value"
              value={fmtCurrency(kpis.totalValue)}
              icon={DollarSign}
              variant="default"
              subtitle="Sum of all pending invoice amounts"
            />
            <KPICard
              title="Invoice Count"
              value={kpis.count.toLocaleString()}
              icon={FileText}
              variant="info"
              subtitle="Total pending receipts"
            />
            <KPICard
              title="Avg Days Open"
              value={`${kpis.avgDaysOpen.toFixed(1)} days`}
              icon={Clock}
              variant={kpis.avgDaysOpen > 60 ? 'critical' : kpis.avgDaysOpen > 30 ? 'warning' : 'success'}
              subtitle="Average invoice age from today"
            />
          </div>

          {/* ── Pending receipts table ──────────────────────────────────── */}
          <PendingTable data={pendingData} />
        </>
      )}
    </div>
  );
}
