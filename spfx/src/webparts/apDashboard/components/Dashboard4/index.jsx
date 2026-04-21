import { useState, useMemo, useCallback, useEffect } from 'react';
import { FileText, X, DollarSign, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import FileUpload from '../../components/shared/FileUpload';
import SortFilterHeader from '../../components/shared/SortFilterHeader';
import SectionHeader from '../../components/shared/SectionHeader';
import KPICard from '../../components/shared/KPICard';
import SapBadge from '../../components/shared/SapBadge';
import ExportButtons from '../shared/ExportButtons';
import { useSortFilter } from '../../hooks/useSortFilter';
import Pagination from '../shared/Pagination';
import { parsePendingReceiptsCSV, PENDING_RECEIPTS_EXPECTED_COLUMNS } from '../../utils/pendingReceiptsParser';

function fmtCurrency(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}
function fmtShort(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function AgingChip({ days }) {
  if (days > 90) return <SapBadge variant="critical">{days}d</SapBadge>;
  if (days > 60) return <SapBadge variant="warning">{days}d</SapBadge>;
  if (days > 30) return <SapBadge variant="ready">{days}d</SapBadge>;
  return <SapBadge variant="success">{days}d</SapBadge>;
}

// ── Aging buckets ─────────────────────────────────────────────────────────────
const AGING_BUCKETS = [
  { label: '0–30 days',  min: 0,  max: 30,       color: '#2E7D32' },
  { label: '31–60 days', min: 31, max: 60,        color: '#E9730C' },
  { label: '61–90 days', min: 61, max: 90,        color: '#BB0000' },
  { label: '90+ days',   min: 91, max: Infinity,  color: '#7B0000' },
];

function AgingChart({ data }) {
  const chartData = AGING_BUCKETS.map(({ label, min, max, color }) => {
    const items = data.filter((r) => r.DAYS_OPEN >= min && r.DAYS_OPEN <= max);
    return {
      label,
      count: items.length,
      value: items.reduce((s, r) => s + r.AMOUNT, 0),
      color,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-sap-border rounded shadow-lg p-3 text-xs">
        <p className="font-semibold text-sap-text mb-1">{label}</p>
        <p className="text-sap-text">{payload[0].value} invoice{payload[0].value !== 1 ? 's' : ''}</p>
        <p className="text-sap-subtext">{fmtShort(chartData.find(d => d.label === label)?.value || 0)} outstanding</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
      <SectionHeader
        title="Invoice Aging"
        subtitle="Invoice count by days outstanding"
      />
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 20, right: 16, bottom: 0, left: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#D9DBDD" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6A6D70' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6A6D70' }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
            <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 600, fill: '#32363A' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Top 10 suppliers ──────────────────────────────────────────────────────────
function TopSuppliers({ data }) {
  const suppliers = useMemo(() => {
    const map = {};
    data.forEach((r) => {
      const key = r.VENDOR_NAME || 'Unknown';
      if (!map[key]) map[key] = { name: key, count: 0, amount: 0 };
      map[key].count  += 1;
      map[key].amount += r.AMOUNT || 0;
    });
    return Object.values(map)
      .sort((a, b) => b.count - a.count || b.amount - a.amount)
      .slice(0, 10);
  }, [data]);

  const maxCount = suppliers[0]?.count || 1;

  return (
    <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
      <SectionHeader
        title="Top 10 Suppliers"
        subtitle="Ranked by invoice count · amount outstanding"
      />
      <table className="w-full text-xs mt-1">
        <thead>
          <tr className="border-b-2 border-sap-border">
            <th className="text-left py-2 pr-2 font-semibold text-sap-subtext uppercase tracking-wide w-6">#</th>
            <th className="text-left py-2 pr-4 font-semibold text-sap-subtext uppercase tracking-wide">Supplier</th>
            <th className="text-right py-2 pr-4 font-semibold text-sap-subtext uppercase tracking-wide">Invoices</th>
            <th className="text-right py-2 font-semibold text-sap-subtext uppercase tracking-wide">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s, i) => (
            <tr key={s.name} className={`border-b border-sap-border ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <td className="py-2 pr-2 text-sap-subtext font-mono">{i + 1}</td>
              <td className="py-2 pr-4">
                <div className="font-medium text-sap-text truncate max-w-[180px]" title={s.name}>{s.name}</div>
                {/* Progress bar relative to top supplier */}
                <div className="mt-1 h-1 rounded-full bg-sap-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sap-blue"
                    style={{ width: `${(s.count / maxCount) * 100}%` }}
                  />
                </div>
              </td>
              <td className="py-2 pr-4 text-right font-semibold text-sap-text">{s.count}</td>
              <td className="py-2 text-right font-semibold text-sap-blue">{fmtShort(s.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Detail table columns ──────────────────────────────────────────────────────
const COLUMNS = [
  { label: 'Invoice Number',     col: 'INVOICE_NUM',     align: 'left'  },
  { label: 'Invoice Document No.', col: 'INVOICE_DOC_NUM', align: 'left' },
  { label: 'Venue Name',         col: 'VENUE_NAME',      align: 'left'  },
  { label: 'Supplier Name',      col: 'VENDOR_NAME',     align: 'left'  },
  { label: 'Invoice Date',       col: 'INVOICE_DATE',    align: 'left'  },
  { label: 'Requester',          col: 'REQUESTER',       align: 'left'  },
  { label: 'PO Number',          col: 'PO_NUMBER',       align: 'left'  },
  { label: 'Invoice Total',      col: 'AMOUNT',          align: 'right' },
  { label: 'Invoice Year',       col: 'INVOICE_YEAR',    align: 'left'  },
  { label: 'Age (days)',         col: 'DAYS_OPEN',       align: 'right' },
];

const LS_RESOLVED_KEY = 'blockedInvoices_resolved';

function PendingTable({ data }) {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Resolved state: Set of row keys (INVOICE_DOC_NUM or INVOICE_NUM)
  const [resolved, setResolved] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_RESOLVED_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist resolved set to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LS_RESOLVED_KEY, JSON.stringify([...resolved]));
    } catch {}
  }, [resolved]);

  const toggleResolved = useCallback((key) => {
    setResolved((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const {
    processed, sortCol, sortDir, toggleSort,
    filters, setFilter, clearAll, activeFilterCount,
  } = useSortFilter(data, 'AMOUNT', 'desc');

  const pageData = processed.slice((page - 1) * pageSize, page * pageSize);

  const resolvedCount = data.filter((r) => resolved.has(r.INVOICE_DOC_NUM || r.INVOICE_NUM)).length;

  return (
    <div className="bg-white border border-sap-border rounded-lg shadow-sm p-4">
      <SectionHeader
        title="Invoice Detail"
        subtitle={`${processed.length} of ${data.length} invoice${data.length !== 1 ? 's' : ''}${resolvedCount ? ` · ${resolvedCount} resolved` : ''}${activeFilterCount ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : ''}`}
        action={
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium">
                <X size={12} /> Clear filters
              </button>
            )}
            <ExportButtons
              data={processed}
              filename="pending_receipts_detail"
              columns={COLUMNS.map(({ label, col }) => ({ key: col, label }))}
            />
          </div>
        }
      />
      <div className="overflow-x-auto">
        <div className="max-h-[32rem] overflow-y-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b-2 border-sap-border">
                {/* Resolved column header */}
                <th className="py-2 pr-3 text-center font-semibold text-sap-subtext uppercase tracking-wide whitespace-nowrap">
                  Resolved
                </th>
                {COLUMNS.map(({ label, col, align }) => (
                  <SortFilterHeader
                    key={col} label={label} col={col}
                    sortCol={sortCol} sortDir={sortDir} onSort={toggleSort}
                    filter={filters[col] || ''} onFilter={setFilter} align={align}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="py-6 text-center text-sap-subtext text-xs">
                    No invoices match the current filters.
                  </td>
                </tr>
              )}
              {pageData.map((row, i) => {
                const rowKey = row.INVOICE_DOC_NUM !== '—' ? row.INVOICE_DOC_NUM : row.INVOICE_NUM;
                const isResolved = resolved.has(rowKey);
                return (
                  <tr key={`${rowKey}-${i}`}
                    className={`border-b border-sap-border transition-colors ${
                      isResolved
                        ? 'bg-green-50 opacity-60'
                        : i % 2 === 0 ? 'bg-white hover:bg-sap-gray' : 'bg-gray-50 hover:bg-sap-gray'
                    }`}
                  >
                    {/* Resolved checkbox */}
                    <td className="py-2.5 pr-3 text-center">
                      <input
                        type="checkbox"
                        checked={isResolved}
                        onChange={() => toggleResolved(rowKey)}
                        className="w-4 h-4 rounded border-sap-border text-green-600 cursor-pointer accent-green-600"
                        title={isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
                      />
                    </td>
                    <td className={`py-2.5 pr-4 font-mono font-medium whitespace-nowrap ${isResolved ? 'text-sap-subtext line-through' : 'text-sap-blue'}`}>{row.INVOICE_NUM}</td>
                    <td className={`py-2.5 pr-4 font-mono whitespace-nowrap ${isResolved ? 'text-sap-subtext' : 'text-sap-text'}`}>{row.INVOICE_DOC_NUM}</td>
                    <td className="py-2.5 pr-4 text-sap-text max-w-[130px] truncate" title={row.VENUE_NAME}>{row.VENUE_NAME || '—'}</td>
                    <td className="py-2.5 pr-4 text-sap-text max-w-[160px] truncate" title={row.VENDOR_NAME}>{row.VENDOR_NAME}</td>
                    <td className="py-2.5 pr-4 text-sap-subtext whitespace-nowrap">{row.INVOICE_DATE || '—'}</td>
                    <td className="py-2.5 pr-4 text-sap-text max-w-[120px] truncate" title={row.REQUESTER}>{row.REQUESTER || '—'}</td>
                    <td className="py-2.5 pr-4 font-mono text-sap-text whitespace-nowrap">{row.PO_NUMBER || '—'}</td>
                    <td className="py-2.5 pr-4 font-semibold text-sap-text whitespace-nowrap text-right">{fmtCurrency(row.AMOUNT)}</td>
                    <td className="py-2.5 pr-4 text-sap-subtext whitespace-nowrap">{row.INVOICE_YEAR || '—'}</td>
                    <td className="py-2.5 text-right"><AgingChip days={row.DAYS_OPEN} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination
        total={processed.length}
        page={page}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={(n) => { setPageSize(n); setPage(1); }}
      />
      <p className="mt-2 text-xs text-sap-subtext">
        Click any column header to sort · Click <span className="font-mono bg-sap-gray px-1 rounded">▼</span> to filter · Check <strong>Resolved</strong> to mark an invoice as handled
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Dashboard4({ pendingData, onUpload, onClear, hasUpload }) {
  const kpis = useMemo(() => {
    if (!pendingData?.length) return { totalValue: 0, count: 0, avgDaysOpen: 0 };
    const totalValue  = pendingData.reduce((s, r) => s + (r.AMOUNT || 0), 0);
    const count       = pendingData.length;
    const avgDaysOpen = pendingData.reduce((s, r) => s + (r.DAYS_OPEN || 0), 0) / count;
    return { totalValue, count, avgDaysOpen };
  }, [pendingData]);

  function handleUploadData(rawRows) {
    const { data } = parsePendingReceiptsCSV(rawRows);
    onUpload(data);
  }

  return (
    <div className="space-y-5">
      <FileUpload
        label="Upload Pending Receipts Report"
        expectedColumns={PENDING_RECEIPTS_EXPECTED_COLUMNS}
        onData={handleUploadData}
        onClear={onClear}
        hasData={hasUpload}
      />

      {pendingData?.length > 0 && (
        <>
          {/* KPIs */}
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

          {/* Aging chart + Top suppliers side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <AgingChart data={pendingData} />
            <TopSuppliers data={pendingData} />
          </div>

          {/* Detail table */}
          <PendingTable data={pendingData} />
        </>
      )}
    </div>
  );
}
