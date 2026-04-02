import { DollarSign, Clock, AlertTriangle } from 'lucide-react';
import KPICard from '../shared/KPICard';

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function ApprovalsKPIs({ data }) {
  const totalValue = data.reduce((s, d) => s + d.WRBTR, 0);
  const avgDays    = data.length
    ? (data.reduce((s, d) => s + d.DAYS_IN_WORKFLOW, 0) / data.length).toFixed(1)
    : 0;
  const atRisk     = data.filter((d) => d.DISCOUNT_AT_RISK);
  const atRiskVal  = atRisk.reduce((s, d) => s + d.DISCOUNT_AMOUNT, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KPICard
        title="Total Invoice Value Pending"
        value={fmt(totalValue)}
        subtitle={`${data.length} invoices awaiting approval`}
        icon={DollarSign}
        variant="default"
      />
      <KPICard
        title="Avg Days in Workflow"
        value={`${avgDays} days`}
        subtitle={`Max: ${Math.max(...data.map(d => d.DAYS_IN_WORKFLOW))} days  •  Target: < 5 days`}
        icon={Clock}
        variant={parseFloat(avgDays) > 7 ? 'warning' : 'default'}
      />
      <KPICard
        title="Discounts at Risk"
        value={fmt(atRiskVal)}
        subtitle={`${atRisk.length} invoice${atRisk.length !== 1 ? 's' : ''} — discount deadline < 5 days`}
        icon={AlertTriangle}
        variant={atRisk.length > 0 ? 'critical' : 'success'}
        badge={atRisk.length > 0 ? atRisk.length : null}
      />
    </div>
  );
}
