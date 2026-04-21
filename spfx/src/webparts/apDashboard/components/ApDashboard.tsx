import * as React from 'react';
const { useState, useMemo, useEffect, useRef } = React;
import { ClipboardCheck, FileX, PackageCheck, TrendingUp, FileText, BarChart2 } from 'lucide-react';
import topgolfLogo from '../assets/topgolf-logo.png';
import { buildApprovalsDataset } from '../data/approvals';
import { buildReceiptsDataset } from '../data/receipts';
import { parseApprovalsCSV, APPROVALS_EXPECTED_COLUMNS } from '../utils/approvalsParser';
import { parseReceiptsCSV } from '../utils/receiptsParser';
import { DS, loadDataset, saveDataset, deleteDataset, subscribeDataset } from '../spDataService';
import Dashboard1 from './Dashboard1';
import Dashboard3 from './Dashboard3';
import Dashboard4 from './Dashboard4';
import DashboardMRBR from './DashboardMRBR';
import DashboardMB5S from './DashboardMB5S';
import DashboardAPAging from './DashboardAPAging';
import { IApDashboardProps } from './IApDashboardProps';

const TABS = [
  { id: 'approvals',        label: 'Pending Approvals',  icon: ClipboardCheck, subtitle: 'SWWUSERWI · RBKP'    },
  { id: 'pending-receipts', label: 'Pending Receipts',   icon: FileText,       subtitle: 'AP Invoice Report'    },
  { id: 'mrbr',             label: 'Blocked Invoices',   icon: FileX,          subtitle: 'MRBR · IR w/o GR'    },
  { id: 'mb5s',             label: 'GR/IR Balances',     icon: PackageCheck,   subtitle: 'MB5S · GR w/o IR'    },
  { id: 'ap-aging',         label: 'AP Aging',           icon: BarChart2,      subtitle: 'Aging Buckets'        },
  { id: 'trends',           label: 'Weekly Trends',      icon: TrendingUp,     subtitle: 'Approvals & Receipts' },
];

export default function ApDashboard(_props: IApDashboardProps) {
  const [activeTab, setActiveTab] = useState('approvals');
  const [loading, setLoading]     = useState(true);

  const [uploadedApprovals,       setUploadedApprovals]       = useState(null);
  const [uploadedMRBR,            setUploadedMRBR]            = useState(null);
  const [uploadedMB5S,            setUploadedMB5S]            = useState(null);
  const [uploadedPendingReceipts, setUploadedPendingReceipts] = useState(null);
  const [uploadedAPAging,         setUploadedAPAging]         = useState(null);

  const initialised = useRef(false);

  // ── Initial load from SharePoint ─────────────────────────────────────────────
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
      if (apAging?.length)         setUploadedAPAging(apAging);

      initialised.current = true;
      setLoading(false);
    }
    init();
  }, []);

  // ── Polling subscriptions (60s) ───────────────────────────────────────────────
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

  // ── Sample / fallback data ────────────────────────────────────────────────────
  const sampleApprovals = useMemo(() => buildApprovalsDataset(), []);
  const sampleReceipts  = useMemo(() => buildReceiptsDataset(),  []);

  const approvalsData = uploadedApprovals ?? sampleApprovals;
  const receiptsData  = useMemo(() => {
    const mrbr = uploadedMRBR ?? [];
    const mb5s = uploadedMB5S ?? [];
    const combined = [...mrbr, ...mb5s];
    return combined.length ? combined : sampleReceipts;
  }, [uploadedMRBR, uploadedMB5S, sampleReceipts]);

  // ── Upload handlers ───────────────────────────────────────────────────────────
  async function handleApprovalsUpload(rows: any) {
    const { data } = parseApprovalsCSV(rows);
    if (!data.length) return;
    setUploadedApprovals(data);
    await saveDataset(DS.APPROVALS, data);
  }

  async function handleMRBRUpload(rows: any) {
    const { data: newData } = parseReceiptsCSV(rows);
    if (!newData.length) return;
    setUploadedMRBR((prev: any) => {
      const merged = prev?.length
        ? (() => {
            const existingKeys = new Set(prev.map((r: any) => `${r.EBELN}|${r.INVOICE_NUM}|${r.BALANCE_VAL}`));
            const toAdd = newData.filter((r: any) => !existingKeys.has(`${r.EBELN}|${r.INVOICE_NUM}|${r.BALANCE_VAL}`));
            return toAdd.length ? [...prev, ...toAdd] : prev;
          })()
        : newData;
      saveDataset(DS.MRBR, merged);
      return merged;
    });
  }

  async function handleMB5SUpload(rows: any) {
    const { data } = parseReceiptsCSV(rows);
    if (!data.length) return;
    setUploadedMB5S(data);
    await saveDataset(DS.MB5S, data);
  }

  async function handlePendingReceiptsUpload(data: any) {
    if (!data?.length) return;
    setUploadedPendingReceipts(data);
    await saveDataset(DS.PENDING_RECEIPTS, data);
  }

  async function handleAPAgingUpload(data: any) {
    if (!data?.length) return;
    setUploadedAPAging(data);
    await saveDataset(DS.AP_AGING, data);
  }

  // ── Clear handlers ────────────────────────────────────────────────────────────
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
    <div style={{ minHeight: '100vh', background: '#f4f6f9', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#003087', color: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,.15)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={topgolfLogo} alt="Topgolf" style={{ height: 40, filter: 'brightness(0) invert(1)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.03em', lineHeight: 1.2 }}>
                SAP S/4HANA — Accounts Payable Dashboard
              </div>
              <div style={{ fontSize: 11, color: '#93c5fd', lineHeight: 1.2 }}>
                Accounts Payable Manager View · Topgolf Entertainment
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {loading
              ? <div style={{ fontSize: 11, color: '#93c5fd' }}>Loading shared data…</div>
              : <>
                  <div style={{ fontSize: 11, color: '#93c5fd' }}>Last refreshed</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{now}</div>
                </>
            }
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <nav style={{ display: 'flex', overflowX: 'auto' }}>
            {TABS.map((tab) => {
              const Icon   = tab.icon;
              const active = activeTab === tab.id;
              const hasDot = tab.id === 'trends' && hasAnyData;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 18px',
                    fontSize: 12,
                    fontWeight: 600,
                    border: 'none',
                    borderBottom: active ? '2px solid #0070f3' : '2px solid transparent',
                    background: active ? '#eff6ff' : 'transparent',
                    color: active ? '#0070f3' : '#64748b',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all .15s',
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 400, fontFamily: 'monospace', marginLeft: 4, color: active ? '#0070f3' : '#94a3b8' }}>
                    {tab.subtitle}
                  </span>
                  {hasDot && (
                    <span style={{ position: 'absolute', top: 8, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dashboard Content */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px' }}>
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

      <footer style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 24px', marginTop: 8 }}>
        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
          Data sourced from SAP S/4HANA · Topgolf Entertainment · For production use, connect via SAP OData APIs or BW extractors
        </p>
      </footer>
    </div>
  );
}
