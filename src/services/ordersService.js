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

function getMockOrders() {
  const stored = localStorage.getItem('h4b_mock_orders')
  if (stored) {
    try { return JSON.parse(stored) } catch (e) {}
  }
  localStorage.setItem('h4b_mock_orders', JSON.stringify(DEFAULT_DEMO_ORDERS))
  return DEFAULT_DEMO_ORDERS
}

function saveMockOrders(orders) {
  localStorage.setItem('h4b_mock_orders', JSON.stringify(orders))
}

export const ordersService = {
  async getAll(userId, filters = {}) {
    if (userId?.startsWith('admin-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      let orders = getMockOrders()
      if (filters.stage && filters.stage !== 'All stages' && filters.stage !== 'all') {
        orders = orders.filter(o => o.progress === filters.stage)
      }
      return orders
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customers(id, name, phone, email),
        order_items(*, product:products(name)),
        payment:payments(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (filters.stage && filters.stage !== 'all') {
      query = query.eq('progress', filters.stage)
    }
    if (filters.search) {
      query = query.or(
        `order_no.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getById(id) {
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
    return data
  },

  async create(userId, orderData) {
    if (userId?.startsWith('admin-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const orders = getMockOrders()
      const orderNo = `ORD-${String(orders.length + 55).padStart(3, '0')}`
      const basePrice = orderData.items?.reduce((sum, i) => sum + i.qty * i.unit_price, 0) || 0
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
          qty: it.qty,
          unit_price: it.unit_price,
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
      saveMockOrders(updatedList)
      return newOrder
    }

    // Generate order number
    const count = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    const orderNo = `ORD-${String((count.count || 0) + 1).padStart(3, '0')}`

    // Create or find customer
    let customerId = orderData.customer_id
    if (!customerId && orderData.customer_name) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', orderData.customer_name)
        .maybeSingle()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const { data: newCustomer, error: cErr } = await supabase
          .from('customers')
          .insert({
            user_id: userId,
            name: orderData.customer_name,
            email: orderData.customer_email || null,
            phone: orderData.customer_phone || null,
            source: 'Manual',
          })
          .select()
          .single()
        if (cErr) throw cErr
        customerId = newCustomer.id
      }
    }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_no: orderNo,
        customer_id: customerId,
        progress: 'Order Placed',
        priority: 'No priority',
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
        qty: item.qty,
        unit_price: item.unit_price,
      }))
      const { error: itemErr } = await supabase.from('order_items').insert(items)
      if (itemErr) throw itemErr
    }

    // Create payment record
    const basePrice = orderData.items?.reduce((sum, i) => sum + i.qty * i.unit_price, 0) || 0
    const { error: payErr } = await supabase.from('payments').insert({
      order_id: order.id,
      base_price: basePrice,
      advance_due: basePrice,
      balance_due: 0,
      advance_collected: basePrice,
      is_full_paid: true,
    })
    if (payErr) throw payErr

    return order
  },

  async update(id, updates) {
    if (id?.startsWith('ord-demo-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const orders = getMockOrders()
      let updatedOrder = null
      const updatedList = orders.map(o => {
        if (o.id === id) {
          updatedOrder = { ...o, ...updates }
          return updatedOrder
        }
        return o
      })
      saveMockOrders(updatedList)
      return updatedOrder || updates
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    if (id?.startsWith('ord-demo-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const orders = getMockOrders()
      const updatedList = orders.filter(o => o.id !== id)
      saveMockOrders(updatedList)
      return
    }

    // Delete related items first
    await supabase.from('order_items').delete().eq('order_id', id)
    await supabase.from('payments').delete().eq('order_id', id)
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) throw error
  },

  async addOrderItem(orderId, item) {
    if (orderId?.startsWith('ord-demo-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const orders = getMockOrders()
      const newItem = {
        id: `item-demo-${Date.now()}`,
        product_name: item.product_name,
        qty: item.qty,
        unit_price: item.unit_price,
      }
      const updatedList = orders.map(o => {
        if (o.id === orderId) {
          return { ...o, order_items: [...(o.order_items || []), newItem] }
        }
        return o
      })
      saveMockOrders(updatedList)
      return newItem
    }

    const { data, error } = await supabase
      .from('order_items')
      .insert({ order_id: orderId, ...item })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateOrderItem(id, updates) {
    if (id?.startsWith('item-demo-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const orders = getMockOrders()
      const updatedList = orders.map(o => {
        const items = (o.order_items || []).map(it => it.id === id ? { ...it, ...updates } : it)
        return { ...o, order_items: items }
      })
      saveMockOrders(updatedList)
      return updates
    }

    const { data, error } = await supabase
      .from('order_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteOrderItem(id) {
    if (id?.startsWith('item-demo-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const orders = getMockOrders()
      const updatedList = orders.map(o => {
        const items = (o.order_items || []).filter(it => it.id !== id)
        return { ...o, order_items: items }
      })
      saveMockOrders(updatedList)
      return
    }

    const { error } = await supabase.from('order_items').delete().eq('id', id)
    if (error) throw error
  },

  async updatePayment(orderId, updates) {
    if (orderId?.startsWith('ord-demo-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const orders = getMockOrders()
      const updatedList = orders.map(o => {
        if (o.id === orderId) {
          return { ...o, payment: { ...(o.payment || {}), ...updates } }
        }
        return o
      })
      saveMockOrders(updatedList)
      return updates
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('order_id', orderId)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
