import { Bell, Grid3X3 } from 'lucide-react'
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
        {/* Notifications */}
        <div className="relative">
          <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Bell size={14} className="text-gray-600" />
          </button>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            1
          </span>
        </div>
      </div>
    </header>
  )
}
