import { useState, useMemo } from 'react';
import { DollarSign, AlertTriangle, Clock, X, Info } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import FileUpload from '../shared/FileUpload';
import KPICard from '../shared/KPICard';
import SectionHeader from '../shared/SectionHeader';
import SortFilterHeader from '../shared/SortFilterHeader';
import SapBadge from '../shared/SapBadge';
import Pagination from '../shared/Pagination';
import ExportButtons from '../shared/ExportButtons';
import { useSortFilter } from '../../hooks/useSortFilter';
import {
  parseAPAgingCSV,
  AP_AGING_EXPECTED_COLUMNS,
  AGING_BUCKETS,
} from '../../utils/apAgingParser';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtCurrency(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}
function fmtShort(n) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

const BUCKET_COLORS = {
  AMT_NOT_DUE:   '#2E7D32',
  AMT_1_30:      '#0070F2',
  AMT_31_60:     '#E9730C',
  AMT_61_90:     '#BB0000',
  AMT_91_120:    '#8B0000',
  AMT_ABOVE_120: '#4A0000',
};

// ── Aging Distribution Bar Chart ──────────────────────────────────────────────
function AgingChart({ data }) {
  const chartData = AGING_BUCKETS.map(({ key, label }) => ({
    label,
    amount: Math.abs(data.reduce((s, r) => s + (r[key] || 0), 0)),
    color: BUCKET_COLORS[key],
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-sap-border rounded shadow-lg p-3 text-xs">
        <p className="font-semibold text-sap-text mb-1">{label}</p>
        <p className="text-sap-blue font-medium">{fmtShort(payload[0].value)}</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
      <SectionHeader title="Aging Distribution" subtitle="Total balance by aging bucket" />
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={chartData} margin={{ top: 20, right: 16, bottom: 0, left: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#D9DBDD" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6A6D70' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => fmtShort(v)} tick={{ fontSize: 10, fill: '#6A6D70' }} axisLine={false} tickLine={false} width={52} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-3">
        {chartData.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
            <span className="text-xs text-sap-subtext">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Top Vendors by Past Due ───────────────────────────────────────────────────
function TopVendors({ data }) {
  const vendors = useMemo(() => {
    const map = {};
    data.forEach((r) => {
      const key = r.VENDOR_NAME || r.VENDOR_KEY || 'Unknown';
      if (!map[key]) map[key] = { name: key, totalDue: 0, totalBalance: 0, count: 0 };
      map[key].totalDue     += r.TOTAL_DUE     || 0;
      map[key].totalBalance += r.TOTAL_BALANCE || 0;
      map[key].count        += 1;
    });
    return Object.values(map)
      .filter((v) => Math.abs(v.totalBalance) > 0.01)
      .sort((a, b) => Math.abs(b.totalBalance) - Math.abs(a.totalBalance))
      .slice(0, 15);
  }, [data]);

  const maxBalance = Math.abs(vendors[0]?.totalBalance || 1);

  if (vendors.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
      <SectionHeader title="Top 15 Vendors by Past Due" subtitle="Ranked by total past-due amount" />
      <table className="w-full text-xs mt-1">
        <thead>
          <tr className="border-b-2 border-sap-border">
            <th className="text-left py-2 pr-2 w-6 font-semibold text-sap-subtext uppercase tracking-wide">#</th>
            <th className="text-left py-2 pr-4 font-semibold text-sap-subtext uppercase tracking-wide">Vendor</th>
            <th className="text-right py-2 pr-4 font-semibold text-sap-subtext uppercase tracking-wide">Invoices</th>
            <th className="text-right py-2 font-semibold text-red-700 uppercase tracking-wide">AP Balance</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v, i) => (
            <tr key={v.name} className={`border-b border-sap-border ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <td className="py-2 pr-2 text-sap-subtext font-mono">{i + 1}</td>
              <td className="py-2 pr-4">
                <div className="font-medium text-sap-text truncate max-w-[200px]" title={v.name}>{v.name}</div>
                <div className="mt-1 h-1 rounded-full bg-sap-border overflow-hidden">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${(Math.abs(v.totalBalance) / maxBalance) * 100}%` }} />
                </div>
              </td>
              <td className="py-2 pr-4 text-right text-sap-subtext">{v.count}</td>
              <td className="py-2 text-right font-semibold text-red-600">{fmtShort(Math.abs(v.totalBalance))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Detail Table ──────────────────────────────────────────────────────────────
const COLUMNS = [
  { label: 'Doc Number',    col: 'DOC_NUMBER',    align: 'left'  },
  { label: 'Vendor',        col: 'VENDOR_NAME',   align: 'left'  },
  { label: 'Doc Type',      col: 'DOC_TYPE',      align: 'left'  },
  { label: 'Doc Date',      col: 'DOC_DATE',      align: 'left'  },
  { label: 'Posting Date',  col: 'POSTING_DATE',  align: 'left'  },
  { label: 'Reference',     col: 'REF_DOC',       align: 'left'  },
  { label: 'Total Balance', col: 'TOTAL_BALANCE', align: 'right' },
  { label: 'Not Due',       col: 'AMT_NOT_DUE',   align: 'right' },
  { label: '1–30d',         col: 'AMT_1_30',      align: 'right' },
  { label: '31–60d',        col: 'AMT_31_60',     align: 'right' },
  { label: '61–90d',        col: 'AMT_61_90',     align: 'right' },
  { label: '91–120d',       col: 'AMT_91_120',    align: 'right' },
  { label: '120+ Days',     col: 'AMT_ABOVE_120', align: 'right' },
  { label: 'Total Due',     col: 'TOTAL_DUE',     align: 'right' },
];

function AmtCell({ value }) {
  if (value === undefined || value === null || Math.abs(value) < 0.01) return <span className="text-sap-subtext">—</span>;
  // Negative = credit = Topgolf owes vendor (red); Positive = debit = vendor owes Topgolf (green)
  return <span className={value < 0 ? 'text-red-700' : 'text-green-700'}>{fmtCurrency(value)}</span>;
}

function PastDueCell({ value }) {
  if (value === undefined || value === null || Math.abs(value) < 0.01) return <span className="text-sap-subtext">—</span>;
  return <span className={`font-semibold ${value < 0 ? 'text-red-600' : 'text-green-700'}`}>{fmtCurrency(value)}</span>;
}

function DetailTable({ data }) {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { processed, sortCol, sortDir, toggleSort, filters, setFilter, clearAll, activeFilterCount } =
    useSortFilter(data, 'TOTAL_BALANCE', 'asc');

  const pageData = processed.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white border border-sap-border rounded-lg shadow-sm p-4">
      <SectionHeader
        title="AP Aging Detail"
        subtitle={`${processed.length} of ${data.length} document${data.length !== 1 ? 's' : ''}${activeFilterCount ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : ''}`}
        action={
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium">
                <X size={12} /> Clear filters
              </button>
            )}
            <ExportButtons
              data={processed}
              filename="ap_aging_detail"
              columns={COLUMNS.map(({ label, col }) => ({ key: col, label }))}
            />
          </div>
        }
      />
      <div className="overflow-x-auto">
        <div className="max-h-[36rem] overflow-y-auto">
          <table className="w-full text-xs min-w-[1100px]">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b-2 border-sap-border">
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
                  <td colSpan={COLUMNS.length} className="py-8 text-center text-sap-subtext text-xs">
                    No documents match the current filters.
                  </td>
                </tr>
              )}
              {pageData.map((row, i) => (
                <tr
                  key={`${row.DOC_NUMBER}-${i}`}
                  className={`border-b border-sap-border transition-colors ${
                    row.TOTAL_DUE < 0
                      ? i % 2 === 0 ? 'bg-red-50 hover:bg-red-100' : 'bg-red-50/60 hover:bg-red-100'
                      : i % 2 === 0 ? 'bg-white hover:bg-sap-gray'  : 'bg-gray-50 hover:bg-sap-gray'
                  }`}
                >
                  <td className="py-2.5 pr-3 font-mono font-medium text-sap-blue whitespace-nowrap">{row.DOC_NUMBER}</td>
                  <td className="py-2.5 pr-3 max-w-[160px] truncate font-medium text-sap-text" title={row.VENDOR_NAME}>{row.VENDOR_NAME}</td>
                  <td className="py-2.5 pr-3 text-sap-subtext">{row.DOC_TYPE}</td>
                  <td className="py-2.5 pr-3 text-sap-subtext whitespace-nowrap">{row.DOC_DATE || '—'}</td>
                  <td className="py-2.5 pr-3 text-sap-subtext whitespace-nowrap">{row.POSTING_DATE || '—'}</td>
                  <td className="py-2.5 pr-3 text-sap-subtext font-mono whitespace-nowrap">{row.REF_DOC !== '—' ? row.REF_DOC : '—'}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold text-sap-text whitespace-nowrap"><AmtCell value={row.TOTAL_BALANCE} /></td>
                  <td className="py-2.5 pr-3 text-right whitespace-nowrap"><AmtCell value={row.AMT_NOT_DUE} /></td>
                  <td className="py-2.5 pr-3 text-right whitespace-nowrap"><AmtCell value={row.AMT_1_30} /></td>
                  <td className="py-2.5 pr-3 text-right whitespace-nowrap"><AmtCell value={row.AMT_31_60} /></td>
                  <td className="py-2.5 pr-3 text-right whitespace-nowrap"><AmtCell value={row.AMT_61_90} /></td>
                  <td className="py-2.5 pr-3 text-right whitespace-nowrap"><AmtCell value={row.AMT_91_120} /></td>
                  <td className="py-2.5 pr-3 text-right whitespace-nowrap"><AmtCell value={row.AMT_ABOVE_120} /></td>
                  <td className="py-2.5 text-right whitespace-nowrap"><PastDueCell value={row.TOTAL_DUE} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-sap-border bg-sap-gray font-semibold">
                <td colSpan={6} className="py-2 pr-3 text-right text-xs text-sap-subtext uppercase tracking-wide">
                  Totals ({processed.length} docs)
                </td>
                {['TOTAL_BALANCE','AMT_NOT_DUE','AMT_1_30','AMT_31_60','AMT_61_90','AMT_91_120','AMT_ABOVE_120','TOTAL_DUE'].map((k) => (
                  <td key={k} className="py-2 pr-3 text-right text-xs text-sap-text whitespace-nowrap">
                    {fmtShort(processed.reduce((s, r) => s + (r[k] || 0), 0))}
                  </td>
                ))}
              </tr>
            </tfoot>
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
        Click any column header to sort · Click <span className="font-mono bg-sap-gray px-1 rounded">▼</span> to filter · Past-due rows highlighted in red
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DashboardAPAging({ agingData, onUpload, onClear, hasUpload }) {
  const [parseInfo, setParseInfo] = useState(null);

  const kpis = useMemo(() => {
    if (!agingData?.length) return null;
    // AP amounts are credits (negative) = Topgolf owes vendor.
    // Sum actual values, then take abs for display magnitude.
    const sumAbs = (key) => Math.abs(agingData.reduce((s, r) => s + (r[key] || 0), 0));
    return {
      totalBalance: Math.abs(agingData.reduce((s, r) => s + (r.TOTAL_BALANCE || 0), 0)),
      notDue:       sumAbs('AMT_NOT_DUE'),
      due1_30:      sumAbs('AMT_1_30'),
      due31_60:     sumAbs('AMT_31_60'),
      due61_90:     sumAbs('AMT_61_90'),
      due91_120:    sumAbs('AMT_91_120'),
      above120:     sumAbs('AMT_ABOVE_120'),
      totalDue:     Math.abs(agingData.reduce((s, r) => s + (r.TOTAL_DUE || 0), 0)),
      docCount:     agingData.length,
    };
  }, [agingData]);

  function handleUpload(rows) {
    setParseInfo(null);
    const { data, errors } = parseAPAgingCSV(rows);
    if (data.length) {
      onUpload(data);
    } else {
      // Show diagnostic so we can see what columns the file actually has
      const detectedCols = rows.length > 0
        ? Object.keys(rows[0]).map((k) => k.replace(/\u00a0/g, ' ').trim()).join(' | ')
        : 'No rows found';
      setParseInfo({
        totalRows: rows.length,
        detectedCols,
        sampleErrors: errors.slice(0, 3),
      });
    }
  }

  return (
    <div className="space-y-5">
      {/* Header accent */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
        <DollarSign size={18} />
        <div>
          <h2 className="text-sm font-bold">AP Aging Report</h2>
          <p className="text-xs opacity-75">Accounts payable balance breakdown by aging bucket</p>
        </div>
      </div>

      <FileUpload
        label="Upload AP Aging Report"
        expectedColumns={AP_AGING_EXPECTED_COLUMNS}
        onData={handleUpload}
        onClear={onClear}
        hasData={hasUpload}
      />

      {parseInfo && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold">
            <Info size={13} />
            Parser could not match columns — {parseInfo.totalRows} rows received but 0 parsed.
          </div>
          <div>
            <span className="font-semibold">Detected column names:</span>
            <div className="mt-1 font-mono bg-white border border-amber-200 rounded p-2 break-all leading-5">
              {parseInfo.detectedCols}
            </div>
          </div>
          {parseInfo.sampleErrors.length > 0 && (
            <div>
              <span className="font-semibold">Sample errors:</span>
              <ul className="list-disc ml-4 mt-0.5">
                {parseInfo.sampleErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
          <p className="text-amber-700">Copy the detected column names above and share them so the parser can be updated to match your SAP export.</p>
        </div>
      )}

      {!hasUpload ? (
        <p className="py-10 text-center text-sap-subtext text-xs">
          Upload the AP Aging report above to populate this page.
        </p>
      ) : kpis && (
        <>
          {/* KPI row 1: summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KPICard
              title="Total AP Balance"
              value={fmtShort(kpis.totalBalance)}
              subtitle={`${kpis.docCount.toLocaleString()} documents`}
              icon={DollarSign}
              variant="default"
            />
            <KPICard
              title="Total Past Due"
              value={fmtShort(kpis.totalDue)}
              subtitle="All overdue buckets combined"
              icon={AlertTriangle}
              variant={kpis.totalDue > 0 ? 'critical' : 'success'}
            />
            <KPICard
              title="Not Yet Due"
              value={fmtShort(kpis.notDue)}
              subtitle="Current — within payment terms"
              icon={Clock}
              variant="success"
            />
            <KPICard
              title="120+ Days"
              value={fmtShort(kpis.above120)}
              subtitle="Oldest overdue bucket"
              icon={AlertTriangle}
              variant={kpis.above120 > 0 ? 'critical' : 'default'}
            />
          </div>

          {/* KPI row 2: individual buckets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '1–30 Days',   value: kpis.due1_30,   color: 'bg-blue-50  border-blue-200  text-blue-900'   },
              { label: '31–60 Days',  value: kpis.due31_60,  color: 'bg-orange-50 border-orange-200 text-orange-900' },
              { label: '61–90 Days',  value: kpis.due61_90,  color: 'bg-red-50   border-red-200    text-red-900'    },
              { label: '91–120 Days', value: kpis.due91_120, color: 'bg-red-100  border-red-300    text-red-900'    },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-lg border-2 p-4 shadow-sm ${color}`}>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
                <p className="text-xl font-bold mt-1">{fmtShort(value)}</p>
              </div>
            ))}
          </div>

          {/* Charts side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <AgingChart data={agingData} />
            <TopVendors data={agingData} />
          </div>

          {/* Detail table */}
          <DetailTable data={agingData} />
        </>
      )}
    </div>
  );
}
