import { useState } from 'react';
import { LayoutDashboard, ClipboardCheck, RefreshCw } from 'lucide-react';
import Dashboard1 from './components/Dashboard1';
import Dashboard2 from './components/Dashboard2';

const TABS = [
  {
    id: 'approvals',
    label: 'Pending Approvals',
    icon: ClipboardCheck,
    subtitle: 'SWWUSERWI · RBKP · USR21',
  },
  {
    id: 'receipts',
    label: 'GR/IR Reconciliation',
    icon: RefreshCw,
    subtitle: 'EKKO · EKPO · EKBE',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('approvals');
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
                Accounts Payable Manager View  ·  Company Code 1000
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
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all
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
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dashboard Content */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'approvals' ? <Dashboard1 /> : <Dashboard2 />}
      </main>

      {/* Footer */}
      <footer className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 mt-2">
        <p className="text-xs text-sap-subtext text-center">
          Data sourced from SAP S/4HANA  ·  Company Code 1000  ·  For production use, connect via SAP OData APIs or BW extractors
        </p>
      </footer>
    </div>
  );
}
