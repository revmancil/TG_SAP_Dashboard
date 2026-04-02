export default function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h2 className="text-sm font-semibold text-sap-text">{title}</h2>
        {subtitle && <p className="text-xs text-sap-subtext mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
