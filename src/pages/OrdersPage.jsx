import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ordersService } from '../services/ordersService'
import { productsService } from '../services/productsService'
import { teamService } from '../services/teamService'
import AppLayout from '../components/layout/AppLayout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import NewOrderModal from '../components/orders/NewOrderModal'
import OrderDetailPanel from '../components/orders/OrderDetailPanel'
import {
  Search, List, LayoutGrid, Users, ChevronDown,
  MessageSquare, Check, Trash2, ExternalLink,
  Plus, Copy, Circle
} from 'lucide-react'

export const ALL_STAGES = [
  { id: 'Order Placed', label: 'Order Placed', dotColor: 'bg-[#1f2937]', textColor: 'text-[#1f2937]' },
  { id: 'Reviewing Details', label: 'Reviewing Details', dotColor: 'bg-[#4f46e5]', textColor: 'text-[#4338ca]' },
  { id: 'Work in Progress', label: 'Work in Progress', dotColor: 'bg-[#4f46e5]', textColor: 'text-[#4338ca]' },
  { id: 'Internal Review', label: 'Internal Review', dotColor: 'bg-[#3b82f6]', textColor: 'text-[#2563eb]' },
  { id: 'Preview Sent', label: 'Preview Sent', dotColor: 'bg-[#0284c7]', textColor: 'text-[#0284c7]' },
  { id: 'Changes Requested', label: 'Changes Requested', dotColor: 'bg-[#d97706]', textColor: 'text-[#b45309]' },
  { id: 'Approved', label: 'Approved', dotColor: 'bg-[#16a34a]', textColor: 'text-[#15803d]' },
  { id: 'Production', label: 'Production', dotColor: 'bg-[#ea580c]', textColor: 'text-[#c2410c]' },
  { id: 'Shipped', label: 'Shipped', dotColor: 'bg-[#2563eb]', textColor: 'text-[#1d4ed8]' },
  { id: 'Delivered', label: 'Delivered', dotColor: 'bg-[#16a34a]', textColor: 'text-[#15803d]' },
  { id: 'Cancelled', label: 'Cancelled', dotColor: 'bg-[#dc2626]', textColor: 'text-[#b91c1c]' },
]

export const ALL_PRIORITIES = [
  { id: 'No priority', label: 'No priority', dotColor: 'bg-[#1f2937]', textColor: 'text-[#374151]' },
  { id: 'Low', label: 'Low', dotColor: 'bg-[#6b7280]', textColor: 'text-[#4b5563]' },
  { id: 'Medium', label: 'Medium', dotColor: 'bg-[#2563eb]', textColor: 'text-[#2563eb]' },
  { id: 'High', label: 'High', dotColor: 'bg-[#b45309]', textColor: 'text-[#b45309]' },
  { id: 'Urgent', label: 'Urgent', dotColor: 'bg-[#dc2626]', textColor: 'text-[#dc2626]' },
]

const STAGES = ['All stages', ...ALL_STAGES.map(s => s.id)]

