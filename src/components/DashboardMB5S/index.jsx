import { useState, useMemo } from 'react';
import { PackageCheck } from 'lucide-react';
import { buildVendorSummary } from '../../data/receipts';
import FileUpload from '../shared/FileUpload';
import KPICard from '../shared/KPICard';
import VendorHeatmap from '../Dashboard2/VendorHeatmap';
import AgingTrend from '../Dashboard2/AgingTrend';
import ExceptionsTable from '../Dashboard2/ExceptionsTable';

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function DashboardMB5S({ mb5sData, onUpload, onClear, hasUpload }) {
  const [errors, setErrors] = useState([]);

  function handleUpload(rows) {
    import('../../utils/receiptsParser').then(({ parseReceiptsCSV }) => {
      const { errors: errs } = parseReceiptsCSV(rows);
      setErrors(errs);
    });
    onUpload(rows);
  }

  const vendorSummary = useMemo(() => buildVendorSummary(mb5sData), [mb5sData]);
  const totalVal = mb5sData.reduce((s, d) => s + d.BALANCE_VAL, 0);

  return (
    <div className="space-y-5">
      {/* Header accent */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 text-red-900 border border-red-200">
        <PackageCheck size={18} />
        <div>
          <h2 className="text-sm font-bold">MB5S — GR/IR Balances</h2>
          <p className="text-xs opacity-75">Goods received but invoice not yet posted (GR without IR)</p>
        </div>
      </div>

      <FileUpload
        label="Upload MB5S Report"
        expectedColumns={['Purchasing Document', 'Supplier', 'Quantity Received', 'Invoice Quantity', 'Invoice amount LC', 'Currency']}
        onData={handleUpload}
        onClear={() => { setErrors([]); onClear(); }}
        hasData={hasUpload}
      />

      {errors.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">{errors.length} row(s) skipped:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
            {errors.length > 5 && <li>…and {errors.length - 5} more</li>}
          </ul>
        </div>
      )}

      {!hasUpload ? (
        <p className="py-10 text-center text-sap-subtext text-xs">
          Upload the MB5S report above to populate this page.
        </p>
      ) : (
        <>
          <KPICard
            title="GR without IR — Unvouchered Liabilities"
            value={fmt(totalVal)}
            subtitle={`${mb5sData.length} line item${mb5sData.length !== 1 ? 's' : ''} · Goods received, invoice not yet posted`}
            icon={PackageCheck}
            variant={totalVal > 100_000 ? 'warning' : 'default'}
            badge={mb5sData.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
              <VendorHeatmap vendors={vendorSummary} discType="GR_WITHOUT_IR" />
            </div>
            <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
              <AgingTrend data={mb5sData} />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
            <ExceptionsTable data={mb5sData} />
          </div>
        </>
      )}
    </div>
  );
}
