import SectionHeader from '../shared/SectionHeader';

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

// Heat cell: red intensity based on age — darker = older
function AgeCell({ days, maxDays }) {
  const intensity  = maxDays > 0 ? days / maxDays : 0;
  const bg         = `rgba(187,0,0,${0.08 + intensity * 0.82})`;
  const textColor  = intensity > 0.55 ? '#fff' : '#32363A';
  return (
    <div
      className="rounded px-2 py-1 text-center font-bold text-xs transition-all"
      style={{ background: bg, color: textColor, minWidth: 52 }}
      title={`${days} days`}
    >
      {days}d
    </div>
  );
}

// discType passed for subtitle context only — sorting/filtering is always by age
export default function VendorHeatmap({ vendors, discType }) {
  const maxDays = Math.max(1, ...vendors.map((v) => v.MAX_DAYS));

  const subtitle = discType === 'IR_WITHOUT_GR'
    ? 'Top 25 vendors by oldest blocked invoice — darker = older'
    : discType === 'GR_WITHOUT_IR'
    ? 'Top 25 vendors by oldest unvouchered GR — darker = older'
    : 'Top 25 vendors by oldest open item — darker = older';

  if (vendors.length === 0) {
    return (
      <div>
        <SectionHeader title="Vendor Age Heatmap" subtitle={subtitle} />
        <p className="py-6 text-center text-sap-subtext text-xs">No data to display.</p>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Vendor Age Heatmap" subtitle={subtitle} />
      <div className="overflow-x-auto">
        <div className="max-h-[28rem] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-sap-border">
                <th className="text-left py-2 pr-4 font-semibold text-sap-subtext uppercase tracking-wide">#</th>
                <th className="text-left py-2 pr-4 font-semibold text-sap-subtext uppercase tracking-wide">Vendor</th>
                <th className="text-center py-2 px-2 font-semibold text-sap-subtext uppercase tracking-wide">Items</th>
                <th className="text-center py-2 px-2 font-semibold text-red-700 uppercase tracking-wide">Max Age</th>
                <th className="text-center py-2 px-2 font-semibold text-sap-subtext uppercase tracking-wide">Avg Age</th>
                <th className="text-right py-2 pl-2 font-semibold text-sap-subtext uppercase tracking-wide">Open Value</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v, i) => (
                <tr key={v.LIFNR} className={`border-b border-sap-border ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-2 pr-4 text-sap-subtext font-mono">{i + 1}</td>
                  <td className="py-2 pr-4">
                    <div className="font-medium text-sap-text leading-tight truncate max-w-[140px]" title={v.VENDOR_NAME}>
                      {v.VENDOR_NAME}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center text-sap-subtext">{v.ITEM_COUNT}</td>
                  <td className="py-2 px-2">
                    <div className="flex justify-center">
                      <AgeCell days={v.MAX_DAYS} maxDays={maxDays} />
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center text-sap-subtext font-medium">{v.AVG_DAYS}d</td>
                  <td className="py-2 pl-2 text-right font-semibold text-sap-text">{fmt(v.TOTAL_OPEN)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
