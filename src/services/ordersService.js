import { supabase } from '../lib/supabase'

const DEFAULT_DEMO_ORDERS = [
  {
    id: 'ord-demo-055',
    order_no: 'ORD-055',
    progress: 'Order Placed',
    priority: 'No priority',
    assigned_to: 'DJ Team',
    due_date: '2026-10-15',
    created_at: new Date().toISOString(),
    customer: {
      id: 'cust-demo-1',
      name: 'asd',
      phone: '123',
      email: '123@example.com',
    },
    order_items: [
      {
        id: 'item-demo-1',
        product_name: 'dd',
        qty: 1,
        unit_price: 233,
      },
    ],
    payment: {
      base_price: 233,
      advance_due: 233,
      balance_due: 0,
      advance_collected: 233,
      is_full_paid: true,
    },
  },
]

function getLocalOrders() {
  const stored = localStorage.getItem('h4b_mock_orders')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed
    } catch (e) {}
  }
  return DEFAULT_DEMO_ORDERS
}

function saveLocalOrders(orders) {
  try {
    localStorage.setItem('h4b_mock_orders', JSON.stringify(orders))
  } catch (e) {}
}

function normalizeOrder(o) {
  if (!o) return o
  return {
    ...o,
    payment: Array.isArray(o.payment) ? (o.payment[0] || null) : (o.payment || null),
    order_items: Array.isArray(o.order_items) ? o.order_items : []
  }
}

