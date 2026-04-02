import { X, AlertTriangle, Tag } from 'lucide-react';
import SapBadge from '../shared/SapBadge';
import SectionHeader from '../shared/SectionHeader';

function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function AgingChip({ days }) {
  if (days > 10) return <SapBadge variant="critical">{days}d</SapBadge>;
  if (days > 5)  return <SapBadge variant="warning">{days}d</SapBadge>;
  return <SapBadge variant="success">{days}d</SapBadge>;
}

function StatusChip({ status }) {
  if (status === 'IN_PROCESS') return <SapBadge variant="active">In Process</SapBadge>;
  return <SapBadge variant="ready">Ready</SapBadge>;
}

export default function ActionList({ data, selectedApprover, onClear }) {
  return (
    <div>
      <SectionHeader
        title="Invoice Action List"
        subtitle={
          selectedApprover
            ? `Filtered by approver — ${data.length} item${data.length !== 1 ? 's' : ''}`
            : `All pending invoices — ${data.length} items`
        }
        action={
          selectedApprover && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-xs text-sap-blue hover:text-sap-darkblue font-medium"
            >
              <X size={13} /> Clear filter
            </button>
          )
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[680px]">
          <thead>
            <tr className="border-b-2 border-sap-border">
              {['Invoice #', 'Vendor', 'Amount', 'Payment Terms', 'Age', 'Status', 'Current Approver', 'Discount Risk'].map(
                (h) => (
                  <th key={h} className="text-left py-2 pr-4 last:pr-0 font-semibold text-sap-subtext uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.WI_ID}
                className={`border-b border-sap-border transition-colors ${
                  row.DISCOUNT_AT_RISK
                    ? 'bg-red-50 hover:bg-red-100'
                    : i % 2 === 0 ? 'bg-white hover:bg-sap-gray' : 'bg-gray-50 hover:bg-sap-gray'
                }`}
              >
                <td className="py-2.5 pr-4 font-mono font-medium text-sap-blue whitespace-nowrap">
                  {row.BELNR}
                </td>
                <td className="py-2.5 pr-4 text-sap-text max-w-[160px] truncate" title={row.VENDOR_NAME}>
                  {row.VENDOR_NAME}
                </td>
                <td className="py-2.5 pr-4 font-semibold text-sap-text whitespace-nowrap">
                  {fmt(row.WRBTR)}
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Tag size={11} className="text-sap-subtext" />
                    <span className="text-sap-subtext">{row.ZTERM_DESC}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <AgingChip days={row.DAYS_IN_WORKFLOW} />
                </td>
                <td className="py-2.5 pr-4">
                  <StatusChip status={row.WI_STAT} />
                </td>
                <td className="py-2.5 pr-4 text-sap-text">{row.APPROVER_NAME}</td>
                <td className="py-2.5">
                  {row.DISCOUNT_AT_RISK ? (
                    <div className="flex items-center gap-1 text-red-600 font-semibold">
                      <AlertTriangle size={12} />
                      <span>
                        {row.DAYS_TO_DISCOUNT <= 0
                          ? 'EXPIRED'
                          : `${row.DAYS_TO_DISCOUNT}d left`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sap-subtext">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-sap-subtext">
        Tip: Use SAP transaction <span className="font-mono bg-sap-gray px-1 rounded">FBL1N</span> to pull vendor
        open items or <span className="font-mono bg-sap-gray px-1 rounded">SWI2_FREQ</span> to report on workflow
        task frequency per agent.
      </p>
    </div>
  );
}
