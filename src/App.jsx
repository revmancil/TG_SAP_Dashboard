import { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, ClipboardCheck, RefreshCw, TrendingUp, FileText } from 'lucide-react';
import { buildApprovalsDataset } from './data/approvals';
import { buildReceiptsDataset } from './data/receipts';
import { parseApprovalsCSV, APPROVALS_EXPECTED_COLUMNS } from './utils/approvalsParser';
import { parseReceiptsCSV } from './utils/receiptsParser';
import { parsePendingReceiptsCSV } from './utils/pendingReceiptsParser';
import Dashboard1 from './components/Dashboard1';
import Dashboard2 from './components/Dashboard2';
import Dashboard3 from './components/Dashboard3';
import Dashboard4 from './components/Dashboard4';

const TABS = [
  { id: 'approvals',         label: 'Pending Approvals',    icon: ClipboardCheck, subtitle: 'SWWUSERWI · RBKP'  },
  { id: 'pending-receipts',  label: 'Pending Receipts',     icon: FileText,       subtitle: 'AP Invoice Report'  },
  { id: 'receipts',          label: 'GR/IR Reconciliation', icon: RefreshCw,      subtitle: 'MRBR · MB5S'        },
  { id: 'trends',            label: 'Weekly Trends',        icon: TrendingUp,     subtitle: 'Approvals & Receipts' },
];

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS_APPROVALS        = 'sap_ap_approvals_v1';
const LS_MRBR             = 'sap_ap_mrbr_v1';
const LS_MB5S             = 'sap_ap_mb5s_v1';
const LS_PENDING_RECEIPTS = 'sap_ap_pending_receipts_v1';

function lsLoad(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function lsSave(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch { /* storage full — fail silently */ }
}
function lsClear(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('approvals');

  // ── State — all initialised from localStorage ────────────────────────────
  const [uploadedApprovals,       setUploadedApprovals]       = useState(() => lsLoad(LS_APPROVALS));
  const [uploadedMRBR,            setUploadedMRBR]            = useState(() => lsLoad(LS_MRBR));
  const [uploadedMB5S,            setUploadedMB5S]            = useState(() => lsLoad(LS_MB5S));
  const [uploadedPendingReceipts, setUploadedPendingReceipts] = useState(() => lsLoad(LS_PENDING_RECEIPTS));

  // Persist to localStorage on every change
  useEffect(() => { uploadedApprovals       ? lsSave(LS_APPROVALS,        uploadedApprovals)       : lsClear(LS_APPROVALS);       }, [uploadedApprovals]);
  useEffect(() => { uploadedMRBR            ? lsSave(LS_MRBR,             uploadedMRBR)            : lsClear(LS_MRBR);            }, [uploadedMRBR]);
  useEffect(() => { uploadedMB5S            ? lsSave(LS_MB5S,             uploadedMB5S)            : lsClear(LS_MB5S);            }, [uploadedMB5S]);
  useEffect(() => { uploadedPendingReceipts ? lsSave(LS_PENDING_RECEIPTS, uploadedPendingReceipts) : lsClear(LS_PENDING_RECEIPTS); }, [uploadedPendingReceipts]);

  // ── Sample / fallback data ───────────────────────────────────────────────
  const sampleApprovals = useMemo(() => buildApprovalsDataset(), []);
  const sampleReceipts  = useMemo(() => buildReceiptsDataset(),  []);

  const approvalsData     = uploadedApprovals ?? sampleApprovals;
  // Combine MRBR + MB5S into one dataset for GR/IR dashboard
  const receiptsData = useMemo(() => {
    const mrbr = uploadedMRBR ?? [];
    const mb5s = uploadedMB5S ?? [];
    const combined = [...mrbr, ...mb5s];
    return combined.length ? combined : sampleReceipts;
  }, [uploadedMRBR, uploadedMB5S, sampleReceipts]);
  const pendingReceiptsData = uploadedPendingReceipts ?? [];

  // ── Upload handlers ──────────────────────────────────────────────────────
  function handleApprovalsUpload(rows) {
    const { data } = parseApprovalsCSV(rows);
    if (data.length) setUploadedApprovals(data);
  }
  function handleMRBRUpload(rows) {
    const { data } = parseReceiptsCSV(rows);
    if (data.length) setUploadedMRBR(data);
  }
  function handleMB5SUpload(rows) {
    const { data } = parseReceiptsCSV(rows);
    if (data.length) setUploadedMB5S(data);
  }
  function handlePendingReceiptsUpload(data) {
    // Dashboard4 already parses and passes data directly
    if (data && data.length) setUploadedPendingReceipts(data);
  }

  const now = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const hasAnyData = uploadedApprovals || uploadedMRBR || uploadedMB5S || uploadedPendingReceipts;

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
          <nav className="flex gap-0 overflow-x-auto" role="tablist">
            {TABS.map((tab) => {
              const Icon   = tab.icon;
              const active = activeTab === tab.id;
              const hasDot = tab.id === 'trends' && hasAnyData;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap
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
        {activeTab === 'pending-receipts' && (
          <Dashboard4
            pendingData={pendingReceiptsData}
            onUpload={handlePendingReceiptsUpload}
            onClear={() => setUploadedPendingReceipts(null)}
            hasUpload={!!uploadedPendingReceipts}
          />
        )}
        {activeTab === 'receipts' && (
          <Dashboard2
            receiptsData={receiptsData}
            onUploadMRBR={handleMRBRUpload}
            onClearMRBR={() => setUploadedMRBR(null)}
            hasMRBR={!!uploadedMRBR}
            onUploadMB5S={handleMB5SUpload}
            onClearMB5S={() => setUploadedMB5S(null)}
            hasMB5S={!!uploadedMB5S}
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