export const ordersService = {
  async getAll(userId, filters = {}) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customer:customers(id, name, phone, email),
          order_items(*, product:products(name)),
          payment:payments(*)
        `)
        .order('created_at', { ascending: false })

      if (filters.stage && filters.stage !== 'All stages' && filters.stage !== 'all') {
        query = query.eq('progress', filters.stage)
      }
      if (filters.search) {
        query = query.or(`order_no.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error

      if (data && data.length > 0) {
        const normalized = data.map(normalizeOrder)
        saveLocalOrders(normalized)
        return normalized
      }

      // If Supabase returned empty table, check if we have orders or return empty
      return []
    } catch (err) {
      console.warn('Supabase query failed, using local cache:', err)
      let orders = getLocalOrders()
      if (filters.stage && filters.stage !== 'All stages' && filters.stage !== 'all') {
        orders = orders.filter(o => o.progress === filters.stage)
      }
      if (filters.search) {
        const q = filters.search.toLowerCase()
        orders = orders.filter(o => o.order_no?.toLowerCase().includes(q) || o.customer?.name?.toLowerCase().includes(q))
      }
      return orders
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(id, name, phone, email),
          order_items(*, product:products(id, name, price)),
          payment:payments(*)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return normalizeOrder(data)
    } catch (err) {
      console.warn('Supabase getById failed, using cache:', err)
      const cached = getLocalOrders()
      return cached.find(o => o.id === id) || null
    }
  },

  async create(userId, orderData) {
    try {
      // Generate order number based on count
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
      
      const orderCount = count || 0
      const orderNo = orderData.order_no || `ORD-${String(orderCount + 56).padStart(3, '0')}`

      // Create or find customer
      let customerId = orderData.customer_id
      if (!customerId && orderData.customer_name) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .ilike('name', orderData.customer_name)
          .maybeSingle()

        if (existingCustomer) {
          customerId = existingCustomer.id
        } else {
          const { data: newCustomer, error: cErr } = await supabase
            .from('customers')
            .insert({
              name: orderData.customer_name,
              email: orderData.customer_email || null,
              phone: orderData.customer_phone || null,
              source: 'Manual',
            })
            .select()
            .single()
          if (!cErr && newCustomer) {
            customerId = newCustomer.id
          }
        }
      }

      // Insert order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_no: orderNo,
          customer_id: customerId || null,
          progress: orderData.progress || 'Order Placed',
          priority: orderData.priority || 'No priority',
          assigned_to: orderData.assigned_to || null,
          due_date: orderData.due_date || null,
          notes: orderData.notes || null,
        })
        .select()
        .single()
      if (orderErr) throw orderErr

      // Insert order items
      if (orderData.items?.length) {
        const items = orderData.items.map(item => ({
          order_id: order.id,
          product_id: item.product_id || null,
          product_name: item.product_name,
          qty: Number(item.qty) || 1,
          unit_price: Number(item.unit_price) || 0,
        }))
        const { error: itemErr } = await supabase.from('order_items').insert(items)
        if (itemErr) throw itemErr
      }

      // Create payment record
      const basePrice = orderData.items?.reduce((sum, i) => sum + (Number(i.qty) || 1) * (Number(i.unit_price) || 0), 0) || 0
      const { error: payErr } = await supabase.from('payments').insert({
        order_id: order.id,
        base_price: basePrice,
        advance_due: basePrice,
        balance_due: 0,
        advance_collected: basePrice,
        is_full_paid: true,
      })
      if (payErr) throw payErr

      const fullOrder = await ordersService.getById(order.id)
      const cached = getLocalOrders()
      saveLocalOrders([fullOrder, ...cached])
      return fullOrder
    } catch (err) {
      console.error('Supabase create failed, falling back to local storage:', err)
      const orders = getLocalOrders()
      const orderNo = `ORD-${String(orders.length + 56).padStart(3, '0')}`
      const basePrice = orderData.items?.reduce((sum, i) => sum + (Number(i.qty) || 1) * (Number(i.unit_price) || 0), 0) || 0
      const newOrder = {
        id: `ord-demo-${Date.now()}`,
        order_no: orderNo,
        progress: 'Order Placed',
        priority: 'No priority',
        assigned_to: orderData.assigned_to || 'DJ Team',
        due_date: orderData.due_date || '2026-10-15',
        created_at: new Date().toISOString(),
        customer: {
          id: `cust-demo-${Date.now()}`,
          name: orderData.customer_name,
          phone: orderData.customer_phone || '',
          email: orderData.customer_email || '',
        },
        order_items: (orderData.items || []).map((it, idx) => ({
          id: `item-demo-${Date.now()}-${idx}`,
          product_name: it.product_name,
          qty: Number(it.qty) || 1,
          unit_price: Number(it.unit_price) || 0,
        })),
        payment: {
          base_price: basePrice,
          advance_due: basePrice,
          balance_due: 0,
          advance_collected: basePrice,
          is_full_paid: true,
        },
      }
      const updatedList = [newOrder, ...orders]
      saveLocalOrders(updatedList)
      return newOrder
    }
  },

  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      const cached = getLocalOrders()
      const updatedList = cached.map(o => o.id === id ? { ...o, ...updates, ...data } : o)
      saveLocalOrders(updatedList)
      return data
    } catch (err) {
      console.warn('Update order Supabase error, falling back to local:', err)
      const orders = getLocalOrders()
      let updatedOrder = null
      const updatedList = orders.map(o => {
        if (o.id === id) {
          updatedOrder = { ...o, ...updates }
          return updatedOrder
        }
        return o
      })
      saveLocalOrders(updatedList)
      return updatedOrder || updates
    }
  },

  async delete(id) {
    try {
      await supabase.from('order_items').delete().eq('order_id', id)
      await supabase.from('payments').delete().eq('order_id', id)
      const { error } = await supabase.from('orders').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      console.warn('Delete order Supabase error:', err)
    }
    const orders = getLocalOrders()
    const updatedList = orders.filter(o => o.id !== id)
    saveLocalOrders(updatedList)
  },

  async addOrderItem(orderId, item) {
    try {
      const newItemData = {
        order_id: orderId,
        product_name: item.product_name,
        qty: Number(item.qty) || 1,
        unit_price: Number(item.unit_price) || 0,
      }
      const { data, error } = await supabase
        .from('order_items')
        .insert(newItemData)
        .select()
        .single()
      if (error) throw error
      return data
    } catch (err) {
      console.warn('addOrderItem Supabase error:', err)
      const orders = getLocalOrders()
      const newItem = {
        id: `item-demo-${Date.now()}`,
        product_name: item.product_name,
        qty: Number(item.qty) || 1,
        unit_price: Number(item.unit_price) || 0,
      }
      const updatedList = orders.map(o => {
        if (o.id === orderId) {
          return { ...o, order_items: [...(o.order_items || []), newItem] }
        }
        return o
      })
      saveLocalOrders(updatedList)
      return newItem
    }
  },

  async updateOrderItem(id, updates) {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    } catch (err) {
      console.warn('updateOrderItem Supabase error:', err)
      const orders = getLocalOrders()
      const updatedList = orders.map(o => {
        const items = (o.order_items || []).map(it => it.id === id ? { ...it, ...updates } : it)
        return { ...o, order_items: items }
      })
      saveLocalOrders(updatedList)
      return updates
    }
  },

  async deleteOrderItem(id) {
    try {
      const { error } = await supabase.from('order_items').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      console.warn('deleteOrderItem Supabase error:', err)
      const orders = getLocalOrders()
      const updatedList = orders.map(o => {
        const items = (o.order_items || []).filter(it => it.id !== id)
        return { ...o, order_items: items }
      })
      saveLocalOrders(updatedList)
    }
  },

  async updatePayment(orderId, updates) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('order_id', orderId)
        .select()
        .single()
      if (error) throw error

      const orders = getLocalOrders()
      const updatedList = orders.map(o => {
        if (o.id === orderId) {
          return { ...o, payment: { ...(o.payment || {}), ...updates, ...data } }
        }
        return o
      })
      saveLocalOrders(updatedList)
      return data
    } catch (err) {
      console.warn('updatePayment Supabase error:', err)
      const orders = getLocalOrders()
      const updatedList = orders.map(o => {
        if (o.id === orderId) {
          return { ...o, payment: { ...(o.payment || {}), ...updates } }
        }
        return o
      })
      saveLocalOrders(updatedList)
      return updates
    }
  },
}
