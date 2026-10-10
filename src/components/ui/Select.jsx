export default function Select({ label, error, className = '', required, children, ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-colors appearance-none
          ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-gray-400'}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
