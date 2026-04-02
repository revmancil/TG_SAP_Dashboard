import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList,
} from 'recharts';
import SectionHeader from '../shared/SectionHeader';

const BUCKET_COLORS = {
  '0–5 days':  '#0070F2',
  '6–10 days': '#E9730C',
  '10+ days':  '#BB0000',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const { count, value } = payload[0].payload;
  return (
    <div className="bg-white border border-sap-border rounded shadow-lg p-3 text-xs">
      <p className="font-semibold text-sap-text mb-1">{label}</p>
      <p className="text-sap-subtext">{count} invoice{count !== 1 ? 's' : ''}</p>
      <p className="text-sap-blue font-medium">
        ${(value / 1000).toFixed(1)}K total value
      </p>
    </div>
  );
};

export default function AgingBarChart({ data }) {
  const buckets = ['0–5 days', '6–10 days', '10+ days'];
  const chartData = buckets.map((bucket) => {
    const items = data.filter((d) => d.AGING_BUCKET === bucket);
    return {
      bucket,
      count: items.length,
      value: items.reduce((s, d) => s + d.WRBTR, 0),
    };
  });

  return (
    <div>
      <SectionHeader
        title="Aging Distribution"
        subtitle="Invoices by days in workflow"
      />
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D9DBDD" vertical={false} />
          <XAxis
            dataKey="bucket"
            tick={{ fontSize: 11, fill: '#6A6D70' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6A6D70' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#6A6D70' } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F6F7' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={64}>
            {chartData.map((entry) => (
              <Cell key={entry.bucket} fill={BUCKET_COLORS[entry.bucket]} />
            ))}
            <LabelList dataKey="count" position="top" style={{ fontSize: 12, fontWeight: 600, fill: '#32363A' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {buckets.map((b) => (
          <div key={b} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: BUCKET_COLORS[b] }} />
            <span className="text-xs text-sap-subtext">{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
