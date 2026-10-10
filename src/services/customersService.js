import { supabase } from '../lib/supabase'

const DEFAULT_DEMO_CUSTOMERS = [
  {
    id: 'cust-demo-1',
    name: 'asd',
    phone: '123',
    email: '123',
    notes: 'Sample customer from screenshot',
    source: 'Manual',
    created_at: '2026-10-15T10:00:00Z',
    orders: [
      {
        id: 'ord-demo-055',
        created_at: '2026-10-15T10:00:00Z',
        order_items: [{ unit_price: 233, qty: 1 }],
      },
    ],
  },
]

function getMockCustomers() {
  const stored = localStorage.getItem('h4b_mock_customers')
  if (stored) {
    try { return JSON.parse(stored) } catch (e) {}
  }
  localStorage.setItem('h4b_mock_customers', JSON.stringify(DEFAULT_DEMO_CUSTOMERS))
  return DEFAULT_DEMO_CUSTOMERS
}

function saveMockCustomers(customers) {
  localStorage.setItem('h4b_mock_customers', JSON.stringify(customers))
}

export const customersService = {
  async getAll(userId, filters = {}) {
    if (userId?.startsWith('admin-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      let list = getMockCustomers()
      if (filters.search) {
        const q = filters.search.toLowerCase()
        list = list.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
      }
      if (filters.source && filters.source !== 'All sources' && filters.source !== 'all') {
        list = list.filter(c => c.source === filters.source)
      }
      return list
    }

    let query = supabase
      .from('customers')
      .select(`
        *,
        orders:orders(id, created_at, order_items(unit_price, qty))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      )
    }
    if (filters.source && filters.source !== 'all') {
      query = query.eq('source', filters.source)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders:orders(*, order_items(*), payment:payments(*))
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(userId, customerData) {
    if (userId?.startsWith('admin-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const customers = getMockCustomers()
      const newCust = {
        id: `cust-demo-${Date.now()}`,
        name: customerData.name,
        phone: customerData.phone || '',
        email: customerData.email || '',
        notes: customerData.notes || '',
        source: customerData.source || 'Manual',
        created_at: new Date().toISOString(),
        orders: [],
      }
      const updatedList = [newCust, ...customers]
      saveMockCustomers(updatedList)
      return newCust
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({ user_id: userId, ...customerData, source: customerData.source || 'Manual' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    if (id?.startsWith('cust-demo-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const customers = getMockCustomers()
      let updatedCust = null
      const updatedList = customers.map(c => {
        if (c.id === id) {
          updatedCust = { ...c, ...updates }
          return updatedCust
        }
        return c
      })
      saveMockCustomers(updatedList)
      return updatedCust || updates
    }

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    if (id?.startsWith('cust-demo-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const customers = getMockCustomers()
      const updatedList = customers.filter(c => c.id !== id)
      saveMockCustomers(updatedList)
      return
    }

    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw error
  },
}
