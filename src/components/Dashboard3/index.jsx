import { useMemo } from 'react';
import { buildApprovalsWeekly, buildReceiptsWeekly } from '../../utils/weeklyTrends';
import ApprovalsWeeklyChart from './ApprovalsWeeklyChart';
import ReceiptsWeeklyChart from './ReceiptsWeeklyChart';
import WeeklyKPIs from './WeeklyKPIs';

export default function Dashboard3({ approvalsData, receiptsData }) {
  const approvalsWeekly = useMemo(() => buildApprovalsWeekly(approvalsData), [approvalsData]);
  const receiptsWeekly  = useMemo(() => buildReceiptsWeekly(receiptsData),  [receiptsData]);

  const hasApprovals = approvalsWeekly.length > 0;
  const hasReceipts  = receiptsWeekly.length  > 0;

  return (
    <div className="space-y-5">
      <WeeklyKPIs approvalsWeekly={approvalsWeekly} receiptsWeekly={receiptsWeekly} />

      {!hasApprovals && !hasReceipts && (
        <div className="bg-white rounded-lg border border-sap-border shadow-sm p-10 text-center text-sap-subtext text-sm">
          <p className="font-semibold text-sap-text mb-1">No data loaded yet</p>
          <p>Upload your Excel files on the Pending Approvals and GR/IR Reconciliation tabs to populate the weekly trends.</p>
        </div>
      )}

      {hasApprovals && (
        <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <ApprovalsWeeklyChart data={approvalsWeekly} />
        </div>
      )}

      {hasReceipts && (
        <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <ReceiptsWeeklyChart data={receiptsWeekly} />
        </div>
      )}
    </div>
  );
}
