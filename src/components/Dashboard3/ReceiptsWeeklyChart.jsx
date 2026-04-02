import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import SectionHeader from '../shared/SectionHeader';

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-sap-border rounded shadow-lg p-3 text-xs space-y-1">
      <p className="font-semibold text-sap-text border-b border-sap-border pb-1 mb-1">Week of {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name.includes('Value') ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ReceiptsWeeklyChart({ data }) {
  return (
    <div>
      <SectionHeader
        title="Weekly GR/IR Discrepancy Trend"
        subtitle="Open GR without IR and IR without GR items by week — last 12 weeks"
      />
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 8, right: 24, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D9DBDD" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6A6D70' }} axisLine={false} tickLine={false} />
          <YAxis
            yAxisId="count"
            orientation="left"
            tick={{ fontSize: 11, fill: '#6A6D70' }}
            axisLine={false} tickLine={false}
            allowDecimals={false}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 4, style: { fontSize: 10, fill: '#6A6D70' } }}
          />
          <YAxis
            yAxisId="value"
            orientation="right"
            tick={{ fontSize: 11, fill: '#6A6D70' }}
            axisLine={false} tickLine={false}
            tickFormatter={(v) => fmt(v)}
            label={{ value: 'Value', angle: 90, position: 'insideRight', offset: 8, style: { fontSize: 10, fill: '#6A6D70' } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F6F7' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar yAxisId="count" dataKey="grWithoutIR" name="GR w/o IR" fill="#BB0000" opacity={0.85} radius={[3,3,0,0]} maxBarSize={40} />
          <Bar yAxisId="count" dataKey="irWithoutGR" name="IR w/o GR" fill="#E9730C" opacity={0.85} radius={[3,3,0,0]} maxBarSize={40} />
          <Line yAxisId="value" type="monotone" dataKey="grValue"    name="GR Value"    stroke="#BB0000" strokeWidth={2} strokeDasharray="4 3" dot={false} />
          <Line yAxisId="value" type="monotone" dataKey="irValue"    name="IR Value"    stroke="#E9730C" strokeWidth={2} strokeDasharray="4 3" dot={false} />
          <Line yAxisId="value" type="monotone" dataKey="totalValue" name="Total Value" stroke="#003B73" strokeWidth={2.5} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
