import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LabelList, Cell,
} from 'recharts';
import SectionHeader from '../shared/SectionHeader';

function fmtVal(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-sap-border rounded shadow-lg p-3 text-xs space-y-1 min-w-[180px]">
      <p className="font-semibold text-sap-text border-b border-sap-border pb-1 mb-1">Week of {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ background: p.color }} />
            <span style={{ color: p.color }}>{p.name}</span>
          </span>
          <span className="font-semibold text-sap-text">
            {p.name === 'Invoice Value' ? fmtVal(p.value)
              : p.name === 'Avg Days in WF' ? `${p.value}d`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Custom bar label — show count above each bar
const BarLabel = ({ x, y, width, value }) => {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 4} textAnchor="middle" fill="#32363A" fontSize={10} fontWeight={600}>
      {value}
    </text>
  );
};

export default function ApprovalsWeeklyChart({ data, totalCount, totalValue }) {
  const chartCount = data.reduce((s, d) => s + d.count, 0);
  const chartValue = data.reduce((s, d) => s + d.value, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <SectionHeader
        title="Weekly Pending Approvals — Invoice Count & Value"
        subtitle="Bars = invoice count (left axis)  ·  Line = outstanding value (right axis)"
      />
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 24, right: 56, bottom: 0, left: 8 }} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke="#D9DBDD" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#6A6D70' }}
            axisLine={false}
            tickLine={false}
          />
          {/* Left axis — invoice count */}
          <YAxis
            yAxisId="count"
            orientation="left"
            tick={{ fontSize: 11, fill: '#6A6D70' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, Math.ceil(maxCount * 1.3)]}
            label={{ value: 'Invoice Count', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 10, fill: '#6A6D70' } }}
          />
          {/* Right axis — dollar value */}
          <YAxis
            yAxisId="value"
            orientation="right"
            tick={{ fontSize: 11, fill: '#6A6D70' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtVal}
            label={{ value: 'Outstanding Value', angle: 90, position: 'insideRight', offset: 14, style: { fontSize: 10, fill: '#6A6D70' } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F6F7' }} />
          <Legend
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
          />

          {/* Count bars */}
          <Bar yAxisId="count" dataKey="count" name="Invoice Count" fill="#0070F2" maxBarSize={52} radius={[4,4,0,0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.atRisk > 0 ? '#0058C6' : '#0070F2'} />
            ))}
            <LabelList content={<BarLabel />} />
          </Bar>

          {/* At-risk bars stacked behind / overlaid */}
          <Bar yAxisId="count" dataKey="atRisk" name="At Risk" fill="#BB0000" maxBarSize={52} radius={[4,4,0,0]} opacity={0.85}>
            <LabelList content={<BarLabel />} />
          </Bar>

          {/* Value line */}
          <Line
            yAxisId="value"
            type="monotone"
            dataKey="value"
            name="Invoice Value"
            stroke="#E9730C"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#E9730C', strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />

          {/* Avg days — dashed secondary line */}
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="avgDays"
            name="Avg Days in WF"
            stroke="#6A6D70"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Totals footer */}
      <div className="mt-3 flex items-center justify-between text-xs border-t border-sap-border pt-2">
        <span className="text-sap-subtext">
          {data.length} week{data.length !== 1 ? 's' : ''} shown
        </span>
        <span className="font-semibold text-sap-text">
          Total: {chartCount} invoices · {fmtVal(chartValue)}
          {totalCount !== undefined && chartCount !== totalCount && (
            <span className="text-amber-600 font-normal ml-2">
              (dashboard: {totalCount} items · {fmtVal(totalValue)})
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
