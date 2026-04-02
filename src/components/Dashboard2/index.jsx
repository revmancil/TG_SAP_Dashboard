import { useState, useMemo } from 'react';
import { buildVendorSummary } from '../../data/receipts';
import FileUpload from '../shared/FileUpload';
import ReceiptsKPIs from './ReceiptsKPIs';
import VendorHeatmap from './VendorHeatmap';
import AgingTrend from './AgingTrend';
import ExceptionsTable from './ExceptionsTable';

export default function Dashboard2({ receiptsData, expectedColumns, onUpload, onClear, hasUpload }) {
  const [parseErrors, setParseErrors] = useState([]);

  const vendorSummary = useMemo(() => buildVendorSummary(receiptsData), [receiptsData]);

  function handleUpload(rows) {
    import('../../utils/receiptsParser').then(({ parseReceiptsCSV }) => {
      const { errors } = parseReceiptsCSV(rows);
      setParseErrors(errors);
    });
    onUpload(rows);
  }

  function handleClear() {
    setParseErrors([]);
    onClear();
  }

  return (
    <div className="space-y-5">
      <FileUpload
        label="Upload GR/IR Reconciliation Report (MB5S / MRBR export)"
        expectedColumns={expectedColumns}
        onData={handleUpload}
        onClear={handleClear}
        hasData={hasUpload}
      />

      {parseErrors.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">{parseErrors.length} row(s) skipped:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {parseErrors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
            {parseErrors.length > 5 && <li>…and {parseErrors.length - 5} more</li>}
          </ul>
        </div>
      )}

      <ReceiptsKPIs data={receiptsData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <VendorHeatmap vendors={vendorSummary} />
        </div>
        <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <AgingTrend data={receiptsData} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
        <ExceptionsTable data={receiptsData} />
      </div>
    </div>
  );
}
