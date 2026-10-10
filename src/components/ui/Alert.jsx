import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
}

const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
}

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
}

export default function Alert({ type = 'info', title, message, onDismiss }) {
  const Icon = icons[type]
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${styles[type]}`}>
      <Icon size={16} className={`mt-0.5 flex-shrink-0 ${iconColors[type]}`} />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {message && <p className="mt-0.5 opacity-80">{message}</p>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 opacity-60 hover:opacity-100">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
