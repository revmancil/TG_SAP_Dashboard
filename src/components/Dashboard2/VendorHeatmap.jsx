import SectionHeader from '../shared/SectionHeader';

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function HeatCell({ value, max, label, type }) {
  const intensity = max > 0 ? value / max : 0;
  const grColor   = `rgba(187,0,0,${0.08 + intensity * 0.82})`;
  const irColor   = `rgba(233,115,12,${0.08 + intensity * 0.82})`;
  const bg        = type === 'gr' ? grColor : irColor;
  const textColor = intensity > 0.55 ? '#fff' : '#32363A';

  return (
    <div
      className="rounded px-2 py-1.5 text-center transition-all"
      style={{ background: bg, color: textColor, minWidth: 72 }}
      title={`${label}: ${fmt(value)}`}
    >
      <div className="text-xs font-bold leading-tight">{fmt(value)}</div>
    </div>
  );
}

// discType: 'IR_WITHOUT_GR' = MRBR section, 'GR_WITHOUT_IR' = MB5S section, undefined = show both
export default function VendorHeatmap({ vendors, discType }) {
  const showGR = !discType || discType === 'GR_WITHOUT_IR';
  const showIR = !discType || discType === 'IR_WITHOUT_GR';

  const maxGR = Math.max(1, ...vendors.map((v) => v.GR_WITHOUT_IR));
  const maxIR = Math.max(1, ...vendors.map((v) => v.IR_WITHOUT_GR));

  const subtitle = discType === 'IR_WITHOUT_GR'
    ? 'Top vendors by blocked invoice value — darker = higher value'
    : discType === 'GR_WITHOUT_IR'
    ? 'Top vendors by unvouchered GR value — darker = higher value'
    : 'Top vendors by open GR/IR balance — darker = higher value';

  return (
    <div>
      <SectionHeader title="Vendor Heatmap" subtitle={subtitle} />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-sap-border">
              <th className="text-left py-2 pr-4 font-semibold text-sap-subtext uppercase tracking-wide">Vendor</th>
              <th className="text-center py-2 px-2 font-semibold text-sap-subtext uppercase tracking-wide">Items</th>
              {showGR && <th className="text-center py-2 px-2 font-semibold text-red-700 uppercase tracking-wide">GR w/o IR</th>}
              {showIR && <th className="text-center py-2 px-2 font-semibold text-amber-700 uppercase tracking-wide">IR w/o GR</th>}
              <th className="text-right py-2 pl-2 font-semibold text-sap-subtext uppercase tracking-wide">Total Open</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v, i) => (
              <tr key={v.LIFNR} className={`border-b border-sap-border ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="py-2 pr-4">
                  <div className="font-medium text-sap-text leading-tight">{v.VENDOR_NAME}</div>
                  <div className="text-sap-subtext font-mono">{v.LIFNR}</div>
                </td>
                <td className="py-2 px-2 text-center text-sap-subtext">{v.ITEM_COUNT}</td>
                {showGR && (
                  <td className="py-2 px-2">
                    {v.GR_WITHOUT_IR > 0
                      ? <HeatCell value={v.GR_WITHOUT_IR} max={maxGR} label="GR w/o IR" type="gr" />
                      : <div className="text-center text-sap-subtext">—</div>}
                  </td>
                )}
                {showIR && (
                  <td className="py-2 px-2">
                    {v.IR_WITHOUT_GR > 0
                      ? <HeatCell value={v.IR_WITHOUT_GR} max={maxIR} label="IR w/o GR" type="ir" />
                      : <div className="text-center text-sap-subtext">—</div>}
                  </td>
                )}
                <td className="py-2 pl-2 text-right font-semibold text-sap-text">{fmt(v.TOTAL_OPEN)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
