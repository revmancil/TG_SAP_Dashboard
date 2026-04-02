import { useMemo } from 'react';
import { buildReceiptsDataset, buildVendorSummary } from '../../data/receipts';
import ReceiptsKPIs from './ReceiptsKPIs';
import VendorHeatmap from './VendorHeatmap';
import AgingTrend from './AgingTrend';
import ExceptionsTable from './ExceptionsTable';

export default function Dashboard2() {
  const exceptions   = useMemo(() => buildReceiptsDataset(), []);
  const vendorSummary = useMemo(() => buildVendorSummary(exceptions), [exceptions]);

  return (
    <div className="space-y-5">
      <ReceiptsKPIs data={exceptions} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <VendorHeatmap vendors={vendorSummary} />
        </div>
        <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <AgingTrend data={exceptions} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
        <ExceptionsTable data={exceptions} />
      </div>
    </div>
  );
}
