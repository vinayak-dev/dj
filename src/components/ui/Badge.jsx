export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
    gray: 'bg-gray-100 text-gray-500',
    'full-paid': 'bg-green-100 text-green-700',
    'order-placed': 'bg-blue-50 text-blue-600 border border-blue-200',
    'no-priority': 'bg-gray-100 text-gray-600',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {children}
    </span>
  )
}
