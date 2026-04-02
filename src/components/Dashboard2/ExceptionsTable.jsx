import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import SapBadge from '../shared/SapBadge';
import SectionHeader from '../shared/SectionHeader';

function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function TypeBadge({ type }) {
  if (type === 'GR_WITHOUT_IR') return <SapBadge variant="critical">GR w/o IR</SapBadge>;
  return <SapBadge variant="warning">IR w/o GR</SapBadge>;
}

function AgeBadge({ days }) {
  if (days > 45) return <SapBadge variant="critical">{days}d</SapBadge>;
  if (days > 20) return <SapBadge variant="warning">{days}d</SapBadge>;
  return <SapBadge variant="success">{days}d</SapBadge>;
}

export default function ExceptionsTable({ data }) {
  const [filter, setFilter] = useState('ALL');

  const filtered = filter === 'ALL'
    ? data
    : data.filter((d) => d.DISCREPANCY_TYPE === filter);

  return (
    <div>
      <SectionHeader
        title="GR/IR Exceptions Detail"
        subtitle="3-way match discrepancies — sorted by open value (highest first)"
        action={
          <div className="flex gap-1">
            {['ALL', 'GR_WITHOUT_IR', 'IR_WITHOUT_GR'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  filter === f
                    ? 'bg-sap-blue text-white'
                    : 'bg-sap-gray text-sap-subtext hover:bg-sap-lightblue'
                }`}
              >
                {f === 'ALL' ? 'All' : f === 'GR_WITHOUT_IR' ? 'GR w/o IR' : 'IR w/o GR'}
              </button>
            ))}
          </div>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[820px]">
          <thead>
            <tr className="border-b-2 border-sap-border">
              {[
                'PO Number', 'Vendor', 'Material / Service',
                'Qty Ordered', 'Qty GR', 'Qty IR',
                'Open Balance', 'Open Value', 'Age', 'Type', 'SAP Txn',
              ].map((h) => (
                <th key={h} className="text-left py-2 pr-3 last:pr-0 font-semibold text-sap-subtext uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={`${row.EBELN}-${row.EBELP}`}
                className={`border-b border-sap-border transition-colors ${
                  row.DISCREPANCY_TYPE === 'GR_WITHOUT_IR'
                    ? i % 2 === 0 ? 'bg-red-50 hover:bg-red-100' : 'bg-red-50/60 hover:bg-red-100'
                    : i % 2 === 0 ? 'bg-amber-50 hover:bg-amber-100' : 'bg-amber-50/60 hover:bg-amber-100'
                }`}
              >
                <td className="py-2.5 pr-3 font-mono font-medium text-sap-blue whitespace-nowrap">
                  {row.EBELN}<span className="text-sap-subtext">/{row.EBELP}</span>
                </td>
                <td className="py-2.5 pr-3 max-w-[130px] truncate" title={row.VENDOR_NAME}>
                  {row.VENDOR_NAME}
                </td>
                <td className="py-2.5 pr-3 max-w-[160px]">
                  <div className="truncate font-medium text-sap-text" title={row.TXZ01}>{row.TXZ01}</div>
                  <div className="text-sap-subtext font-mono">{row.MATNR}</div>
                </td>
                <td className="py-2.5 pr-3 text-right font-mono text-sap-text">
                  {row.QTY_ORDERED.toLocaleString()} {row.MEINS}
                </td>
                <td className="py-2.5 pr-3 text-right font-mono text-sap-text">
                  {row.QTY_GR.toLocaleString()}
                </td>
                <td className="py-2.5 pr-3 text-right font-mono text-sap-text">
                  {row.QTY_IR.toLocaleString()}
                </td>
                <td className={`py-2.5 pr-3 text-right font-mono font-semibold ${
                  row.DISCREPANCY_TYPE === 'GR_WITHOUT_IR' ? 'text-red-700' : 'text-amber-700'
                }`}>
                  {row.BALANCE_QTY.toLocaleString()} {row.MEINS}
                </td>
                <td className="py-2.5 pr-3 text-right font-semibold text-sap-text whitespace-nowrap">
                  {fmt(row.BALANCE_VAL)}
                </td>
                <td className="py-2.5 pr-3">
                  <AgeBadge days={row.DAYS_OPEN} />
                </td>
                <td className="py-2.5 pr-3">
                  <TypeBadge type={row.DISCREPANCY_TYPE} />
                </td>
                <td className="py-2.5">
                  <span className="inline-flex items-center gap-1 font-mono text-xs bg-sap-gray px-1.5 py-0.5 rounded text-sap-text font-medium">
                    {row.SAP_TRANSACTION}
                    <ExternalLink size={9} className="text-sap-subtext" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-sap-border bg-sap-gray">
              <td colSpan={7} className="py-2 pr-3 text-right text-xs font-semibold text-sap-subtext uppercase tracking-wide">
                Total Open Value
              </td>
              <td className="py-2 pr-3 text-right text-sm font-bold text-sap-text">
                {fmt(filtered.reduce((s, d) => s + d.BALANCE_VAL, 0))}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-3 text-xs text-sap-subtext">
        Use <span className="font-mono bg-sap-gray px-1 rounded">MRBR</span> to release invoices blocked for
        missing GR  •  <span className="font-mono bg-sap-gray px-1 rounded">MB5S</span> for GR/IR balance
        report  •  <span className="font-mono bg-sap-gray px-1 rounded">MR11</span> to clear GR/IR accounts
      </p>
    </div>
  );
}