function paymentBadge(payment) {
  if (!payment) return null
  if (payment.is_full_paid) {
    return (
      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[11px] font-medium inline-block">
        Full Paid
      </span>
    )
  }
  const bal = (payment.base_price || 0) - (payment.advance_collected || 0)
  if (bal <= 0) {
    return (
      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[11px] font-medium inline-block">
        Full Paid
      </span>
    )
  }
  return (
    <span className="bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-full text-[11px] font-medium inline-block">
      Partial
    </span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('All stages')
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [view, setView] = useState('list') // 'list' | 'board'
  const [openStageMenuId, setOpenStageMenuId] = useState(null)
  const [openPriorityMenuId, setOpenPriorityMenuId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const [teamMembers, setTeamMembers] = useState([])
  const [teamFilter, setTeamFilter] = useState('All team')

  useEffect(() => {
    if (user) {
      loadOrders()
      loadProducts()
      teamService.getAll().then(setTeamMembers).catch(() => {})
    }
  }, [user, stageFilter])

  useEffect(() => {
    function handleClickOutside() {
      setOpenStageMenuId(null)
      setOpenPriorityMenuId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  async function handleUpdateOrderStage(orderId, newStage) {
    try {
      await ordersService.update(orderId, { progress: newStage })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, progress: newStage } : o))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, progress: newStage }))
      }
    } catch (err) {
      console.error('Failed to update stage:', err)
    }
  }

  async function handleUpdateOrderPriority(orderId, newPriority) {
    try {
      await ordersService.update(orderId, { priority: newPriority })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, priority: newPriority } : o))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, priority: newPriority }))
      }
    } catch (err) {
      console.error('Failed to update priority:', err)
    }
  }

  async function handleToggleCompleted(order) {
    const isCompleted = order.progress === 'Delivered'
    const nextStage = isCompleted ? 'Order Placed' : 'Delivered'
    try {
      await ordersService.update(order.id, { progress: nextStage })
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, progress: nextStage } : o))
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(prev => ({ ...prev, progress: nextStage }))
      }
    } catch (err) {
      console.error('Failed to toggle completion:', err)
    }
  }

  function handleCopyOrder(e, order) {
    e.stopPropagation()
    const total = order.order_items?.reduce((s, i) => s + (i.qty * i.unit_price), 0) || 0
    const productList = order.order_items?.length
      ? order.order_items.map(i => `${i.product_name || 'Product'} (Qty: ${i.qty || 1}${i.unit_price ? `, ₹${i.unit_price}` : ''})`).join(', ')
      : 'No items'

    const copyText = `Order ID: ${order.order_no}
Customer Name: ${order.customer?.name || 'Customer'}${order.customer?.phone ? ` (${order.customer.phone})` : ''}
Product Details: ${productList}
Total Amount: ₹${total.toLocaleString('en-IN')}
Stage: ${order.progress || 'Order Placed'}`

    navigator.clipboard.writeText(copyText)
    setCopiedId(order.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  async function loadOrders() {
    setLoading(true)
    setError('')
    try {
      const filters = {}
      if (stageFilter !== 'All stages') filters.stage = stageFilter
      if (search) filters.search = search
      const data = await ordersService.getAll(user.id, filters)
      setOrders(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  async function loadProducts() {
    try {
      const data = await productsService.getAll(user.id)
      setProducts(data || [])
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  function handleSearch(e) {
    setSearch(e.target.value)
  }

  function handleSearchSubmit(e) {
    if (e.key === 'Enter') loadOrders()
  }

  async function handleOrderCreated(newOrder) {
    setShowNewOrder(false)
    await loadOrders()
  }

  async function handleOrderUpdated(updatedOrder) {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
    if (selectedOrder?.id === updatedOrder.id) {
      setSelectedOrder(prev => ({ ...prev, ...updatedOrder }))
    }
  }

  async function handleDeleteOrder(orderId) {
    if (!window.confirm('Delete this order? This cannot be undone.')) return
    try {
      await ordersService.delete(orderId)
      setOrders(prev => prev.filter(o => o.id !== orderId))
      if (selectedOrder?.id === orderId) setSelectedOrder(null)
    } catch (err) {
      alert('Failed to delete order: ' + err.message)
    }
  }

  // Filtered in-memory for search & team
  const filteredOrders = orders.filter(o => {
    if (teamFilter !== 'All team' && o.assigned_to !== teamFilter) {
      return false
    }
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.order_no?.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.order_items?.some(i => i.product_name?.toLowerCase().includes(q))
    )
  })

  return (
    <AppLayout>
      <Header
        title="Orders"
        subtitle={`${orders.length} orders this month`}
        actions={
          <Button onClick={() => setShowNewOrder(true)} size="sm">
            <Plus size={14} />
            New Order
          </Button>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all ${selectedOrder ? 'hidden md:flex' : 'flex'}`}>
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white"
                placeholder="Search orders…"
                value={search}
                onChange={handleSearch}
                onKeyDown={handleSearchSubmit}
              />
            </div>

            {/* Stage filter */}
            <div className="relative">
              <select
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
                className="appearance-none text-sm border border-gray-200 rounded-lg px-3 py-1.5 pr-7 outline-none focus:border-gray-400 bg-white text-gray-700"
              >
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Team filter */}
            <div className="relative">
              <select
                value={teamFilter}
                onChange={e => setTeamFilter(e.target.value)}
                className="appearance-none text-sm border border-gray-200 rounded-lg px-3 py-1.5 pr-7 outline-none focus:border-gray-400 bg-white text-gray-700"
              >
                <option value="All team">All team</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Date filter */}
            <div className="relative">
              <select className="appearance-none text-sm border border-gray-200 rounded-lg px-3 py-1.5 pr-7 outline-none focus:border-gray-400 bg-white text-gray-700">
                <option>Last 12 months</option>
                <option>Last 6 months</option>
                <option>Last 3 months</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* View toggle */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <List size={13} /> List
              </button>
              <button
                onClick={() => setView('board')}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${view === 'board' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <LayoutGrid size={13} /> Board
              </button>
              <button className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
                <Users size={13} /> Group by customer
              </button>
            </div>

            <span className="text-xs text-gray-400 whitespace-nowrap">{filteredOrders.length}/30 orders</span>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20 text-red-500 text-sm">{error}</div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <List size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No orders yet</p>
                <p className="text-xs mt-1">Click "New Order" to create your first order.</p>
              </div>
            ) : view === 'board' ? (
              /* Board Kanban View */
              <div className="flex gap-4 p-4 overflow-x-auto h-full items-start">
                {[
                  { id: 'Order Placed', label: 'ORDER PLACED', bg: 'bg-white' },
                  { id: 'Reviewing Details', label: 'REVIEWING DETAILS', bg: 'bg-[#f4f7fa]' },
                  { id: 'Work in Progress', label: 'WORK IN PROGRESS', bg: 'bg-[#f0f5fc]' },
                  { id: 'Internal Review', label: 'INTERNAL REVIEW', bg: 'bg-[#faf6f0]' },
                  { id: 'Preview Sent', label: 'PREVIEW SENT', bg: 'bg-[#f2f8f9]' },
                  { id: 'Changes Requested', label: 'CHANGES REQUESTED', bg: 'bg-[#fbf4f2]' },
                ].map(column => {
                  const colOrders = filteredOrders.filter(o => (o.progress || 'Order Placed') === column.id || (column.id === 'Order Placed' && !['Reviewing Details', 'Work in Progress', 'Internal Review', 'Preview Sent', 'Changes Requested'].includes(o.progress)))
                  return (
                    <div
                      key={column.id}
                      className="w-72 flex-shrink-0 flex flex-col rounded-xl overflow-hidden border border-gray-100/80 shadow-xs"
                      style={{ backgroundColor: column.id === 'Order Placed' ? '#fcfdfd' : undefined }}
                    >
                      <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-100 bg-white">
                        <span className="text-[11px] font-semibold text-gray-700 tracking-wider">
                          {column.label}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {colOrders.length}
                        </span>
                      </div>
                      
                      <div className={`p-3 min-h-[420px] flex flex-col gap-2.5 ${column.bg}`}>
                        {colOrders.map(order => {
                          const total = order.order_items?.reduce((s, i) => s + (i.qty * i.unit_price), 0) || 0
                          const productNames = order.order_items?.map(i => i.product_name).filter(Boolean).join(', ') || 'dd · Albums'
                          return (
                            <div
                              key={order.id}
                              onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                              className="bg-white rounded-lg p-3.5 border border-gray-200/70 shadow-xs hover:shadow-sm cursor-pointer transition-all"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-xs text-gray-900">{order.customer?.name || 'Customer'}</p>
                                  <p className="text-[11px] text-gray-500 mt-0.5">{productNames}</p>
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono">{order.order_no}</span>
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                  <span>📅</span> {formatDate(order.due_date)}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-gray-900">
                                    ₹{total.toLocaleString('en-IN')}
                                  </span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                </div>
                              </div>
                            </div>
                          )
                        })}

                        {colOrders.length === 0 && (
                          <div className="flex-1 flex items-center justify-center py-12 text-xs text-blue-400/60 font-medium">
                            Drop here
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white border-b border-gray-100 z-10">
                  <tr>
                    <th className="w-8 px-4 py-3">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Order #</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Customer</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Product</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Amount</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Assigned</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Stage</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Priority</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Payment</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Due ↑</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.map(order => {
                    const total = order.order_items?.reduce((s, i) => s + (i.qty * i.unit_price), 0) || 0
                    const productNames = order.order_items?.map(i => i.product_name).filter(Boolean).join(', ') || '—'
                    const isSelected = selectedOrder?.id === order.id
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(isSelected ? null : order)}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        <td className="px-3 py-3 text-gray-500 text-xs font-mono">{order.order_no}</td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-900 text-xs">{order.customer?.name || '—'}</p>
                          {order.customer?.phone && <p className="text-gray-400 text-[10px]">{order.customer.phone}</p>}
                        </td>
                        <td className="px-3 py-3 text-gray-600 text-xs max-w-[120px] truncate">{productNames}</td>
                        <td className="px-3 py-3 text-gray-900 text-xs font-medium">
                          {total > 0 ? `₹${total.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-3 py-3">
                          {order.assigned_to ? (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                              {order.assigned_to.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        {/* Stage Dropdown Cell */}
                        <td className="px-3 py-3 relative" onClick={e => e.stopPropagation()}>
                          {(() => {
                            const curStage = ALL_STAGES.find(s => s.id === (order.progress || 'Order Placed')) || ALL_STAGES[0]
                            return (
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenStageMenuId(openStageMenuId === order.id ? null : order.id)
                                    setOpenPriorityMenuId(null)
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f3f4f6] hover:bg-gray-200 text-gray-700 transition-colors"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${curStage.dotColor}`} />
                                  <span>{curStage.label}</span>
                                </button>

                                {openStageMenuId === order.id && (
                                  <div className="absolute left-0 top-full mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 min-w-[175px] max-h-80 overflow-y-auto">
                                    {ALL_STAGES.map(s => {
                                      const isCurrent = (order.progress || 'Order Placed') === s.id
                                      return (
                                        <button
                                          key={s.id}
                                          type="button"
                                          onClick={() => {
                                            handleUpdateOrderStage(order.id, s.id)
                                            setOpenStageMenuId(null)
                                          }}
                                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors ${
                                            isCurrent ? 'bg-gray-50 font-semibold text-gray-900' : ''
                                          }`}
                                        >
                                          <span className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${s.dotColor}`} />
                                            <span className={s.textColor}>{s.label}</span>
                                          </span>
                                          {isCurrent && <Check size={13} className="text-gray-900 ml-2" />}
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </td>

                        {/* Priority Dropdown Cell */}
                        <td className="px-3 py-3 relative" onClick={e => e.stopPropagation()}>
                          {(() => {
                            const curPri = ALL_PRIORITIES.find(p => p.id === (order.priority || 'No priority')) || ALL_PRIORITIES[0]
                            return (
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenPriorityMenuId(openPriorityMenuId === order.id ? null : order.id)
                                    setOpenStageMenuId(null)
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f3f4f6] hover:bg-gray-200 text-gray-700 transition-colors"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${curPri.dotColor}`} />
                                  <span>{curPri.label}</span>
                                </button>

                                {openPriorityMenuId === order.id && (
                                  <div className="absolute left-0 top-full mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 min-w-[140px]">
                                    {ALL_PRIORITIES.map(p => {
                                      const isCurrent = (order.priority || 'No priority') === p.id
                                      return (
                                        <button
                                          key={p.id}
                                          type="button"
                                          onClick={() => {
                                            handleUpdateOrderPriority(order.id, p.id)
                                            setOpenPriorityMenuId(null)
                                          }}
                                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors ${
                                            isCurrent ? 'bg-gray-50 font-semibold text-gray-900' : ''
                                          }`}
                                        >
                                          <span className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${p.dotColor}`} />
                                            <span className={p.textColor}>{p.label}</span>
                                          </span>
                                          {isCurrent && <Check size={13} className="text-gray-900 ml-2" />}
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </td>

                        <td className="px-3 py-3">{paymentBadge(order.payment)}</td>
                        <td className="px-3 py-3 text-xs text-gray-500">{formatDate(order.due_date)}</td>
                        
                        {/* Actions Cell */}
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            {/* Mark as completed icon */}
                            <button
                              title={order.progress === 'Delivered' ? 'Completed (Click to uncomplete)' : 'Mark as completed'}
                              onClick={() => handleToggleCompleted(order)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                order.progress === 'Delivered'
                                  ? 'border border-emerald-500 bg-emerald-50 text-emerald-600'
                                  : 'border border-gray-300 text-gray-400 hover:border-emerald-500 hover:text-emerald-500'
                              }`}
                            >
                              {order.progress === 'Delivered' ? (
                                <Check size={13} className="stroke-[2.5]" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-gray-300 hover:border-emerald-500 transition-colors" />
                              )}
                            </button>

                            {/* Message / Chat icon */}
                            <button
                              title="Chat / Messages"
                              className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <MessageSquare size={13} />
                            </button>

                            {/* Copy icon (Copies order ID, customer name, product details) */}
                            <button
                              title={copiedId === order.id ? 'Copied details!' : 'Copy order details'}
                              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                                copiedId === order.id
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                                  : 'border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                              }`}
                              onClick={(e) => handleCopyOrder(e, order)}
                            >
                              {copiedId === order.id ? (
                                <Check size={13} className="text-emerald-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>

                            {/* External link / Open detail panel */}
                            <button
                              title="View order details"
                              className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <ExternalLink size={13} />
                            </button>

                            {/* Delete order */}
                            <button
                              title="Delete order"
                              className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-400 transition-colors"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              <Trash2 size={13} />
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

        {/* Order detail panel */}
        {selectedOrder && (
          <OrderDetailPanel
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdated={handleOrderUpdated}
            onDeleted={(deletedId) => {
              setOrders(prev => prev.filter(o => o.id !== (deletedId || selectedOrder.id)))
              setSelectedOrder(null)
              loadOrders()
            }}
            products={products}
          />
        )}
      </div>

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={showNewOrder}
        onClose={() => setShowNewOrder(false)}
        onCreated={handleOrderCreated}
        products={products}
      />

      {/* Floating Copied Toast Feedback */}
      {copiedId && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111317] text-white border border-emerald-500/30 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in fade-in duration-200">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
            ✓
          </span>
          <span className="text-xs font-medium text-gray-200">
            Order ID, customer & products copied!
          </span>
        </div>
      )}
    </AppLayout>
  )
}
