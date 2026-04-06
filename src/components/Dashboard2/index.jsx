import { useState, useMemo } from 'react';
import { FileX, PackageCheck } from 'lucide-react';
import { buildVendorSummary } from '../../data/receipts';
import FileUpload from '../shared/FileUpload';
import KPICard from '../shared/KPICard';
import VendorHeatmap from './VendorHeatmap';
import AgingTrend from './AgingTrend';
import ExceptionsTable from './ExceptionsTable';

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function EmptySection({ label }) {
  return (
    <p className="py-10 text-center text-sap-subtext text-xs">
      Upload the {label} report above to populate this section.
    </p>
  );
}

function ReportSection({ title, subtitle, icon: Icon, accentClass, uploadLabel, expectedColumns, onUpload, onClear, hasData, data, discType, errors }) {
  const vendorSummary = useMemo(() => buildVendorSummary(data), [data]);

  const totalVal = data.reduce((s, d) => s + d.BALANCE_VAL, 0);
  const kpiVariant = data.length > 0 ? (discType === 'IR_WITHOUT_GR' ? 'critical' : 'warning') : 'default';

  return (
    <div className="space-y-4">
      {/* Section heading */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${accentClass}`}>
        <Icon size={18} />
        <div>
          <h2 className="text-sm font-bold">{title}</h2>
          <p className="text-xs opacity-75">{subtitle}</p>
        </div>
      </div>

      {/* Upload */}
      <FileUpload
        label={uploadLabel}
        expectedColumns={expectedColumns}
        onData={onUpload}
        onClear={onClear}
        hasData={hasData}
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

      {!hasData ? <EmptySection label={title} /> : (
        <>
          {/* KPI */}
          <KPICard
            title={discType === 'IR_WITHOUT_GR' ? 'IR without GR — Blocked for Receipt' : 'GR without IR — Unvouchered Liabilities'}
            value={fmt(totalVal)}
            subtitle={`${data.length} line item${data.length !== 1 ? 's' : ''} · ${discType === 'IR_WITHOUT_GR' ? 'Invoice posted, goods not yet received' : 'Goods received, invoice not yet posted'}`}
            icon={Icon}
            variant={kpiVariant}
            badge={data.length}
          />

          {/* Heatmap + Aging side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
              <VendorHeatmap vendors={vendorSummary} discType={discType} />
            </div>
            <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
              <AgingTrend data={data} />
            </div>
          </div>

          {/* Exceptions table */}
          <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
            <ExceptionsTable data={data} />
          </div>
        </>
      )}
    </div>
  );
}

export default function Dashboard2({
  mrbrData, mb5sData,
  onUploadMRBR, onClearMRBR, hasMRBR,
  onUploadMB5S, onClearMB5S, hasMB5S,
}) {
  const [mrbrErrors, setMrbrErrors] = useState([]);
  const [mb5sErrors, setMb5sErrors] = useState([]);

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

  return (
    <div className="space-y-8">
      {/* ── MRBR Section ────────────────────────────────────────────────── */}
      <ReportSection
        title="MRBR — Blocked Invoices"
        subtitle="Invoices posted but goods not yet received (IR without GR)"
        icon={FileX}
        accentClass="bg-orange-50 text-orange-900 border border-orange-200"
        uploadLabel="Upload MRBR Report"
        expectedColumns={['Invoice Document No.', 'Invoicing Party', 'Name', 'Purchasing Document', 'Amount', 'Currency', 'Posting Date']}
        onUpload={handleMRBR}
        onClear={() => { setMrbrErrors([]); onClearMRBR(); }}
        hasData={hasMRBR}
        data={mrbrData}
        discType="IR_WITHOUT_GR"
        errors={mrbrErrors}
      />

      {/* Divider */}
      <div className="border-t-2 border-sap-border" />

      {/* ── MB5S Section ────────────────────────────────────────────────── */}
      <ReportSection
        title="MB5S — GR/IR Balances"
        subtitle="Goods received but invoice not yet posted (GR without IR)"
        icon={PackageCheck}
        accentClass="bg-red-50 text-red-900 border border-red-200"
        uploadLabel="Upload MB5S Report"
        expectedColumns={['Purchasing Document', 'Supplier', 'Quantity Received', 'Invoice Quantity', 'Invoice amount LC', 'Currency']}
        onUpload={handleMB5S}
        onClear={() => { setMb5sErrors([]); onClearMB5S(); }}
        hasData={hasMB5S}
        data={mb5sData}
        discType="GR_WITHOUT_IR"
        errors={mb5sErrors}
      />
    </div>
  );
}
