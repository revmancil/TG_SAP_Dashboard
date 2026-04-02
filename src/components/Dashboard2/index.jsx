import { useMemo, useState } from 'react';
import { buildReceiptsDataset, buildVendorSummary } from '../../data/receipts';
import { parseReceiptsCSV, RECEIPTS_EXPECTED_COLUMNS } from '../../utils/receiptsParser';
import FileUpload from '../shared/FileUpload';
import ReceiptsKPIs from './ReceiptsKPIs';
import VendorHeatmap from './VendorHeatmap';
import AgingTrend from './AgingTrend';
import ExceptionsTable from './ExceptionsTable';

export default function Dashboard2() {
  const sampleExceptions = useMemo(() => buildReceiptsDataset(), []);
  const [uploadedData, setUploadedData]   = useState(null);
  const [parseErrors, setParseErrors]     = useState([]);

  const exceptions    = uploadedData ?? sampleExceptions;
  const vendorSummary = useMemo(() => buildVendorSummary(exceptions), [exceptions]);

  function handleUpload(rows) {
    const { data: parsed, errors } = parseReceiptsCSV(rows);
    setParseErrors(errors);
    setUploadedData(parsed.length ? parsed : null);
  }

  function handleClear() {
    setUploadedData(null);
    setParseErrors([]);
  }

  return (
    <div className="space-y-5">
      {/* Upload Panel */}
      <FileUpload
        label="Upload GR/IR Reconciliation Report (MB5S / MRBR export)"
        expectedColumns={RECEIPTS_EXPECTED_COLUMNS}
        onData={handleUpload}
        onClear={handleClear}
        hasData={!!uploadedData}
      />

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">{parseErrors.length} row(s) skipped:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {parseErrors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
            {parseErrors.length > 5 && <li>…and {parseErrors.length - 5} more</li>}
          </ul>
        </div>
      )}

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
