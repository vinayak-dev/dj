import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { customersService } from '../services/customersService'
import { ordersService } from '../services/ordersService'
import AppLayout from '../components/layout/AppLayout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import AddCustomerModal from '../components/customers/AddCustomerModal'
import CustomerDetailPanel from '../components/customers/CustomerDetailPanel'
import NewOrderModal from '../components/orders/NewOrderModal'
import { Search, ChevronDown, Users, Plus, ChevronRight, Trash2 } from 'lucide-react'

const SOURCES = ['All sources', 'Manual', 'Form', 'WhatsApp', 'Website']

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

function computeStats(customer, allOrders = []) {
  const custOrders = allOrders.filter(o => {
    return (
      o.customer_id === customer.id ||
      o.customer?.id === customer.id ||
      (o.customer?.name && o.customer.name.toLowerCase() === customer.name?.toLowerCase()) ||
      (o.customer?.phone && o.customer.phone === customer.phone)
    )
  })

  const totalSpent = custOrders.reduce((sum, o) => {
    return sum + (o.order_items || []).reduce((s, i) => s + (i.qty * i.unit_price || 0), 0)
  }, 0)

  const sorted = [...custOrders].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  const lastOrder = sorted[0]

  const counts = {}
  custOrders.forEach(o => {
    o.order_items?.forEach(i => {
      const name = i.product_name || 'Product'
      counts[name] = (counts[name] || 0) + (i.qty || 1)
    })
  })
  const topProduct = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  return {
    orderCount: custOrders.length,
    totalSpent,
    lastOrderDate: lastOrder?.created_at,
    topProduct,
  }
}

export default function CustomersPage() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('All sources')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [newOrderCustomer, setNewOrderCustomer] = useState(null)

  useEffect(() => {
    if (user) loadData()
  }, [user, sourceFilter])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const filters = {}
      if (sourceFilter !== 'All sources') filters.source = sourceFilter
      if (search) filters.search = search

      const [custList, ordList] = await Promise.all([
        customersService.getAll(user.id, filters),
        ordersService.getAll(user.id),
      ])

      setCustomers(custList || [])
      setOrders(ordList || [])
    } catch (err) {
      setError(err.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteCustomer(customerId, customerName) {
    if (!window.confirm(`Delete customer "${customerName || 'Customer'}"? This action cannot be undone.`)) return
    try {
      await customersService.delete(customerId)
      setCustomers(prev => prev.filter(c => c.id !== customerId))
      if (selectedCustomer?.id === customerId) setSelectedCustomer(null)
    } catch (err) {
      alert('Failed to delete customer: ' + err.message)
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
        subtitle={`${customers.length} customers registered`}
        actions={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add customer
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Table Column */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all ${selectedCustomer ? 'hidden md:flex' : 'flex'}`}>
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white"
                placeholder="Search customers…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadData()}
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
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(customer => {
                    const { orderCount, totalSpent, lastOrderDate, topProduct } = computeStats(customer, orders)
                    const initials = customer.name?.charAt(0).toUpperCase() || '?'
                    const isSelected = selectedCustomer?.id === customer.id

                    return (
                      <tr
                        key={customer.id}
                        onClick={() => setSelectedCustomer(isSelected ? null : customer)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-semibold flex-shrink-0">
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
                        <td className="px-3 py-3 text-xs text-gray-500 max-w-[140px] truncate">{topProduct}</td>
                        <td className="px-3 py-3">
                          {customer.source && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                              {customer.source}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              title="Delete customer"
                              onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                              className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                            <button
                              title="View customer details"
                              onClick={() => setSelectedCustomer(isSelected ? null : customer)}
                              className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Customer Detail Slide-Over Panel */}
        {selectedCustomer && (
          <CustomerDetailPanel
            customer={selectedCustomer}
            orders={orders}
            onClose={() => setSelectedCustomer(null)}
            onDelete={handleDeleteCustomer}
            onCreateOrder={(cust) => {
              setNewOrderCustomer(cust)
              setShowNewOrder(true)
            }}
          />
        )}
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={async () => {
          setShowAdd(false)
          await loadData()
        }}
      />

      {/* New Order Modal (Prefilled with customer when launched from CustomerDetailPanel) */}
      <NewOrderModal
        isOpen={showNewOrder}
        initialCustomer={newOrderCustomer}
        onClose={() => {
          setShowNewOrder(false)
          setNewOrderCustomer(null)
        }}
        onCreated={async () => {
          setShowNewOrder(false)
          setNewOrderCustomer(null)
          await loadData()
        }}
      />
    </AppLayout>
  )
}
