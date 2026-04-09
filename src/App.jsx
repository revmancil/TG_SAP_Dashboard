import { useState, useMemo, useEffect, useRef } from 'react';
import { ClipboardCheck, FileX, PackageCheck, TrendingUp, FileText, BarChart2 } from 'lucide-react';
import topgolfLogo from './assets/topgolf-logo.png';
import { buildApprovalsDataset } from './data/approvals';
import { buildReceiptsDataset } from './data/receipts';
import { parseApprovalsCSV, APPROVALS_EXPECTED_COLUMNS } from './utils/approvalsParser';
import { parseReceiptsCSV } from './utils/receiptsParser';
import { parsePendingReceiptsCSV } from './utils/pendingReceiptsParser';
import { idbLoad } from './utils/idbStorage';
import { DS, loadDataset, saveDataset, deleteDataset, subscribeDataset } from './utils/dataService';
import Dashboard1 from './components/Dashboard1';
import Dashboard3 from './components/Dashboard3';
import Dashboard4 from './components/Dashboard4';
import DashboardMRBR from './components/DashboardMRBR';
import DashboardMB5S from './components/DashboardMB5S';
import DashboardAPAging from './components/DashboardAPAging';

const TABS = [
  { id: 'approvals',        label: 'Pending Approvals',  icon: ClipboardCheck, subtitle: 'SWWUSERWI · RBKP'    },
  { id: 'pending-receipts', label: 'Pending Receipts',   icon: FileText,       subtitle: 'AP Invoice Report'    },
  { id: 'mrbr',             label: 'Blocked Invoices',   icon: FileX,          subtitle: 'MRBR · IR w/o GR'    },
  { id: 'mb5s',             label: 'GR/IR Balances',     icon: PackageCheck,   subtitle: 'MB5S · GR w/o IR'    },
  { id: 'ap-aging',         label: 'AP Aging',           icon: BarChart2,      subtitle: 'Aging Buckets'        },
  { id: 'trends',           label: 'Weekly Trends',      icon: TrendingUp,     subtitle: 'Approvals & Receipts' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('approvals');
  const [loading, setLoading]     = useState(true);

  const [uploadedApprovals,       setUploadedApprovals]       = useState(null);
  const [uploadedMRBR,            setUploadedMRBR]            = useState(null);
  const [uploadedMB5S,            setUploadedMB5S]            = useState(null);
  const [uploadedPendingReceipts, setUploadedPendingReceipts] = useState(null);
  const [uploadedAPAging,         setUploadedAPAging]         = useState(null);

  // Track whether initial load is done so realtime handlers don't fire before state is ready
  const initialised = useRef(false);

  // ── Initial load from Supabase (with IndexedDB fallback for AP Aging) ────────
  useEffect(() => {
    async function init() {
      const [approvals, mrbr, mb5s, pendingReceipts, apAging] = await Promise.all([
        loadDataset(DS.APPROVALS),
        loadDataset(DS.MRBR),
        loadDataset(DS.MB5S),
        loadDataset(DS.PENDING_RECEIPTS),
        loadDataset(DS.AP_AGING),
      ]);

      if (approvals?.length)       setUploadedApprovals(approvals);
      if (mrbr?.length)            setUploadedMRBR(mrbr);
      if (mb5s?.length)            setUploadedMB5S(mb5s);
      if (pendingReceipts?.length) setUploadedPendingReceipts(pendingReceipts);

      // AP Aging: use Supabase if available, otherwise migrate from IndexedDB
      if (apAging?.length) {
        setUploadedAPAging(apAging);
      } else {
        const idbData = await idbLoad('ap_aging');
        if (idbData?.length) {
          setUploadedAPAging(idbData);
          saveDataset(DS.AP_AGING, idbData); // migrate to Supabase silently
        }
      }

      initialised.current = true;
      setLoading(false);
    }
    init();
  }, []);

  // ── Realtime subscriptions — auto-refresh when any user uploads ──────────────
  useEffect(() => {
    const subs = [
      subscribeDataset(DS.APPROVALS,        () => loadDataset(DS.APPROVALS).then((d)        => { if (d?.length) setUploadedApprovals(d); })),
      subscribeDataset(DS.MRBR,             () => loadDataset(DS.MRBR).then((d)             => { if (d?.length) setUploadedMRBR(d); else setUploadedMRBR(null); })),
      subscribeDataset(DS.MB5S,             () => loadDataset(DS.MB5S).then((d)             => { if (d?.length) setUploadedMB5S(d); else setUploadedMB5S(null); })),
      subscribeDataset(DS.PENDING_RECEIPTS, () => loadDataset(DS.PENDING_RECEIPTS).then((d) => { if (d?.length) setUploadedPendingReceipts(d); else setUploadedPendingReceipts(null); })),
      subscribeDataset(DS.AP_AGING,         () => loadDataset(DS.AP_AGING).then((d)         => { if (d?.length) setUploadedAPAging(d); else setUploadedAPAging(null); })),
    ];
    return () => subs.forEach((s) => s.unsubscribe());
  }, []);

  // ── Sample / fallback data ───────────────────────────────────────────────────
  const sampleApprovals = useMemo(() => buildApprovalsDataset(), []);
  const sampleReceipts  = useMemo(() => buildReceiptsDataset(),  []);

  const approvalsData = uploadedApprovals ?? sampleApprovals;
  const receiptsData  = useMemo(() => {
    const mrbr = uploadedMRBR ?? [];
    const mb5s = uploadedMB5S ?? [];
    const combined = [...mrbr, ...mb5s];
    return combined.length ? combined : sampleReceipts;
  }, [uploadedMRBR, uploadedMB5S, sampleReceipts]);

  // ── Upload handlers ──────────────────────────────────────────────────────────
  async function handleApprovalsUpload(rows) {
    const { data } = parseApprovalsCSV(rows);
    if (!data.length) return;
    setUploadedApprovals(data);
    await saveDataset(DS.APPROVALS, data);
  }

  async function handleMRBRUpload(rows) {
    const { data: newData } = parseReceiptsCSV(rows);
    if (!newData.length) return;
    setUploadedMRBR((prev) => {
      const merged = prev?.length
        ? (() => {
            const existingKeys = new Set(prev.map((r) => `${r.EBELN}|${r.INVOICE_NUM}|${r.BALANCE_VAL}`));
            const toAdd = newData.filter((r) => !existingKeys.has(`${r.EBELN}|${r.INVOICE_NUM}|${r.BALANCE_VAL}`));
            return toAdd.length ? [...prev, ...toAdd] : prev;
          })()
        : newData;
      saveDataset(DS.MRBR, merged);
      return merged;
    });
  }

  async function handleMB5SUpload(rows) {
    const { data } = parseReceiptsCSV(rows);
    if (!data.length) return;
    setUploadedMB5S(data);
    await saveDataset(DS.MB5S, data);
  }

  async function handlePendingReceiptsUpload(data) {
    if (!data?.length) return;
    setUploadedPendingReceipts(data);
    await saveDataset(DS.PENDING_RECEIPTS, data);
  }

  async function handleAPAgingUpload(data) {
    if (!data?.length) return;
    setUploadedAPAging(data);
    await saveDataset(DS.AP_AGING, data);
  }

  // ── Clear handlers ───────────────────────────────────────────────────────────
  async function handleApprovalsClear()       { setUploadedApprovals(null);       await deleteDataset(DS.APPROVALS); }
  async function handleMRBRClear()            { setUploadedMRBR(null);            await deleteDataset(DS.MRBR); }
  async function handleMB5SClear()            { setUploadedMB5S(null);            await deleteDataset(DS.MB5S); }
  async function handlePendingReceiptsClear() { setUploadedPendingReceipts(null); await deleteDataset(DS.PENDING_RECEIPTS); }
  async function handleAPAgingClear()         { setUploadedAPAging(null);         await deleteDataset(DS.AP_AGING); }

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
            <img src={topgolfLogo} alt="Topgolf" className="h-10 w-auto flex-shrink-0 brightness-0 invert" />
            <div>
              <h1 className="text-sm font-bold tracking-wide leading-tight">
                SAP S/4HANA — Accounts Payable Dashboard
              </h1>
              <p className="text-xs text-blue-300 leading-tight">
                Accounts Payable Manager View · Topgolf Entertainment
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            {loading
              ? <p className="text-xs text-blue-300 animate-pulse">Loading shared data…</p>
              : <>
                  <p className="text-xs text-blue-300">Last refreshed</p>
                  <p className="text-xs font-medium text-white">{now}</p>
                </>
            }
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
            onClear={handleApprovalsClear}
            hasUpload={!!uploadedApprovals}
          />
        )}
        {activeTab === 'pending-receipts' && (
          <Dashboard4
            pendingData={uploadedPendingReceipts ?? []}
            onUpload={handlePendingReceiptsUpload}
            onClear={handlePendingReceiptsClear}
            hasUpload={!!uploadedPendingReceipts}
          />
        )}
        {activeTab === 'mrbr' && (
          <DashboardMRBR
            mrbrData={uploadedMRBR ?? []}
            onUpload={handleMRBRUpload}
            onClear={handleMRBRClear}
            hasUpload={!!uploadedMRBR}
          />
        )}
        {activeTab === 'mb5s' && (
          <DashboardMB5S
            mb5sData={uploadedMB5S ?? []}
            onUpload={handleMB5SUpload}
            onClear={handleMB5SClear}
            hasUpload={!!uploadedMB5S}
          />
        )}
        {activeTab === 'ap-aging' && (
          <DashboardAPAging
            agingData={uploadedAPAging ?? []}
            onUpload={handleAPAgingUpload}
            onClear={handleAPAgingClear}
            hasUpload={!!uploadedAPAging}
          />
        )}
        {activeTab === 'trends' && <Dashboard3 />}
      </main>

      <footer className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 mt-2">
        <p className="text-xs text-sap-subtext text-center">
          Data sourced from SAP S/4HANA · Topgolf Entertainment · For production use, connect via SAP OData APIs or BW extractors
        </p>
      </footer>
    </div>
  );
}
