import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { dashboardService } from '../services/dashboardService'
import AppLayout from '../components/layout/AppLayout'
import Header from '../components/layout/Header'
import { TrendingUp, ShoppingCart, Clock, AlertCircle, Sparkles, ChevronDown, ArrowRight } from 'lucide-react'
import Spinner from '../components/ui/Spinner'

const PERIODS = [
  { label: 'Last 3 months', months: 3 },
  { label: 'Last 6 months', months: 6 },
  { label: 'Last 12 months', months: 12 },
]

function StatCard({ icon: Icon, iconColor, iconBg, label, value, badge, badgeColor, subtitle, action }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon size={15} className={iconColor} />
        </div>
        {badge && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
        {action && (
          <button className="text-gray-400 hover:text-gray-600">
            <ArrowRight size={14} />
          </button>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[1])
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bankBannerDismissed, setBankBannerDismissed] = useState(false)

  useEffect(() => {
    if (!user) return
    loadStats()
  }, [user, selectedPeriod])

  async function loadStats() {
    setLoading(true)
    try {
      const data = await dashboardService.getStats(user.id, selectedPeriod.months)
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '—'
    return `₹${Number(amount).toLocaleString('en-IN')}`
  }

  return (
    <AppLayout>

      <main className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Period filter */}
        <div className="relative inline-block">
          <button
            onClick={() => setShowPeriodMenu(!showPeriodMenu)}
            className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-400 text-xs">📅</span>
            {selectedPeriod.label}
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {showPeriodMenu && (
            <div className="absolute left-0 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48">
              {PERIODS.map(p => (
                <button
                  key={p.months}
                  onClick={() => { setSelectedPeriod(p); setShowPeriodMenu(false) }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${p.months === selectedPeriod.months ? 'font-semibold text-gray-900' : 'text-gray-600'
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Revenue card with Integrated Graph (matching reference UI) */}
        <div className="bg-[#111317] rounded-2xl p-6 sm:p-7 text-white relative overflow-hidden shadow-xl border border-gray-800/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left Content */}
            <div className="flex flex-col gap-1.5 z-10">
              <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                REVENUE · {selectedPeriod?.months ? `LAST ${selectedPeriod.months} MONTHS` : selectedPeriod.label.toUpperCase()}
              </p>

              {loading ? (
                <div className="mt-2"><Spinner className="border-gray-600 border-t-white" /></div>
              ) : (
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-white leading-none">
                    {formatCurrency(stats?.totalRevenue)}
                  </span>

                </div>
              )}


            </div>

            {/* Right Graph Inside This Section */}
            <div className="w-full md:w-[260px] lg:w-[340px] flex items-center justify-end relative">
              <svg
                viewBox="0 0 220 56"
                width="100%"
                height="56"
                preserveAspectRatio="none"
                aria-hidden="true"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0.0 52.0 L 44.0 52.0 L 88.0 52.0 L 132.0 52.0 L 176.0 52.0 L 220.0 4.0 L 220 56 L 0 56 Z"
                  fill="url(#sparkFill)"
                />
                <path
                  d="M 0.0 52.0 L 44.0 52.0 L 88.0 52.0 L 132.0 52.0 L 176.0 52.0 L 220.0 4.0"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx="220"
                  cy="4"
                  r="3.5"
                  fill="#FFFFFF"
                  stroke="#22C55E"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Stat cards row 1 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                icon={ShoppingCart}
                iconBg="bg-blue-50"
                iconColor="text-blue-500"
                label="Today's orders"
                value={stats?.todaysOrders ?? 0}
                badge={`+${stats?.todaysOrders ?? 0}`}
                badgeColor="bg-green-100 text-green-700"
                subtitle="Placed today"
              />
              <StatCard
                icon={Clock}
                iconBg="bg-purple-50"
                iconColor="text-purple-500"
                label="Active orders"
                value={stats?.activeOrders ?? 0}
                badge={`${stats?.activeOrders ?? 0} open`}
                badgeColor="bg-gray-100 text-gray-600"
                subtitle="Currently in progress"
              />
              <StatCard
                icon={TrendingUp}
                iconBg="bg-green-50"
                iconColor="text-green-500"
                label="Avg turnaround"
                value="—"
                badge="—"
                badgeColor="bg-gray-100 text-gray-500"
                subtitle="Across delivered work"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                icon={AlertCircle}
                iconBg="bg-orange-50"
                iconColor="text-orange-500"
                label="Pending payments"
                value={formatCurrency(stats?.pendingPayments)}
                badge="0 due"
                badgeColor="bg-gray-100 text-gray-500"
                subtitle="0 orders awaiting"
              />
              <StatCard
                icon={Sparkles}
                iconBg="bg-yellow-50"
                iconColor="text-yellow-500"
                label="Add-on revenue"
                value={formatCurrency(stats?.addOnRevenue)}
                subtitle={selectedPeriod.label}
                action
              />
            </div>

            {/* Analytics CTA */}
            {/* <div className="bg-white rounded-xl border border-gray-100 p-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp size={22} className="text-emerald-500" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Analytics</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                See revenue, order and customer trends over time.
              </p>
              <Link
                to="/analytics"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-lg transition-colors"
              >
                View Analytics Trends →
              </Link>
            </div> */}
          </>
        )}
      </main>
    </AppLayout>
  )
}
