import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Users, Package,
  TrendingUp, UserCheck,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useState } from 'react'

import logoImg from '../../assets/logo.png'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/team', icon: UserCheck, label: 'Team' },
  { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
]

export default function Sidebar() {
  const { user, profile } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const businessName = profile?.business_name || 'DJ Arts & Crafts'
  const role = profile?.role || 'Owner'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <aside
      className={`flex flex-col flex-shrink-0 h-screen bg-[#0e1117] text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-[220px]'
        }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 min-h-[64px] border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
          <img
            src={logoImg}
            alt="DJ Arts & Crafts Logo"
            className="w-full h-full object-contain"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="font-bold text-sm tracking-tight text-white block truncate leading-tight">
              Admin
            </span>

          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2 mt-2">
            Menu
          </p>
        )}
        <ul className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-[#1a4731] text-[#22c55e]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} className={isActive ? 'text-[#22c55e]' : ''} />
                    {!collapsed && <span>{label}</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom controls */}
      <div className="mt-auto px-2 pb-2">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center px-3 py-2 text-gray-500 hover:text-white text-xs transition-colors rounded-lg hover:bg-white/5 ${collapsed ? 'justify-center' : 'justify-end'
            }`}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  )
}
