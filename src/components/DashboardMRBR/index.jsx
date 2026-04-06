import { useState, useMemo } from 'react';
import { FileX } from 'lucide-react';
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

export default function DashboardMRBR({ mrbrData, onUpload, onClear, hasUpload }) {
  const [errors, setErrors] = useState([]);

  function handleUpload(rows) {
    import('../../utils/receiptsParser').then(({ parseReceiptsCSV }) => {
      const { errors: errs } = parseReceiptsCSV(rows);
      setErrors(errs);
    });
    onUpload(rows);
  }

  const vendorSummary = useMemo(() => buildVendorSummary(mrbrData), [mrbrData]);
  const totalVal = mrbrData.reduce((s, d) => s + d.BALANCE_VAL, 0);

  return (
    <div className="space-y-5">
      {/* Header accent */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-50 text-orange-900 border border-orange-200">
        <FileX size={18} />
        <div>
          <h2 className="text-sm font-bold">MRBR — Blocked Invoices</h2>
          <p className="text-xs opacity-75">Invoices posted but goods not yet received (IR without GR)</p>
        </div>
      </div>

      <FileUpload
        label="Upload MRBR Report"
        expectedColumns={['Invoice Document No.', 'Invoicing Party', 'Name', 'Purchasing Document', 'Amount', 'Currency', 'Posting Date']}
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
          Upload the MRBR report above to populate this page.
        </p>
      ) : (
        <>
          <KPICard
            title="IR without GR — Blocked for Receipt"
            value={fmt(totalVal)}
            subtitle={`${mrbrData.length} line item${mrbrData.length !== 1 ? 's' : ''} · Invoice posted, goods not yet received`}
            icon={FileX}
            variant={mrbrData.length > 0 ? 'critical' : 'default'}
            badge={mrbrData.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
              <VendorHeatmap vendors={vendorSummary} discType="IR_WITHOUT_GR" />
            </div>
            <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
              <AgingTrend data={mrbrData} />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
            <ExceptionsTable data={mrbrData} />
          </div>
        </>
      )}
    </div>
  );
}
