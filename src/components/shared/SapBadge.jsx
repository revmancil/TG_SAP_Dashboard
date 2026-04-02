export default function SapBadge({ children, variant = 'default' }) {
  const styles = {
    default:  'bg-gray-100 text-gray-700',
    critical: 'bg-red-100  text-red-700',
    warning:  'bg-amber-100 text-amber-700',
    success:  'bg-green-100 text-green-700',
    info:     'bg-blue-100  text-blue-700',
    ready:    'bg-yellow-100 text-yellow-800',
    active:   'bg-blue-100   text-blue-800',
  };
  return (
    <span className={`inline-block text-xs font-medium rounded px-1.5 py-0.5 ${styles[variant]}`}>
      {children}
    </span>
  );
}
