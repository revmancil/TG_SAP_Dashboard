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
          {p.name}: {p.name === 'Invoice Value' ? fmt(p.value) : p.name === 'Avg Days' ? `${p.value}d` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ApprovalsWeeklyChart({ data }) {
  return (
    <div>
      <SectionHeader
        title="Weekly Approvals Trend"
        subtitle="Invoice count and value pending by week — last 12 weeks"
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
          <YAxis
            yAxisId="days"
            hide
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F6F7' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar yAxisId="count" dataKey="count" name="Invoice Count" fill="#0070F2" opacity={0.85} radius={[3,3,0,0]} maxBarSize={40} />
          <Bar yAxisId="count" dataKey="atRisk" name="At Risk" fill="#BB0000" opacity={0.85} radius={[3,3,0,0]} maxBarSize={40} />
          <Line yAxisId="value" type="monotone" dataKey="value" name="Invoice Value" stroke="#E9730C" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line yAxisId="days" type="monotone" dataKey="avgDays" name="Avg Days" stroke="#6A6D70" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
