import { useState, useEffect } from 'react'
import { ordersService } from '../../services/ordersService'
import { DJ_CATALOG_PRODUCTS } from '../../services/productsService'
import { teamService } from '../../services/teamService'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { Plus, X } from 'lucide-react'

const PROGRESS_OPTIONS = ['Order Placed', 'In Progress', 'Ready', 'Delivered', 'Cancelled']
const PRIORITY_OPTIONS = ['No priority', 'Low', 'Medium', 'High', 'Urgent']

export default function NewOrderModal({ isOpen, onClose, onCreated, products = [], initialCustomer = null }) {
  const availableProducts = (products && products.length > 2) ? products : DJ_CATALOG_PRODUCTS
  const { user, profile } = useAuth()
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  const emptyItem = { product_id: '', product_name: '', qty: 1, unit_price: '' }
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    due_date: '',
    assigned_to: '',
    notes: '',
    items: [{ ...emptyItem }],
  })

  useEffect(() => {
    if (isOpen) {
      teamService.getAll().then(setTeamMembers).catch(() => {})
      if (initialCustomer) {
        setForm(prev => ({
          ...prev,
          customer_name: initialCustomer.name || '',
          customer_email: initialCustomer.email || '',
          customer_phone: initialCustomer.phone || '',
        }))
      }
    } else {
      setForm({ customer_name: '', customer_email: '', customer_phone: '', due_date: '', assigned_to: '', notes: '', items: [{ ...emptyItem }] })
      setErrors({})
      setError('')
    }
  }, [isOpen, initialCustomer])

  if (!isOpen) return null

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function updateItem(idx, field, value) {
    setForm(prev => {
      const items = [...prev.items]
      items[idx] = { ...items[idx], [field]: value }
      // If product selected, fill name and price
      if (field === 'product_id' && value) {
        const prod = availableProducts.find(p => p.id === value)
        if (prod) {
          items[idx].product_name = prod.name
          items[idx].unit_price = prod.price
        }
      }
      return { ...prev, items }
    })
  }

  function addItem() {
    setForm(prev => ({ ...prev, items: [...prev.items, { ...emptyItem }] }))
  }

  function removeItem(idx) {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))
  }

  function validate() {
    return {}
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const custName = form.customer_name?.trim() || 'New Customer'
      const orderData = {
        customer_name: custName,
        customer_email: form.customer_email?.trim() || '',
        customer_phone: form.customer_phone?.trim() || '',
        due_date: form.due_date || null,
        assigned_to: form.assigned_to || null,
        notes: form.notes || null,
        items: form.items
          .filter(i => (i.product_name && i.product_name.trim()) || i.product_id || Number(i.unit_price) > 0)
          .map(i => ({
            product_id: i.product_id || null,
            product_name: i.product_name || (products.find(p => p.id === i.product_id)?.name) || 'Custom Item',
            qty: Number(i.qty) || 1,
            unit_price: Number(i.unit_price) || 0,
          })),
      }
      if (orderData.items.length === 0) {
        orderData.items = [{ product_name: 'Custom Item', qty: 1, unit_price: 0 }]
      }
      const created = await ordersService.create(user.id, orderData)
      onCreated(created)
    } catch (err) {
      setError(err.message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const grandTotal = form.items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unit_price) || 0), 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.currentTarget === e.target) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">New Order</h2>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-5 space-y-4" noValidate>
          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          {/* Customer row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Customer name" placeholder="Customer name"
              value={form.customer_name} onChange={e => updateField('customer_name', e.target.value)} />
            <Input label="Email" type="email" placeholder="Email address"
              value={form.customer_email} onChange={e => updateField('customer_email', e.target.value)} />
            <Input label="Phone" placeholder="Phone number"
              value={form.customer_phone} onChange={e => updateField('customer_phone', e.target.value)} />
          </div>

          {/* Order meta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Order No" placeholder="Auto-generated" disabled className="bg-gray-50" />
            <Input label="Due date" type="date"
              value={form.due_date} onChange={e => updateField('due_date', e.target.value)} />
            <Select label="Assigned to" value={form.assigned_to} onChange={e => updateField('assigned_to', e.target.value)}>
              <option value="">Unassigned</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.name}>
                  {m.name} ({m.role})
                </option>
              ))}
            </Select>
          </div>

          {/* Products */}
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Products</p>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  {/* Product selector */}
                  <div className="flex-1">
                    <select
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 bg-white"
                      value={item.product_id}
                      onChange={e => updateItem(idx, 'product_id', e.target.value)}
                    >
                      <option value="">Product {idx + 1} — select…</option>
                      {['Thali & Dinner Sets', 'Kids Lunch Box & School Sets', 'Wallets & Gift Combos', 'Rakhi Collection'].map(cat => {
                        const catProducts = availableProducts.filter(p => p.category === cat)
                        if (catProducts.length === 0) return null
                        return (
                          <optgroup key={cat} label={`── ${cat} ──`}>
                            {catProducts.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} — ₹{p.price}
                              </option>
                            ))}
                          </optgroup>
                        )
                      })}
                      {availableProducts.filter(p => !['Thali & Dinner Sets', 'Kids Lunch Box & School Sets', 'Wallets & Gift Combos', 'Rakhi Collection'].includes(p.category)).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ₹{p.price}
                        </option>
                      ))}
                      <option value="__custom">Custom Product…</option>
                    </select>
                    {errors[`item_name_${idx}`] && (
                      <p className="text-xs text-red-500 mt-0.5">{errors[`item_name_${idx}`]}</p>
                    )}
                  </div>

                  {/* Qty */}
                  <input
                    type="number" min="1"
                    className="w-14 text-sm border border-gray-200 rounded-lg px-2 py-2 outline-none focus:border-gray-400 text-center"
                    value={item.qty}
                    onChange={e => updateItem(idx, 'qty', e.target.value)}
                  />

                  {/* Price */}
                  <div className="w-24">
                    <input
                      type="number" min="0" placeholder="Price"
                      className={`w-full text-sm border rounded-lg px-2 py-2 outline-none focus:border-gray-400 ${errors[`item_price_${idx}`] ? 'border-red-300' : 'border-gray-200'}`}
                      value={item.unit_price}
                      onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                    />
                  </div>

                  {/* Remove */}
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="mt-2 text-gray-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mt-2 transition-colors"
            >
              <Plus size={12} /> Add another product
            </button>

            {grandTotal > 0 && (
              <div className="flex justify-between text-sm font-semibold text-gray-900 mt-3 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Notes</label>
            <textarea
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 resize-none"
              rows={3}
              placeholder="Notes / instructions…"
              value={form.notes}
              onChange={e => updateField('notes', e.target.value)}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" loading={loading}>Create Order</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
