import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import KPICard from '../shared/KPICard';

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function trend(curr, prev) {
  if (!prev) return null;
  const pct = ((curr - prev) / prev) * 100;
  return pct.toFixed(1);
}

function TrendBadge({ pct, invertGood = false }) {
  if (pct === null) return null;
  const val = parseFloat(pct);
  const up = val > 0;
  // For some metrics, going up is bad (more pending = worse)
  const isGood = invertGood ? !up : up;
  const color = Math.abs(val) < 1 ? 'text-sap-subtext' : isGood ? 'text-green-600' : 'text-red-600';
  const Icon = Math.abs(val) < 1 ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      <Icon size={12} />{Math.abs(val)}% vs prior week
    </span>
  );
}

export default function WeeklyKPIs({ approvalsWeekly, receiptsWeekly }) {
  const aw  = approvalsWeekly;
  const rw  = receiptsWeekly;
  const aLast  = aw.at(-1);
  const aPrev  = aw.at(-2);
  const rLast  = rw.at(-1);
  const rPrev  = rw.at(-2);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Approvals — This Week"
        value={aLast ? `${aLast.count} invoices` : '—'}
        subtitle={aLast ? <TrendBadge pct={trend(aLast.count, aPrev?.count)} invertGood={true} /> : 'No approval data loaded'}
        variant="default"
      />
      <KPICard
        title="Approvals — Avg Age"
        value={aLast ? `${aLast.avgDays}d` : '—'}
        subtitle={aLast ? <TrendBadge pct={trend(aLast.avgDays, aPrev?.avgDays)} invertGood={true} /> : 'No approval data loaded'}
        variant={aLast?.avgDays > 7 ? 'warning' : 'default'}
      />
      <KPICard
        title="GR/IR Open — This Week"
        value={rLast ? `${rLast.grWithoutIR + rLast.irWithoutGR} items` : '—'}
        subtitle={rLast ? <TrendBadge pct={trend(rLast.grWithoutIR + rLast.irWithoutGR, (rPrev?.grWithoutIR ?? 0) + (rPrev?.irWithoutGR ?? 0))} invertGood={true} /> : 'No receipt data loaded'}
        variant="default"
      />
      <KPICard
        title="GR/IR Open Value — This Week"
        value={rLast ? fmt(rLast.totalValue) : '—'}
        subtitle={rLast ? <TrendBadge pct={trend(rLast.totalValue, rPrev?.totalValue)} invertGood={true} /> : 'No receipt data loaded'}
        variant={rLast?.totalValue > 100_000 ? 'warning' : 'default'}
      />
    </div>
  );
}
