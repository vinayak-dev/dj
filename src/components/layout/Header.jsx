import { Grid3X3 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Header({ title, subtitle, actions, icon }) {
  const { profile, user } = useAuth()
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <header className="h-[56px] flex items-center justify-between px-6 bg-white border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Page icon */}
        {icon ? (
          icon
        ) : (
          <Grid3X3 size={18} className="text-gray-400" />
        )}
        <div>
          <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}
      </div>
    </header>
  )
}
