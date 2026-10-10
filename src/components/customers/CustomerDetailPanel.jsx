import { useState } from 'react'
import {
  X, Phone, Mail, MessageCircle, Plus, Trash2,
  Calendar, ExternalLink, Package
} from 'lucide-react'

export default function CustomerDetailPanel({
  customer,
  onClose,
  onDelete,
  onCreateOrder,
  orders = [],
}) {
  if (!customer) return null

  // Filter orders belonging to this customer
  const customerOrders = orders.filter(o => {
    return (
      o.customer_id === customer.id ||
      o.customer?.id === customer.id ||
      (o.customer?.name && o.customer.name.toLowerCase() === customer.name?.toLowerCase()) ||
      (o.customer?.phone && o.customer.phone === customer.phone)
    )
  })

  // Calculate stats
  const orderCount = customerOrders.length
  const totalSpent = customerOrders.reduce((sum, o) => {
    const orderSum = o.order_items?.reduce((s, i) => s + (i.qty * i.unit_price || 0), 0) || 0
    return sum + orderSum
  }, 0)

  // Last order date
  const sortedOrders = [...customerOrders].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  const lastOrder = sortedOrders[0]
  const lastOrderFormatted = lastOrder?.created_at
    ? new Date(lastOrder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
    : '—'

  // Most ordered product
  const productCounts = {}
  customerOrders.forEach(o => {
    o.order_items?.forEach(i => {
      const name = i.product_name || 'Product'
      productCounts[name] = (productCounts[name] || 0) + (i.qty || 1)
    })
  })
  const mostOrderedProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  const averageOrderValue = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0

  const initials = customer.name?.charAt(0).toUpperCase() || '?'
  const cleanPhone = customer.phone?.replace(/[^0-9]/g, '') || ''
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}` : null

  return (
    <aside className="w-full md:w-[440px] lg:w-[480px] h-full bg-white border-l border-gray-200 flex flex-col flex-shrink-0 z-20 shadow-xl overflow-hidden">
      {/* Mobile Back Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-gray-700 font-semibold hover:text-gray-900 py-1"
        >
          <span>←</span> Back to customers
        </button>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
          <X size={15} />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
            {initials}
          </div>
          <div>
            <h2 className="font-bold text-base text-gray-900 leading-tight">
              {customer.name || 'Customer'}
            </h2>
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium inline-block mt-0.5">
              {customer.source || 'Manual'}
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5">
          <button
            title="Delete customer"
            onClick={() => onDelete(customer.id, customer.name)}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <button
            title="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Contact Section */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            Contact
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {customer.phone ? (
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Phone size={12} className="text-gray-400" />
                <span>{customer.phone}</span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-gray-400 border border-gray-100 bg-gray-50">
                <Phone size={12} className="text-gray-300" />
                <span>No phone</span>
              </span>
            )}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle size={13} className="text-emerald-600 fill-emerald-600" />
                <span>WhatsApp</span>
              </a>
            )}

            {customer.email ? (
              <a
                href={`mailto:${customer.email}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Mail size={12} className="text-gray-400" />
                <span>{customer.email}</span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-gray-400 border border-gray-100 bg-gray-50">
                <Mail size={12} className="text-gray-300" />
                <span>No email</span>
              </span>
            )}
          </div>
        </div>

        {/* 3 Metrics Counter Row */}
        <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-100 text-center">
          <div>
            <p className="text-xl font-extrabold text-gray-900">{orderCount}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">
              Total orders
            </p>
          </div>
          <div className="border-x border-gray-100">
            <p className="text-xl font-extrabold text-gray-900">₹{totalSpent.toLocaleString('en-IN')}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">
              Total spent
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mt-1">{lastOrderFormatted}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">
              Last order
            </p>
          </div>
        </div>

        {/* Order History Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Order history
            </p>
            <button
              onClick={() => onCreateOrder(customer)}
              className="bg-black hover:bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 transition-colors shadow-xs"
            >
              <Plus size={12} />
              <span>Create order</span>
            </button>
          </div>

          {customerOrders.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400">
              <Package size={24} className="mx-auto mb-1.5 opacity-40" />
              <p className="text-xs font-medium text-gray-500">No orders yet</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Click "+ Create order" to place an order for this customer.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {customerOrders.map(order => {
                const orderTotal = order.order_items?.reduce((s, i) => s + (i.qty * i.unit_price || 0), 0) || 0
                const productSummary = order.order_items?.map(i => i.product_name).filter(Boolean).join(', ') || 'Custom Product'
                const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : ''
                const dueDate = order.due_date ? new Date(order.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : ''

                return (
                  <div
                    key={order.id}
                    className="border border-gray-200/90 rounded-xl p-3.5 hover:border-gray-300 transition-colors bg-white shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-xs text-gray-900 leading-tight">
                          {productSummary}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-gray-500">{order.order_no}</span>
                          {orderDate && <span>· {orderDate}</span>}
                          {dueDate && (
                            <span className="flex items-center gap-0.5 text-gray-500">
                              <span>📅</span> Due {dueDate}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="font-extrabold text-sm text-gray-900">
                          ₹{orderTotal.toLocaleString('en-IN')}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-200/60">
                            paid
                          </span>
                          <span className="border border-gray-200 text-gray-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                            new
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Lifetime Value Section */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Lifetime value
          </p>
          <div className="bg-[#fafbfc] border border-gray-100 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-gray-600">
              <span>Most ordered product</span>
              <span className="font-semibold text-gray-900 max-w-[200px] truncate text-right">
                {mostOrderedProduct}
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-600 pt-1 border-t border-gray-100/80">
              <span>Average order value</span>
              <span className="font-semibold text-gray-900">
                {averageOrderValue > 0 ? `₹${averageOrderValue.toLocaleString('en-IN')}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-600 pt-1 border-t border-gray-100/80">
              <span className="font-medium text-gray-700">Total revenue</span>
              <span className="font-extrabold text-gray-900 text-sm">
                {totalSpent > 0 ? `₹${totalSpent.toLocaleString('en-IN')}` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
