import { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, ClipboardCheck, RefreshCw, TrendingUp } from 'lucide-react';
import { buildApprovalsDataset } from './data/approvals';
import { buildReceiptsDataset } from './data/receipts';
import { parseApprovalsCSV, APPROVALS_EXPECTED_COLUMNS } from './utils/approvalsParser';
import { parseReceiptsCSV, RECEIPTS_EXPECTED_COLUMNS } from './utils/receiptsParser';
import Dashboard1 from './components/Dashboard1';
import Dashboard2 from './components/Dashboard2';
import Dashboard3 from './components/Dashboard3';

const TABS = [
  { id: 'approvals', label: 'Pending Approvals',     icon: ClipboardCheck, subtitle: 'SWWUSERWI · RBKP · USR21' },
  { id: 'receipts',  label: 'GR/IR Reconciliation',  icon: RefreshCw,      subtitle: 'EKKO · EKPO · EKBE'       },
  { id: 'trends',    label: 'Weekly Trends',          icon: TrendingUp,     subtitle: 'Approvals & Receipts'      },
];

const LS_APPROVALS = 'sap_ap_approvals_v1';
const LS_RECEIPTS  = 'sap_ap_receipts_v1';

function lsLoad(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function lsSave(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* storage full — fail silently */ }
}
function lsClear(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('approvals');

  // ── Uploaded data (lifted here so Dashboard3 can access both) ───────────
  // Initialise from localStorage so data survives page refresh / tab close
  const [uploadedApprovals, setUploadedApprovals] = useState(() => lsLoad(LS_APPROVALS));
  const [uploadedReceipts,  setUploadedReceipts]  = useState(() => lsLoad(LS_RECEIPTS));

  // Persist to localStorage whenever data changes
  useEffect(() => {
    if (uploadedApprovals) lsSave(LS_APPROVALS, uploadedApprovals);
    else lsClear(LS_APPROVALS);
  }, [uploadedApprovals]);
  useEffect(() => {
    if (uploadedReceipts) lsSave(LS_RECEIPTS, uploadedReceipts);
    else lsClear(LS_RECEIPTS);
  }, [uploadedReceipts]);

  const sampleApprovals = useMemo(() => buildApprovalsDataset(), []);
  const sampleReceipts  = useMemo(() => buildReceiptsDataset(),  []);

  const approvalsData = uploadedApprovals ?? sampleApprovals;
  const receiptsData  = uploadedReceipts  ?? sampleReceipts;

  function handleApprovalsUpload(rows) {
    const { data } = parseApprovalsCSV(rows);
    if (data.length) setUploadedApprovals(data);
  }
  function handleReceiptsUpload(rows) {
    const { data } = parseReceiptsCSV(rows);
    if (data.length) setUploadedReceipts(data);
  }

  const now = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-sap-gray font-sans">
      {/* Global Header */}
      <header className="bg-sap-darkblue text-white shadow-md">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard size={22} className="text-blue-300 flex-shrink-0" />
            <div>
              <h1 className="text-sm font-bold tracking-wide leading-tight">
                SAP S/4HANA — Accounts Payable Dashboard
              </h1>
              <p className="text-xs text-blue-300 leading-tight">
                Accounts Payable Manager View · Company Code 1000
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-blue-300">Last refreshed</p>
            <p className="text-xs font-medium text-white">{now}</p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-sap-border shadow-sm sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-0" role="tablist">
            {TABS.map((tab) => {
              const Icon   = tab.icon;
              const active = activeTab === tab.id;
              // Show upload indicator dot on trends tab if data is loaded
              const hasDot = tab.id === 'trends' && (uploadedApprovals || uploadedReceipts);
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all
                    focus-visible:outline focus-visible:outline-sap-blue
                    ${active
                      ? 'border-sap-blue text-sap-blue bg-sap-lightblue'
                      : 'border-transparent text-sap-subtext hover:text-sap-text hover:border-sap-border'
                    }
                  `}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  <span className={`hidden sm:inline text-xs font-normal font-mono ml-1 ${active ? 'text-sap-blue' : 'text-sap-subtext'}`}>
                    {tab.subtitle}
                  </span>
                  {hasDot && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-500" title="Data loaded" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dashboard Content */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'approvals' && (
          <Dashboard1
            approvalsData={approvalsData}
            expectedColumns={APPROVALS_EXPECTED_COLUMNS}
            onUpload={handleApprovalsUpload}
            onClear={() => setUploadedApprovals(null)}
            hasUpload={!!uploadedApprovals}
          />
        )}
        {activeTab === 'receipts' && (
          <Dashboard2
            receiptsData={receiptsData}
            expectedColumns={RECEIPTS_EXPECTED_COLUMNS}
            onUpload={handleReceiptsUpload}
            onClear={() => setUploadedReceipts(null)}
            hasUpload={!!uploadedReceipts}
          />
        )}
        {activeTab === 'trends' && (
          <Dashboard3
            approvalsData={approvalsData}
            receiptsData={receiptsData}
          />
        )}
      </main>

      <footer className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 mt-2">
        <p className="text-xs text-sap-subtext text-center">
          Data sourced from SAP S/4HANA · Company Code 1000 · For production use, connect via SAP OData APIs or BW extractors
        </p>
      </footer>
    </div>
  );
}
