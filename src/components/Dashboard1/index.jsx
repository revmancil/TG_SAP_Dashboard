import { useMemo, useState } from 'react';
import { buildApprovalsDataset } from '../../data/approvals';
import { parseApprovalsCSV, APPROVALS_EXPECTED_COLUMNS } from '../../utils/approvalsParser';
import FileUpload from '../shared/FileUpload';
import ApprovalsKPIs from './ApprovalsKPIs';
import AgingBarChart from './AgingBarChart';
import BottleneckTable from './BottleneckTable';
import ActionList from './ActionList';

export default function Dashboard1() {
  const sampleData = useMemo(() => buildApprovalsDataset(), []);
  const [uploadedData, setUploadedData] = useState(null);
  const [parseErrors, setParseErrors] = useState([]);
  const [selectedApprover, setSelectedApprover] = useState(null);

  const data = uploadedData ?? sampleData;

  function handleUpload(rows) {
    const { data: parsed, errors } = parseApprovalsCSV(rows);
    setParseErrors(errors);
    setUploadedData(parsed.length ? parsed : null);
    setSelectedApprover(null);
  }

  function handleClear() {
    setUploadedData(null);
    setParseErrors([]);
    setSelectedApprover(null);
  }

  const filtered = selectedApprover
    ? data.filter((d) => d.APPROVER_ID === selectedApprover)
    : data;

  return (
    <div className="space-y-5">
      {/* Upload Panel */}
      <FileUpload
        label="Upload Pending Approvals Report (SWI2_FREQ / FBL1N export)"
        expectedColumns={APPROVALS_EXPECTED_COLUMNS}
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
