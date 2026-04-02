import { useMemo, useState } from 'react';
import { buildApprovalsWeekly, buildReceiptsWeekly } from '../../utils/weeklyTrends';
import { parseApprovalsWeekly, parseReceiptsWeekly } from '../../utils/weeklyAnalysisParser';
import FileUpload from '../shared/FileUpload';
import ApprovalsWeeklyChart from './ApprovalsWeeklyChart';
import ReceiptsWeeklyChart from './ReceiptsWeeklyChart';
import WeeklyKPIs from './WeeklyKPIs';

const APPROVALS_WEEKLY_COLS = ['Week Ending', 'Week Of', '# Invoices', 'Total Amount', 'Avg Days'];
const RECEIPTS_WEEKLY_COLS  = ['Week Ending', 'Week Of', 'Count', 'Total Amount', '$ Value'];

function fmtVal(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function ReconciliationBanner({ chartTotal, chartValue, dashTotal, dashValue, label }) {
  const countMatch = chartTotal === dashTotal;
  const valueMatch = Math.abs(chartValue - dashValue) < 1;
  if (countMatch && valueMatch) return null;
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-4 py-2.5 text-xs text-amber-800">
      <span className="font-bold mt-0.5">⚠</span>
      <div>
        <span className="font-semibold">{label} — totals differ from detail dashboard. </span>
        Chart bars total: <span className="font-semibold">{chartTotal} items / {fmtVal(chartValue)}</span>
        {' '}vs detail dashboard: <span className="font-semibold">{dashTotal} items / {fmtVal(dashValue)}</span>.
        {' '}The weekly analysis sheet may include weeks with different item counts than what is currently open in the detail dashboard.
      </div>
    </div>
  );
}

export default function Dashboard3({ approvalsData, receiptsData }) {
  // Computed from raw data — returns { weekly, totalCount, totalValue }
  const computedApprovals = useMemo(() => buildApprovalsWeekly(approvalsData), [approvalsData]);
  const computedReceipts  = useMemo(() => buildReceiptsWeekly(receiptsData),   [receiptsData]);

  const [uploadedApprovalsWeekly, setUploadedApprovalsWeekly] = useState(null);
  const [uploadedReceiptsWeekly,  setUploadedReceiptsWeekly]  = useState(null);

  const approvalsWeekly = uploadedApprovalsWeekly ?? computedApprovals.weekly;
  const receiptsWeekly  = uploadedReceiptsWeekly  ?? computedReceipts.weekly;

  // Chart bar totals for reconciliation check
  const approvalsChartCount = approvalsWeekly.reduce((s, w) => s + w.count, 0);
  const approvalsChartValue = approvalsWeekly.reduce((s, w) => s + w.value, 0);
  const receiptsChartCount  = receiptsWeekly.reduce((s, w) => s + (w.grWithoutIR + w.irWithoutGR), 0);
  const receiptsChartValue  = receiptsWeekly.reduce((s, w) => s + w.totalValue, 0);

  function handleApprovalsWeeklyUpload(rows) {
    const parsed = parseApprovalsWeekly(rows);
    if (parsed.length) setUploadedApprovalsWeekly(parsed);
  }
  function handleReceiptsWeeklyUpload(rows) {
    const parsed = parseReceiptsWeekly(rows);
    if (parsed.length) setUploadedReceiptsWeekly(parsed);
  }

  return (
    <div className="space-y-5">
      {/* Upload panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FileUpload
          label="Upload Approvals Weekly Analysis Sheet"
          expectedColumns={APPROVALS_WEEKLY_COLS}
          onData={handleApprovalsWeeklyUpload}
          onClear={() => setUploadedApprovalsWeekly(null)}
          hasData={!!uploadedApprovalsWeekly}
        />
        <FileUpload
          label="Upload Receipts Weekly Analysis Sheet"
          expectedColumns={RECEIPTS_WEEKLY_COLS}
          onData={handleReceiptsWeeklyUpload}
          onClear={() => setUploadedReceiptsWeekly(null)}
          hasData={!!uploadedReceiptsWeekly}
        />
      </div>

      {/* Source + reconciliation */}
      <div className="flex gap-4 text-xs text-sap-subtext flex-wrap">
        <span>Approvals trend:&nbsp;
          <span className={`font-medium ${uploadedApprovalsWeekly ? 'text-green-600' : 'text-sap-subtext'}`}>
            {uploadedApprovalsWeekly ? 'Uploaded weekly analysis' : 'Computed from raw data'}
          </span>
        </span>
        <span>·</span>
        <span>Receipts trend:&nbsp;
          <span className={`font-medium ${uploadedReceiptsWeekly ? 'text-green-600' : 'text-sap-subtext'}`}>
            {uploadedReceiptsWeekly ? 'Uploaded weekly analysis' : 'Computed from raw data'}
          </span>
        </span>
      </div>

      <ReconciliationBanner
        label="Pending Approvals"
        chartTotal={approvalsChartCount}
        chartValue={approvalsChartValue}
        dashTotal={computedApprovals.totalCount}
        dashValue={computedApprovals.totalValue}
      />
      <ReconciliationBanner
        label="Pending Receipts"
        chartTotal={receiptsChartCount}
        chartValue={receiptsChartValue}
        dashTotal={computedReceipts.totalCount}
        dashValue={computedReceipts.totalValue}
      />

      <WeeklyKPIs approvalsWeekly={approvalsWeekly} receiptsWeekly={receiptsWeekly} />

      {approvalsWeekly.length > 0 && (
        <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <ApprovalsWeeklyChart
            data={approvalsWeekly}
            totalCount={computedApprovals.totalCount}
            totalValue={computedApprovals.totalValue}
          />
        </div>
      )}

      {receiptsWeekly.length > 0 && (
        <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <ReceiptsWeeklyChart
            data={receiptsWeekly}
            totalCount={computedReceipts.totalCount}
            totalValue={computedReceipts.totalValue}
          />
        </div>
      )}

      {approvalsWeekly.length === 0 && receiptsWeekly.length === 0 && (
        <div className="bg-white rounded-lg border border-sap-border shadow-sm p-10 text-center text-sap-subtext text-sm">
          <p className="font-semibold text-sap-text mb-1">No trend data available</p>
          <p>Upload the weekly analysis sheets above, or upload raw data on the other tabs to auto-compute trends.</p>
        </div>
      )}
    </div>
  );
}
