import { useMemo, useState } from 'react';
import { buildApprovalsWeekly, buildReceiptsWeekly } from '../../utils/weeklyTrends';
import { parseApprovalsWeekly, parseReceiptsWeekly } from '../../utils/weeklyAnalysisParser';
import FileUpload from '../shared/FileUpload';
import ApprovalsWeeklyChart from './ApprovalsWeeklyChart';
import ReceiptsWeeklyChart from './ReceiptsWeeklyChart';
import WeeklyKPIs from './WeeklyKPIs';

const APPROVALS_WEEKLY_COLS = ['Week Ending', 'Week Of', '# Invoices', 'Total Amount', 'Avg Days'];
const RECEIPTS_WEEKLY_COLS  = ['Week Ending', 'Week Of', 'Count', 'Total Amount', '$ Value'];

export default function Dashboard3({ approvalsData, receiptsData }) {
  // Computed from raw data (fallback)
  const computedApprovalsWeekly = useMemo(() => buildApprovalsWeekly(approvalsData), [approvalsData]);
  const computedReceiptsWeekly  = useMemo(() => buildReceiptsWeekly(receiptsData),   [receiptsData]);

  // Uploaded from weekly analysis sheets (preferred)
  const [uploadedApprovalsWeekly, setUploadedApprovalsWeekly] = useState(null);
  const [uploadedReceiptsWeekly,  setUploadedReceiptsWeekly]  = useState(null);

  const approvalsWeekly = uploadedApprovalsWeekly ?? computedApprovalsWeekly;
  const receiptsWeekly  = uploadedReceiptsWeekly  ?? computedReceiptsWeekly;

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
      {/* Upload panels for weekly analysis sheets */}
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

      {/* Source indicator */}
      <div className="flex gap-4 text-xs text-sap-subtext">
        <span>
          Approvals trend: <span className={`font-medium ${uploadedApprovalsWeekly ? 'text-green-600' : 'text-sap-subtext'}`}>
            {uploadedApprovalsWeekly ? 'Uploaded weekly analysis' : 'Computed from raw data'}
          </span>
        </span>
        <span>·</span>
        <span>
          Receipts trend: <span className={`font-medium ${uploadedReceiptsWeekly ? 'text-green-600' : 'text-sap-subtext'}`}>
            {uploadedReceiptsWeekly ? 'Uploaded weekly analysis' : 'Computed from raw data'}
          </span>
        </span>
      </div>

      <WeeklyKPIs approvalsWeekly={approvalsWeekly} receiptsWeekly={receiptsWeekly} />

      {approvalsWeekly.length > 0 && (
        <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <ApprovalsWeeklyChart data={approvalsWeekly} />
        </div>
      )}

      {receiptsWeekly.length > 0 && (
        <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <ReceiptsWeeklyChart data={receiptsWeekly} />
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
