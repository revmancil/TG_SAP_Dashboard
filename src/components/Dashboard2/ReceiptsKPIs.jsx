import { PackageCheck, FileX } from 'lucide-react';
import KPICard from '../shared/KPICard';

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function ReceiptsKPIs({ data }) {
  const grWithoutIR = data.filter((d) => d.DISCREPANCY_TYPE === 'GR_WITHOUT_IR');
  const irWithoutGR = data.filter((d) => d.DISCREPANCY_TYPE === 'IR_WITHOUT_GR');

  const valGRnoIR = grWithoutIR.reduce((s, d) => s + d.BALANCE_VAL, 0);
  const valIRnoGR = irWithoutGR.reduce((s, d) => s + d.BALANCE_VAL, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <KPICard
        title="GR without IR — Unvouchered Liabilities"
        value={fmt(valGRnoIR)}
        subtitle={`${grWithoutIR.length} line item${grWithoutIR.length !== 1 ? 's' : ''} — goods received, invoice not yet posted  •  Use MB5S`}
        icon={PackageCheck}
        variant={valGRnoIR > 100_000 ? 'warning' : 'default'}
        badge={grWithoutIR.length}
      />
      <KPICard
        title="IR without GR — Blocked for Receipt"
        value={fmt(valIRnoGR)}
        subtitle={`${irWithoutGR.length} line item${irWithoutGR.length !== 1 ? 's' : ''} — invoice posted, goods not yet received  •  Use MRBR`}
        icon={FileX}
        variant={irWithoutGR.length > 0 ? 'critical' : 'success'}
        badge={irWithoutGR.length}
      />
    </div>
  );
}
