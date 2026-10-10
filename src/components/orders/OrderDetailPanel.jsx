import { useState, useEffect } from 'react'
import { ordersService } from '../../services/ordersService'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Badge from '../ui/Badge'
import Spinner from '../ui/Spinner'
import {
  X, Phone, MessageCircle, Mail, Plus, Pencil, Trash2,
  Calendar, ChevronDown, Check
} from 'lucide-react'

const TABS = ['Updates', 'Details', 'Files', 'Form', 'Customer History']
const PROGRESS_OPTIONS = ['Order Placed', 'In Progress', 'Ready', 'Delivered', 'Cancelled']
const PRIORITY_OPTIONS = ['No priority', 'Low', 'Medium', 'High', 'Urgent']

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatCurrency(n) {
  if (n === null || n === undefined) return '₹0'
  return `₹${Number(n).toLocaleString('en-IN')}`
}

export default function OrderDetailPanel({ order: initialOrder, onClose, onUpdated, onDeleted, products = [] }) {
  const [order, setOrder] = useState(initialOrder)
  const [tab, setTab] = useState('Details')
  const [saving, setSaving] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({ product_id: '', product_name: '', qty: 1, unit_price: '' })
  const [editItemId, setEditItemId] = useState(null)
  const [editItemData, setEditItemData] = useState({})

  async function handleDelete() {
    if (!window.confirm('Delete this order permanently? This cannot be undone.')) return
    setSaving(true)
    try {
      await ordersService.delete(order.id)
      onDeleted(order.id)
    } catch (err) {
      alert('Failed to delete order: ' + err.message)
      setSaving(false)
    }
  }

  // Refresh when a different order is clicked
  useEffect(() => {
    setOrder(initialOrder)
    setTab('Details')
    setAddingItem(false)
    setEditItemId(null)
  }, [initialOrder?.id])

  async function patchOrder(field, value) {
    setSaving(true)
    try {
      const updated = await ordersService.update(order.id, { [field]: value })
      const merged = { ...order, ...updated }
      setOrder(merged)
      onUpdated(merged)
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddItem() {
    if (!newItem.product_name && !newItem.product_id) return
    if (!newItem.unit_price) return
    setSaving(true)
    try {
      const prodName = newItem.product_name ||
        products.find(p => p.id === newItem.product_id)?.name || 'Item'
      const item = await ordersService.addOrderItem(order.id, {
        product_id: newItem.product_id || null,
        product_name: prodName,
        qty: Number(newItem.qty) || 1,
        unit_price: Number(newItem.unit_price),
      })
      const updatedItems = [...(order.order_items || []), item]
      const newTotal = updatedItems.reduce((s, i) => s + i.qty * i.unit_price, 0)
      // Update payment base price
      if (order.payment) {
        await ordersService.updatePayment(order.id, {
          base_price: newTotal,
          advance_due: newTotal,
          advance_collected: newTotal,
          balance_due: 0,
          is_full_paid: true,
        })
      }
      setOrder(prev => ({ ...prev, order_items: updatedItems }))
      setNewItem({ product_id: '', product_name: '', qty: 1, unit_price: '' })
      setAddingItem(false)
    } catch (err) {
      alert('Failed to add item: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteItem(itemId) {
    if (!window.confirm('Remove this item?')) return
    setSaving(true)
    try {
      await ordersService.deleteOrderItem(itemId)
      const updatedItems = (order.order_items || []).filter(i => i.id !== itemId)
      setOrder(prev => ({ ...prev, order_items: updatedItems }))
    } catch (err) {
      alert('Failed to delete item: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEditItem() {
    setSaving(true)
    try {
      const updated = await ordersService.updateOrderItem(editItemId, {
        product_name: editItemData.product_name,
        qty: Number(editItemData.qty),
        unit_price: Number(editItemData.unit_price),
      })
      setOrder(prev => ({
        ...prev,
        order_items: prev.order_items.map(i => i.id === editItemId ? { ...i, ...updated } : i),
      }))
      setEditItemId(null)
    } catch (err) {
      alert('Failed to update item: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleAdvance(checked) {
    setSaving(true)
    try {
      const basePrice = order.payment?.base_price || 0
      const updated = await ordersService.updatePayment(order.id, {
        advance_collected: checked ? basePrice : 0,
        is_full_paid: checked,
        balance_due: checked ? 0 : basePrice,
      })
      setOrder(prev => ({ ...prev, payment: { ...prev.payment, ...updated } }))
    } catch (err) {
      alert('Failed to update payment: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const orderItems = order.order_items || []
  const subtotal = orderItems.reduce((s, i) => s + i.qty * i.unit_price, 0)
  const payment = order.payment || {}

  return (
    <div className="w-full md:w-[340px] lg:w-[380px] flex-shrink-0 border-l border-gray-200 bg-white flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-gray-100">
        <div>
          <p className="text-[10px] text-gray-400 font-mono">{order.order_no}</p>
          <h2 className="text-base font-semibold text-gray-900 mt-0.5">{order.customer?.name || 'Unnamed'}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="order-placed">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block mr-1" />
              {order.progress || 'Order Placed'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" className="text-xs gap-1">
            <MessageCircle size={12} /> Message
          </Button>
          <Button size="sm" variant="secondary" className="text-xs gap-1"
            onClick={() => navigator.clipboard.writeText(window.location.href + '?order=' + order.id)}>
            🔗 Copy link
          </Button>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 ml-1">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-2">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'Details' && (
          <div className="p-5 space-y-5">
            {saving && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Spinner size="sm" /> Saving…
              </div>
            )}

            {/* Customer contact */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer</p>
              <div className="flex items-center gap-2 flex-wrap">
                {order.customer?.phone && (
                  <a href={`tel:${order.customer.phone}`}
                    className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg text-gray-700 transition-colors">
                    <Phone size={11} /> {order.customer.phone}
                  </a>
                )}
                {order.customer?.phone && (
                  <a href={`https://wa.me/${order.customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg text-green-700 transition-colors">
                    <MessageCircle size={11} /> WhatsApp
                  </a>
                )}
                {order.customer?.email && (
                  <a href={`mailto:${order.customer.email}`}
                    className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg text-gray-700 transition-colors">
                    <Mail size={11} /> {order.customer.email}
                  </a>
                )}
              </div>
            </div>

            {/* Progress + Assigned */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Progress</p>
                <select
                  value={order.progress || 'Order Placed'}
                  onChange={e => patchOrder('progress', e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-gray-400 bg-white"
                >
                  {PROGRESS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Assigned to</p>
                <input
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-gray-400"
                  defaultValue={order.assigned_to || ''}
                  onBlur={e => patchOrder('assigned_to', e.target.value)}
                  placeholder="Unassigned"
                />
              </div>
            </div>

            {/* Due date */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Due date</p>
              <div className="relative">
                <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-2 outline-none focus:border-gray-400"
                  defaultValue={order.due_date?.split('T')[0] || ''}
                  onBlur={e => patchOrder('due_date', e.target.value || null)}
                />
              </div>
            </div>

            {/* Priority + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Priority</p>
                <select
                  value={order.priority || 'No priority'}
                  onChange={e => patchOrder('priority', e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-gray-400"
                >
                  {PRIORITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={order.progress === 'Delivered'}
                    onChange={() => patchOrder('progress', 'Delivered')}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-xs text-gray-600">Mark done</span>
                </label>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">Order Items</p>
                <button
                  onClick={() => setAddingItem(true)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <Plus size={12} /> Add Item
                </button>
              </div>

              {orderItems.length > 0 && (
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-400 font-medium uppercase tracking-wider">Item</th>
                        <th className="text-center px-2 py-2 text-gray-400 font-medium uppercase tracking-wider">Qty</th>
                        <th className="text-right px-2 py-2 text-gray-400 font-medium uppercase tracking-wider">Price</th>
                        <th className="text-right px-2 py-2 text-gray-400 font-medium uppercase tracking-wider">Total</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orderItems.map(item => (
                        <tr key={item.id}>
                          {editItemId === item.id ? (
                            <>
                              <td className="px-2 py-1.5">
                                <input
                                  className="w-full text-xs border border-gray-300 rounded px-1.5 py-1 outline-none"
                                  value={editItemData.product_name}
                                  onChange={e => setEditItemData(p => ({ ...p, product_name: e.target.value }))}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input type="number" min="1"
                                  className="w-12 text-xs border border-gray-300 rounded px-1 py-1 outline-none text-center"
                                  value={editItemData.qty}
                                  onChange={e => setEditItemData(p => ({ ...p, qty: e.target.value }))}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input type="number" min="0"
                                  className="w-16 text-xs border border-gray-300 rounded px-1 py-1 outline-none text-right"
                                  value={editItemData.unit_price}
                                  onChange={e => setEditItemData(p => ({ ...p, unit_price: e.target.value }))}
                                />
                              </td>
                              <td className="px-2 py-1.5 text-right">
                                {formatCurrency(editItemData.qty * editItemData.unit_price)}
                              </td>
                              <td className="px-2 py-1.5">
                                <button onClick={handleSaveEditItem} className="text-green-600 hover:text-green-700">
                                  <Check size={13} />
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-2 text-gray-800">{item.product_name}</td>
                              <td className="px-2 py-2 text-center text-gray-600">{item.qty}</td>
                              <td className="px-2 py-2 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                              <td className="px-2 py-2 text-right font-medium text-gray-900">
                                {formatCurrency(item.qty * item.unit_price)}
                              </td>
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => { setEditItemId(item.id); setEditItemData({ product_name: item.product_name, qty: item.qty, unit_price: item.unit_price }) }}
                                    className="text-gray-400 hover:text-gray-700"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-xs text-gray-500">
                          Subtotal ({orderItems.length} item{orderItems.length !== 1 ? 's' : ''})
                        </td>
                        <td className="px-2 py-2 text-right text-xs font-medium text-gray-900">
                          {formatCurrency(subtotal)}
                        </td>
                        <td />
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-gray-900">Grand total</td>
                        <td className="px-2 py-2 text-right text-xs font-bold text-gray-900">
                          {formatCurrency(subtotal)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Tags */}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {['Service', 'Albums'].map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>

              {/* Add item row */}
              {addingItem && (
                <div className="mt-3 p-3 border border-dashed border-gray-300 rounded-lg space-y-2">
                  <p className="text-xs font-medium text-gray-600">New Item</p>
                  <div className="flex gap-2">
                    {products.length > 0 ? (
                      <select
                        className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-gray-400"
                        value={newItem.product_id}
                        onChange={e => {
                          const prod = products.find(p => p.id === e.target.value)
                          setNewItem(prev => ({
                            ...prev,
                            product_id: e.target.value,
                            product_name: prod?.name || '',
                            unit_price: prod?.price || '',
                          }))
                        }}
                      >
                        <option value="">Select product…</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    ) : (
                      <input
                        className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-gray-400"
                        placeholder="Item name"
                        value={newItem.product_name}
                        onChange={e => setNewItem(p => ({ ...p, product_name: e.target.value }))}
                      />
                    )}
                    <input type="number" min="1" placeholder="Qty"
                      className="w-14 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-gray-400 text-center"
                      value={newItem.qty}
                      onChange={e => setNewItem(p => ({ ...p, qty: e.target.value }))}
                    />
                    <input type="number" min="0" placeholder="₹"
                      className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-gray-400"
                      value={newItem.unit_price}
                      onChange={e => setNewItem(p => ({ ...p, unit_price: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={handleAddItem} loading={saving}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setAddingItem(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700">Payment</p>
                {payment.is_full_paid && (
                  <Badge variant="full-paid">Full Paid</Badge>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Base price</span>
                  <span>{formatCurrency(payment.base_price)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Advance due</span>
                  <span>{formatCurrency(payment.advance_due)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Balance due</span>
                  <span>{formatCurrency(payment.balance_due)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => handleToggleAdvance(!payment.is_full_paid)}
                      className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${payment.is_full_paid ? 'bg-gray-900' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${payment.is_full_paid ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className="text-gray-700 font-medium">Advance collected</span>
                  </label>
                  <span className="font-semibold text-gray-900">{formatCurrency(payment.advance_collected)}</span>
                </div>
              </div>
            </div>

            {/* Delete order */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors py-1 px-2 rounded hover:bg-red-50"
              >
                <Trash2 size={13} /> Delete order
              </button>
            </div>
          </div>
        )}

        {tab === 'Updates' && (
          <div className="p-5 space-y-6">
            {/* Order Progress indicator */}
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Order Progress</p>
              <div className="flex gap-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="w-1/10 bg-gray-900 rounded-full" />
                <div className="flex-1 bg-gray-200" />
              </div>
              <div className="flex justify-between items-center text-xs mt-2 text-gray-600">
                <span className="font-semibold text-gray-900">Order Placed <span className="text-gray-400 font-normal">1/10</span></span>
                <span className="text-gray-400 text-[11px]">Next: Reviewing Details</span>
              </div>
            </div>

            {/* Preview Section */}
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview</p>
              <div className="space-y-2">
                <input
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 placeholder:text-gray-400"
                  placeholder="Preview label"
                />
                <button
                  type="button"
                  className="w-full border border-gray-900 text-gray-900 font-semibold text-xs py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>📤</span> Share preview
                </button>
                <p className="text-[10px] text-gray-400">
                  Image, PDF or video · Client will see it and can leave feedback or approve
                </p>
              </div>
            </div>

            {/* Chat Section */}
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Chat</p>
              <div className="border border-gray-200 rounded-xl p-4 flex flex-col min-h-[160px] justify-between">
                <p className="text-xs text-gray-400 text-center my-auto">No messages yet.</p>
                <div className="flex items-center gap-2 mt-2">
                  <button className="text-gray-400 hover:text-gray-600">📎</button>
                  <input
                    placeholder="Type a message..."
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-gray-400"
                  />
                  <button className="bg-gray-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-600">
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'Files' && (
          <div className="p-5 space-y-6">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Files Shared</p>
              <div className="space-y-2">
                <input
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 placeholder:text-gray-400"
                  placeholder="Note (optional)"
                />
                <button
                  type="button"
                  className="w-full border border-dashed border-gray-300 text-gray-700 font-semibold text-xs py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>📤</span> Upload file
                </button>
                <p className="text-xs text-gray-400 text-center py-6">No files shared yet</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 font-medium">Business storage</span>
                <span className="text-gray-700 font-mono text-[11px]">0 MB / 500 MB</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="w-0 bg-emerald-500 h-full rounded-full" />
              </div>
            </div>
          </div>
        )}

        {tab === 'Form' && (
          <div className="p-5 text-center text-gray-400 py-20">
            <p className="text-sm font-medium text-gray-600">No form linked</p>
            <p className="text-xs text-gray-400 mt-1">Order details and questions submitted by client will appear here.</p>
          </div>
        )}

        {tab === 'Customer History' && (
          <div className="p-5 space-y-6">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Other orders from {order.customer?.name || 'Customer'}
            </p>
            <div className="text-center py-16 space-y-3">
              <p className="text-xs text-gray-600">
                This is {order.customer?.name || 'Customer'}'s first order. 🎉
              </p>
              <button
                type="button"
                className="text-xs font-semibold text-gray-900 hover:underline inline-flex items-center gap-1"
              >
                View full profile →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
