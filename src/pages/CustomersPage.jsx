import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { customersService } from '../services/customersService'
import AppLayout from '../components/layout/AppLayout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import AddCustomerModal from '../components/customers/AddCustomerModal'
import { Search, ChevronDown, Users, Plus, ChevronRight } from 'lucide-react'

const SOURCES = ['All sources', 'Manual', 'Form', 'WhatsApp', 'Website']

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

function computeCustomerStats(customer) {
  const orders = customer.orders || []
  const totalSpent = orders.reduce((sum, o) => {
    return sum + (o.order_items || []).reduce((s, i) => s + (i.qty * i.unit_price || 0), 0)
  }, 0)
  const lastOrder = orders.length > 0
    ? orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    : null
  return { orderCount: orders.length, totalSpent, lastOrderDate: lastOrder?.created_at }
}

export default function CustomersPage() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('All sources')
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (user) loadCustomers()
  }, [user, sourceFilter])

  async function loadCustomers() {
    setLoading(true)
    setError('')
    try {
      const filters = {}
      if (sourceFilter !== 'All sources') filters.source = sourceFilter
      if (search) filters.search = search
      const data = await customersService.getAll(user.id, filters)
      setCustomers(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const filtered = customers.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  })

  return (
    <AppLayout>
      <Header
        title="Customers"
        subtitle={`${customers.length} new this month`}
        actions={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add customer
          </Button>
        }
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white"
              placeholder="Search customers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadCustomers()}
            />
          </div>

          <div className="relative">
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="appearance-none text-sm border border-gray-200 rounded-lg px-3 py-1.5 pr-7 outline-none focus:border-gray-400 bg-white text-gray-700"
            >
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select className="appearance-none text-sm border border-gray-200 rounded-lg px-3 py-1.5 pr-7 outline-none focus:border-gray-400 bg-white text-gray-700">
              <option>Last 12 months</option>
              <option>Last 6 months</option>
              <option>Last 3 months</option>
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20 text-red-500 text-sm">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Users size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No customers yet</p>
              <p className="text-xs mt-1">Click "Add customer" to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b border-gray-100 z-10">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Contact</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Orders</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Total Spent</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Last Order ↓</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Top Product</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Source</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(customer => {
                  const { orderCount, totalSpent, lastOrderDate } = computeCustomerStats(customer)
                  const initials = customer.name?.charAt(0).toUpperCase() || '?'
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {initials}
                          </div>
                          <span className="font-medium text-gray-900 text-xs">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {customer.phone && <p className="text-xs text-gray-600">{customer.phone}</p>}
                        {customer.email && <p className="text-xs text-gray-400">{customer.email}</p>}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">{orderCount}</td>
                      <td className="px-3 py-3 text-xs font-medium text-gray-900">
                        {totalSpent > 0 ? `₹${totalSpent.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">{formatDate(lastOrderDate)}</td>
                      <td className="px-3 py-3 text-xs text-gray-400">—</td>
                      <td className="px-3 py-3">
                        {customer.source && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            {customer.source}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <ChevronRight size={14} className="text-gray-300" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddCustomerModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={async () => { setShowAdd(false); await loadCustomers() }}
      />
    </AppLayout>
  )
}
