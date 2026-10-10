export default function Input({
  label,
  error,
  className = '',
  required,
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-colors
          placeholder:text-gray-400
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200' : 'border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-100'}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
