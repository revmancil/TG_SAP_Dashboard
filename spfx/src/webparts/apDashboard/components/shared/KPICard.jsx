export default function KPICard({ title, value, subtitle, icon: Icon, variant = 'default', badge }) {
  const variants = {
    default:  'bg-white border-sap-border text-sap-text',
    critical: 'bg-red-50  border-red-300  text-sap-text',
    warning:  'bg-amber-50 border-amber-300 text-sap-text',
    success:  'bg-green-50 border-green-300 text-sap-text',
    info:     'bg-blue-50  border-blue-300  text-sap-text',
  };
  const iconColors = {
    default:  'bg-sap-lightblue text-sap-blue',
    critical: 'bg-red-100    text-red-600',
    warning:  'bg-amber-100  text-amber-600',
    success:  'bg-green-100  text-green-700',
    info:     'bg-blue-100   text-blue-600',
  };

  return (
    <div className={`rounded-lg border-2 p-5 flex items-start gap-4 shadow-sm ${variants[variant]}`}>
      {Icon && (
        <div className={`rounded-lg p-2.5 flex-shrink-0 ${iconColors[variant]}`}>
          <Icon size={22} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-sap-subtext mb-1">{title}</p>
        <p className="text-2xl font-bold leading-tight truncate">{value}</p>
        {subtitle && <p className="text-xs text-sap-subtext mt-1 leading-snug">{subtitle}</p>}
      </div>
      {badge && (
        <span className="ml-auto flex-shrink-0 rounded-full bg-red-500 text-white text-xs font-bold px-2 py-0.5">
          {badge}
        </span>
      )}
    </div>
  );
}
