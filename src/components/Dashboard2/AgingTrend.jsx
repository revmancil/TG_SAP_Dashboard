import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import SectionHeader from '../shared/SectionHeader';

const BUCKETS = [
  { label: '0–10d',  min: 0,  max: 10  },
  { label: '11–20d', min: 11, max: 20  },
  { label: '21–30d', min: 21, max: 30  },
  { label: '31–45d', min: 31, max: 45  },
  { label: '45+d',   min: 46, max: Infinity },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-sap-border rounded shadow-lg p-3 text-xs">
      <p className="font-semibold text-sap-text mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function AgingTrend({ data }) {
  const chartData = BUCKETS.map(({ label, min, max }) => {
    const gr = data.filter(
      (d) => d.DISCREPANCY_TYPE === 'GR_WITHOUT_IR' && d.DAYS_OPEN >= min && d.DAYS_OPEN <= max
    ).length;
    const ir = data.filter(
      (d) => d.DISCREPANCY_TYPE === 'IR_WITHOUT_GR' && d.DAYS_OPEN >= min && d.DAYS_OPEN <= max
    ).length;
    return { bucket: label, 'GR w/o IR': gr, 'IR w/o GR': ir };
  });

  return (
    <div>
      <SectionHeader
        title="Open Discrepancy Aging Trend"
        subtitle="Number of open items by age bucket"
      />
      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
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
            width={24}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          <ReferenceLine y={0} stroke="#D9DBDD" />
          <Line
            type="monotone"
            dataKey="GR w/o IR"
            stroke="#BB0000"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#BB0000' }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="IR w/o GR"
            stroke="#E9730C"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#E9730C' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
