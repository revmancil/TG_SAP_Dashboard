import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LabelList,
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
    <div className="bg-white border border-sap-border rounded shadow-lg p-3 text-xs space-y-1 min-w-[200px]">
      <p className="font-semibold text-sap-text border-b border-sap-border pb-1 mb-1">Week of {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ background: p.color }} />
            <span style={{ color: p.color }}>{p.name}</span>
          </span>
          <span className="font-semibold text-sap-text">
            {p.name.includes('Value') || p.name.includes('$') ? fmtVal(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const BarLabel = ({ x, y, width, value }) => {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 4} textAnchor="middle" fill="#32363A" fontSize={10} fontWeight={600}>
      {value}
    </text>
  );
};

export default function ReceiptsWeeklyChart({ data }) {
  const maxCount = Math.max(...data.map((d) => d.grWithoutIR + d.irWithoutGR), 1);

  return (
    <div>
      <SectionHeader
        title="Weekly Pending Receipts — Open Items & Value"
        subtitle="Bars = open item count by type (left axis)  ·  Line = total outstanding value (right axis)"
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
          {/* Left axis — item count */}
          <YAxis
            yAxisId="count"
            orientation="left"
            tick={{ fontSize: 11, fill: '#6A6D70' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, Math.ceil(maxCount * 1.35)]}
            label={{ value: 'Open Items', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 10, fill: '#6A6D70' } }}
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

          {/* GR w/o IR bars */}
          <Bar yAxisId="count" dataKey="grWithoutIR" name="GR w/o IR" fill="#BB0000" maxBarSize={52} radius={[4,4,0,0]}>
            <LabelList content={<BarLabel />} />
          </Bar>

          {/* IR w/o GR bars */}
          <Bar yAxisId="count" dataKey="irWithoutGR" name="IR w/o GR" fill="#E9730C" maxBarSize={52} radius={[4,4,0,0]}>
            <LabelList content={<BarLabel />} />
          </Bar>

          {/* Total value line */}
          <Line
            yAxisId="value"
            type="monotone"
            dataKey="totalValue"
            name="Total Value ($)"
            stroke="#003B73"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#003B73', strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
