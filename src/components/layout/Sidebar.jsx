import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Users, Package,
  TrendingUp, UserCheck,
  ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useLayout } from '../../contexts/LayoutContext'
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
  const { mobileMenuOpen, setMobileMenuOpen } = useLayout()
  const [collapsed, setCollapsed] = useState(false)

  // Close mobile drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen, setMobileMenuOpen])

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. Desktop Sidebar (hidden on mobile, visible from md:)
      ───────────────────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 h-screen bg-[#0e1117] text-white transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-[220px]'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 min-h-[56px] border-b border-white/5">
          <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
            <img
              src={logoImg}
              alt="DJ Arts & Crafts Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-bold text-sm tracking-tight text-white block truncate leading-tight">
                DJ Arts & Crafts
              </span>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 px-2 overflow-y-auto">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2 mt-3">
              Menu
            </p>
          )}
          <ul className="space-y-0.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
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
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center px-3 py-2 text-gray-500 hover:text-white text-xs transition-colors rounded-lg hover:bg-white/5 ${
              collapsed ? 'justify-center' : 'justify-end'
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. Mobile Drawer & Backdrop (visible only < md)
      ───────────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0e1117] text-white flex flex-col md:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header with Logo & Close button */}
        <div className="flex items-center justify-between px-4 py-4 min-h-[56px] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
              <img
                src={logoImg}
                alt="DJ Arts & Crafts Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-sm tracking-tight text-white block truncate">
              DJ Arts & Crafts
            </span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </p>
          <ul className="space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#1a4731] text-[#22c55e]'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} className={isActive ? 'text-[#22c55e]' : 'text-gray-400'} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Bottom Status */}
        <div className="px-4 py-3 border-t border-white/5 text-xs text-gray-400 flex items-center justify-between">
          <span className="truncate">DJ Arts & Crafts</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      </aside>
    </>
  )
}
