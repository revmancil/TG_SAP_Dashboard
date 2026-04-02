import { useMemo, useState } from 'react';
import { buildApprovalsDataset } from '../../data/approvals';
import ApprovalsKPIs from './ApprovalsKPIs';
import AgingBarChart from './AgingBarChart';
import BottleneckTable from './BottleneckTable';
import ActionList from './ActionList';

export default function Dashboard1() {
  const data = useMemo(() => buildApprovalsDataset(), []);
  const [selectedApprover, setSelectedApprover] = useState(null);

  const filtered = selectedApprover
    ? data.filter((d) => d.APPROVER_ID === selectedApprover)
    : data;

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <ApprovalsKPIs data={data} />

      {/* Row 2: Aging Chart + Bottleneck Table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <AgingBarChart data={data} />
        </div>
        <div className="lg:col-span-3 bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <BottleneckTable
            data={data}
            selectedApprover={selectedApprover}
            onSelectApprover={setSelectedApprover}
          />
        </div>
      </div>

      {/* Row 3: Action List */}
      <div className="bg-white rounded-lg border border-sap-border shadow-sm p-5">
        <ActionList
          data={filtered}
          selectedApprover={selectedApprover}
          onClear={() => setSelectedApprover(null)}
        />
      </div>
    </div>
  );
}
