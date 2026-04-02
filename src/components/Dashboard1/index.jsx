import { useState } from 'react';
import FileUpload from '../shared/FileUpload';
import ApprovalsKPIs from './ApprovalsKPIs';
import AgingBarChart from './AgingBarChart';
import BottleneckTable from './BottleneckTable';
import ActionList from './ActionList';

export default function Dashboard1({ approvalsData, expectedColumns, onUpload, onClear, hasUpload }) {
  const [parseErrors, setParseErrors]   = useState([]);
  const [selectedApprover, setSelectedApprover] = useState(null);

  function handleUpload(rows) {
    // Pass rows to App; collect parse errors locally via a wrapped call
    // Errors are surfaced by re-importing the parser just for error reporting
    import('../../utils/approvalsParser').then(({ parseApprovalsCSV }) => {
      const { errors } = parseApprovalsCSV(rows);
      setParseErrors(errors);
    });
    onUpload(rows);
    setSelectedApprover(null);
  }

  function handleClear() {
    setParseErrors([]);
    setSelectedApprover(null);
    onClear();
  }

  const filtered = selectedApprover
    ? approvalsData.filter((d) => d.APPROVER_ID === selectedApprover)
    : approvalsData;

  return (
    <div className="space-y-5">
      <FileUpload
        label="Upload Pending Approvals Report (SWI2_FREQ / FBL1N export)"
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

      <ApprovalsKPIs data={approvalsData} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <AgingBarChart data={approvalsData} />
        </div>
        <div className="lg:col-span-3 bg-white rounded-lg border border-sap-border shadow-sm p-5">
          <BottleneckTable
            data={approvalsData}
            selectedApprover={selectedApprover}
            onSelectApprover={setSelectedApprover}
          />
        </div>
      </div>

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
