import { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import FileUpload from '../shared/FileUpload';
import SectionHeader from '../shared/SectionHeader';
import KPICard from '../shared/KPICard';
import { TrendingUp, TrendingDown, Hash, DollarSign } from 'lucide-react';

// ── Parser ────────────────────────────────────────────────────────────────────
function norm(obj) {
  const out = {};
  Object.keys(obj).forEach((k) => {
    const key = k.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').toUpperCase().trim();
    const val  = obj[k];
    out[key] = (val === null || val === undefined) ? '' : String(val).replace(/\u00a0/g, ' ').trim();
  });
  return out;
}

function pick(row, ...keys) {
  for (const k of keys) if (row[k] !== undefined && row[k] !== '') return row[k];
  return '';
}

function parseAmt(str) {
  if (!str) return 0;
  let s = String(str).replace(/[$€£¥\s,]/g, '');
  if (/^\(.*\)$/.test(s)) return -(parseFloat(s.slice(1, -1)) || 0);
  return parseFloat(s) || 0;
}

function parseWeeklyRows(rows) {
  const out = [];
  rows.forEach((rawRow) => {
    const row  = norm(rawRow);
    const date = pick(row, 'DATE', 'WEEK', 'WEEK ENDING', 'WEEK OF', 'PERIOD');
    const lines = parseInt(pick(row, '# OF LINES', '# LINES', 'LINES', 'COUNT', '# INVOICES', 'NUMBER OF LINES', 'NUM LINES'), 10);
    const amount = parseAmt(pick(row, '$AMOUNT', 'AMOUNT', '$VALUE', 'VALUE', 'TOTAL AMOUNT', 'DOLLAR AMOUNT'));

    if (!date || (isNaN(lines) && !amount)) return;

    // Format date label: prefer "M/D" style short label
    let label = date;
    const d = new Date(date);
    if (!isNaN(d)) {
      label = `${d.getMonth() + 1}/${d.getDate()}`;
    }

    out.push({ date, label, lines: isNaN(lines) ? 0 : lines, amount });
  });
  return out;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtAmt(n) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtFull(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function changePct(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const lines  = payload.find((p) => p.name === 'Lines')?.value;
  const amount = payload.find((p) => p.name === 'Amount')?.value;
  return (
    <div className="bg-white border border-sap-border rounded shadow-lg p-3 text-xs space-y-1 min-w-[170px]">
      <p className="font-semibold text-sap-text border-b border-sap-border pb-1 mb-1">Week of {label}</p>
      {lines  !== undefined && <div className="flex justify-between gap-4"><span className="text-sap-blue">Lines</span><span className="font-semibold">{lines.toLocaleString()}</span></div>}
      {amount !== undefined && <div className="flex justify-between gap-4"><span className="text-orange-600">Amount</span><span className="font-semibold">{fmtFull(amount)}</span></div>}
    </div>
  );
};

// ── Chart ─────────────────────────────────────────────────────────────────────
function PendingChart({ data }) {
  const maxLines = Math.max(...data.map((d) => d.lines), 1);

  return (
    <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
      <SectionHeader
        title="Weekly Pending Report"
        subtitle="Bars = # of lines (left axis)  ·  Line = $ amount (right axis)"
      />
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 24, right: 64, bottom: 0, left: 8 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#D9DBDD" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#6A6D70' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="lines"
            orientation="left"
            tick={{ fontSize: 11, fill: '#6A6D70' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, Math.ceil(maxLines * 1.3)]}
            label={{ value: '# of Lines', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 10, fill: '#6A6D70' } }}
          />
          <YAxis
            yAxisId="amount"
            orientation="right"
            tick={{ fontSize: 11, fill: '#6A6D70' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtAmt}
            label={{ value: '$ Amount', angle: 90, position: 'insideRight', offset: 16, style: { fontSize: 10, fill: '#6A6D70' } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F6F7' }} />

          <Bar yAxisId="lines" dataKey="lines" name="Lines" maxBarSize={52} radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.lines === Math.max(...data.map((d) => d.lines)) ? '#003B73' : '#0070F2'}
              />
            ))}
          </Bar>

          <Line
            yAxisId="amount"
            type="monotone"
            dataKey="amount"
            name="Amount"
            stroke="#E9730C"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#E9730C', strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Summary footer */}
      <div className="mt-3 flex items-center justify-between text-xs border-t border-sap-border pt-2 text-sap-subtext">
        <span>{data.length} week{data.length !== 1 ? 's' : ''}</span>
        <span className="font-semibold text-sap-text">
          Total: {data.reduce((s, d) => s + d.lines, 0).toLocaleString()} lines · {fmtAmt(data.reduce((s, d) => s + d.amount, 0))}
        </span>
      </div>
    </div>
  );
}

// ── Data Table ────────────────────────────────────────────────────────────────
function WeeklyTable({ data }) {
  return (
    <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
      <SectionHeader title="Weekly Detail" subtitle="All weeks in the uploaded report" />
      <div className="overflow-x-auto">
        <table className="w-full text-xs mt-1">
          <thead>
            <tr className="border-b-2 border-sap-border">
              <th className="text-left py-2 pr-6 font-semibold text-sap-subtext uppercase tracking-wide">Date</th>
              <th className="text-right py-2 pr-6 font-semibold text-sap-subtext uppercase tracking-wide"># of Lines</th>
              <th className="text-right py-2 pr-6 font-semibold text-sap-subtext uppercase tracking-wide">$ Amount</th>
              <th className="text-right py-2 font-semibold text-sap-subtext uppercase tracking-wide">WoW Lines</th>
              <th className="text-right py-2 font-semibold text-sap-subtext uppercase tracking-wide">WoW Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const prev      = i > 0 ? data[i - 1] : null;
              const lineChg   = prev ? row.lines  - prev.lines  : null;
              const amtChg    = prev ? row.amount - prev.amount : null;
              const linesPct  = prev ? changePct(row.lines,  prev.lines)  : null;
              const amtPct    = prev ? changePct(row.amount, prev.amount) : null;
              return (
                <tr key={row.date} className={`border-b border-sap-border ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-2 pr-6 font-medium text-sap-text">{row.date}</td>
                  <td className="py-2 pr-6 text-right font-semibold text-sap-blue">{row.lines.toLocaleString()}</td>
                  <td className="py-2 pr-6 text-right font-semibold text-sap-text">{fmtFull(row.amount)}</td>
                  <td className="py-2 pr-6 text-right">
                    {lineChg !== null && (
                      <span className={lineChg >= 0 ? 'text-red-600' : 'text-green-700'}>
                        {lineChg >= 0 ? '+' : ''}{lineChg} ({linesPct >= 0 ? '+' : ''}{linesPct?.toFixed(1)}%)
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    {amtChg !== null && (
                      <span className={amtChg >= 0 ? 'text-red-600' : 'text-green-700'}>
                        {amtChg >= 0 ? '+' : ''}{fmtAmt(amtChg)} ({amtPct >= 0 ? '+' : ''}{amtPct?.toFixed(1)}%)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-sap-border bg-sap-gray font-semibold">
              <td className="py-2 pr-6 text-xs text-sap-subtext uppercase tracking-wide">Total</td>
              <td className="py-2 pr-6 text-right text-xs text-sap-blue">{data.reduce((s, d) => s + d.lines, 0).toLocaleString()}</td>
              <td className="py-2 pr-6 text-right text-xs text-sap-text">{fmtFull(data.reduce((s, d) => s + d.amount, 0))}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const EXPECTED_COLS = ['Date', '# of Lines', '$Amount'];

export default function Dashboard3() {
  const [weeklyData, setWeeklyData] = useState(null);

  function handleUpload(rows) {
    const parsed = parseWeeklyRows(rows);
    if (parsed.length) setWeeklyData(parsed);
  }

  const kpis = useMemo(() => {
    if (!weeklyData?.length) return null;
    const last = weeklyData[weeklyData.length - 1];
    const prev = weeklyData.length > 1 ? weeklyData[weeklyData.length - 2] : null;
    return {
      latestDate:   last.date,
      latestLines:  last.lines,
      latestAmount: last.amount,
      lineChg:      prev ? last.lines  - prev.lines  : null,
      amtChg:       prev ? last.amount - prev.amount : null,
      linesPct:     prev ? changePct(last.lines,  prev.lines)  : null,
      amtPct:       prev ? changePct(last.amount, prev.amount) : null,
    };
  }, [weeklyData]);

  return (
    <div className="space-y-5">
      <FileUpload
        label="Upload Pending Report Analysis"
        expectedColumns={EXPECTED_COLS}
        onData={handleUpload}
        onClear={() => setWeeklyData(null)}
        hasData={!!weeklyData}
      />

      {!weeklyData ? (
        <div className="bg-white rounded-lg border border-sap-border shadow-sm p-10 text-center text-sap-subtext text-sm">
          <p className="font-semibold text-sap-text mb-1">No trend data yet</p>
          <p>Upload the Pending Report Analysis above (Date · # of Lines · $Amount).</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          {kpis && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KPICard
                title="Latest Week Lines"
                value={kpis.latestLines.toLocaleString()}
                subtitle={kpis.latestDate}
                icon={Hash}
                variant="default"
              />
              <KPICard
                title="Latest Week Amount"
                value={fmtAmt(kpis.latestAmount)}
                subtitle={kpis.latestDate}
                icon={DollarSign}
                variant="default"
              />
              <KPICard
                title="WoW Lines Change"
                value={kpis.lineChg !== null ? `${kpis.lineChg >= 0 ? '+' : ''}${kpis.lineChg}` : '—'}
                subtitle={kpis.linesPct !== null ? `${kpis.linesPct >= 0 ? '+' : ''}${kpis.linesPct.toFixed(1)}% vs prior week` : ''}
                icon={kpis.lineChg >= 0 ? TrendingUp : TrendingDown}
                variant={kpis.lineChg > 0 ? 'critical' : kpis.lineChg < 0 ? 'success' : 'default'}
              />
              <KPICard
                title="WoW Amount Change"
                value={kpis.amtChg !== null ? `${kpis.amtChg >= 0 ? '+' : ''}${fmtAmt(kpis.amtChg)}` : '—'}
                subtitle={kpis.amtPct !== null ? `${kpis.amtPct >= 0 ? '+' : ''}${kpis.amtPct.toFixed(1)}% vs prior week` : ''}
                icon={kpis.amtChg >= 0 ? TrendingUp : TrendingDown}
                variant={kpis.amtChg > 0 ? 'critical' : kpis.amtChg < 0 ? 'success' : 'default'}
              />
            </div>
          )}

          <PendingChart data={weeklyData} />
          <WeeklyTable data={weeklyData} />
        </>
      )}
    </div>
  );
}
