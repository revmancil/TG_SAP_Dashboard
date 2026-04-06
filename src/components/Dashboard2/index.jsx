import { useState, useMemo } from 'react';
import { buildVendorSummary } from '../../data/receipts';
import FileUpload from '../shared/FileUpload';
import ReceiptsKPIs from './ReceiptsKPIs';
import VendorHeatmap from './VendorHeatmap';
import AgingTrend from './AgingTrend';
import ExceptionsTable from './ExceptionsTable';

export default function Dashboard2({
  receiptsData,
  onUploadMRBR, onClearMRBR, hasMRBR,
  onUploadMB5S,  onClearMB5S,  hasMB5S,
}) {
  const [mrbrErrors, setMrbrErrors] = useState([]);
  const [mb5sErrors, setMb5sErrors] = useState([]);

  const vendorSummary = useMemo(() => buildVendorSummary(receiptsData), [receiptsData]);

  function handleMRBR(rows) {
    import('../../utils/receiptsParser').then(({ parseReceiptsCSV }) => {
      const { errors } = parseReceiptsCSV(rows);
      setMrbrErrors(errors);
    });
    onUploadMRBR(rows);
  }
  function handleMB5S(rows) {
    import('../../utils/receiptsParser').then(({ parseReceiptsCSV }) => {
      const { errors } = parseReceiptsCSV(rows);
      setMb5sErrors(errors);
    });
    onUploadMB5S(rows);
  }

  const allErrors = [...mrbrErrors, ...mb5sErrors];

  return (
    <div className="space-y-5">
      {/* Two upload panels side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FileUpload
          label="Upload MRBR — Blocked Invoices (IR without GR)"
          expectedColumns={['Invoice Document No.', 'Invoicing Party', 'Name', 'Purchasing Document', 'Amount', 'Currency', 'Posting Date']}
          onData={handleMRBR}
          onClear={() => { setMrbrErrors([]); onClearMRBR(); }}
          hasData={hasMRBR}
        />
        <FileUpload
          label="Upload MB5S — GR/IR Balances (GR without IR)"
          expectedColumns={['Purchasing Document', 'Supplier', 'Quantity Received', 'Invoice Quantity', 'Invoice amount LC', 'Currency']}
          onData={handleMB5S}
          onClear={() => { setMb5sErrors([]); onClearMB5S(); }}
          hasData={hasMB5S}
        />
      </div>

      {allErrors.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">{allErrors.length} row(s) skipped:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {allErrors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
            {allErrors.length > 5 && <li>…and {allErrors.length - 5} more</li>}
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
