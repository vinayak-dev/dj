import { Grid3X3, Menu } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useLayout } from '../../contexts/LayoutContext'

export default function Header({ title, subtitle, actions, icon }) {
  const { profile, user } = useAuth()
  const { setMobileMenuOpen } = useLayout()
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <header className="h-[56px] flex items-center justify-between px-3 sm:px-6 bg-white border-b border-gray-200 flex-shrink-0 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-1.5 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none flex-shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Page icon (hidden on extra small screens if tight) */}
        <div className="hidden xs:flex flex-shrink-0">
          {icon ? icon : <Grid3X3 size={18} className="text-gray-400" />}
        </div>

        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 truncate leading-tight">{title}</h1>
          {subtitle && <p className="text-[11px] text-gray-400 truncate hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
      </div>
    </header>
  )
}
