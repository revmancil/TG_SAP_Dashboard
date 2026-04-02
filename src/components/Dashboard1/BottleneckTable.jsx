import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function BarIndicator({ value, max }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-sap-gray rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full bg-sap-blue transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-sap-text w-16 text-right">{fmt(value)}</span>
    </div>
  );
}

export default function BottleneckTable({ data, selectedApprover, onSelectApprover }) {
  const summary = useMemo(() => {
    const map = {};
    data.forEach((d) => {
      if (!map[d.APPROVER_ID]) {
        map[d.APPROVER_ID] = {
          id: d.APPROVER_ID,
          name: d.APPROVER_NAME,
          dept: d.APPROVER_DEPT,
          count: 0,
          totalValue: 0,
          maxDays: 0,
          atRiskCount: 0,
        };
      }
      const a = map[d.APPROVER_ID];
      a.count       += 1;
      a.totalValue  += d.WRBTR;
      a.maxDays      = Math.max(a.maxDays, d.DAYS_IN_WORKFLOW);
      if (d.DISCOUNT_AT_RISK) a.atRiskCount += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count || b.totalValue - a.totalValue);
  }, [data]);

  const maxVal = Math.max(...summary.map((s) => s.totalValue));

  return (
    <div>
      <SectionHeader
        title="Approver Bottleneck Analysis"
        subtitle="Click a row to filter the action list below"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-sap-border">
              <th className="text-left py-2 pr-3 font-semibold text-sap-subtext uppercase tracking-wide">Approver</th>
              <th className="text-center py-2 px-3 font-semibold text-sap-subtext uppercase tracking-wide">Dept</th>
              <th className="text-center py-2 px-3 font-semibold text-sap-subtext uppercase tracking-wide">Pending</th>
              <th className="text-left py-2 px-3 font-semibold text-sap-subtext uppercase tracking-wide w-48">Total Value</th>
              <th className="text-center py-2 px-3 font-semibold text-sap-subtext uppercase tracking-wide">Max Age</th>
              <th className="text-center py-2 pl-3 font-semibold text-sap-subtext uppercase tracking-wide">At Risk</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row, i) => {
              const isSelected = selectedApprover === row.id;
              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectApprover(isSelected ? null : row.id)}
                  className={`border-b border-sap-border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sap-lightblue'
                      : i % 2 === 0 ? 'bg-white hover:bg-sap-gray' : 'bg-gray-50 hover:bg-sap-gray'
                  }`}
                >
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-1.5">
                      <ChevronRight size={12} className={`transition-transform ${isSelected ? 'rotate-90 text-sap-blue' : 'text-sap-border'}`} />
                      <span className="font-medium text-sap-text">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center text-sap-subtext">{row.dept}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-bold ${row.count >= 3 ? 'text-red-600' : row.count >= 2 ? 'text-amber-600' : 'text-sap-text'}`}>
                      {row.count}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <BarIndicator value={row.totalValue} max={maxVal} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-medium ${row.maxDays > 10 ? 'text-red-600' : row.maxDays > 5 ? 'text-amber-600' : 'text-sap-text'}`}>
                      {row.maxDays}d
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-center">
                    {row.atRiskCount > 0
                      ? <span className="text-red-600 font-bold">{row.atRiskCount}</span>
                      : <span className="text-green-600">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
