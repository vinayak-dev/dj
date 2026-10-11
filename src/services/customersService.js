import { supabase } from '../lib/supabase'

const DEFAULT_DEMO_CUSTOMERS = [
  {
    id: 'cust-demo-1',
    name: 'asd',
    phone: '123',
    email: '123@example.com',
    notes: 'Sample customer',
    source: 'Manual',
    created_at: new Date().toISOString(),
    orders: [
      {
        id: 'ord-demo-055',
        created_at: new Date().toISOString(),
        order_items: [{ unit_price: 233, qty: 1 }],
      },
    ],
  },
]

function getLocalCustomers() {
  const stored = localStorage.getItem('h4b_mock_customers')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed
    } catch (e) {}
  }
  return DEFAULT_DEMO_CUSTOMERS
}

function saveLocalCustomers(customers) {
  try {
    localStorage.setItem('h4b_mock_customers', JSON.stringify(customers))
  } catch (e) {}
}

export const customersService = {
  async getAll(userId, filters = {}) {
    try {
      let query = supabase
        .from('customers')
        .select(`
          *,
          orders:orders(id, created_at, order_items(unit_price, qty))
        `)
        .order('created_at', { ascending: false })

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        )
      }
      if (filters.source && filters.source !== 'All sources' && filters.source !== 'all') {
        query = query.eq('source', filters.source)
      }

      const { data, error } = await query
      if (error) throw error

      if (data && data.length > 0) {
        saveLocalCustomers(data)
        return data
      }
      return []
    } catch (err) {
      console.warn('Supabase customers query failed, using local fallback:', err)
      let list = getLocalCustomers()
      if (filters.search) {
        const q = filters.search.toLowerCase()
        list = list.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
      }
      if (filters.source && filters.source !== 'All sources' && filters.source !== 'all') {
        list = list.filter(c => c.source === filters.source)
      }
      return list
    }
  },

  async getById(id) {
    try {
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
    } catch (err) {
      console.warn('Supabase customer getById fallback:', err)
      const list = getLocalCustomers()
      return list.find(c => c.id === id) || null
    }
  },

  async create(userId, customerData) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: customerData.name,
          email: customerData.email || null,
          phone: customerData.phone || null,
          notes: customerData.notes || null,
          source: customerData.source || 'Manual'
        })
        .select()
        .single()
      if (error) throw error

      const cached = getLocalCustomers()
      saveLocalCustomers([data, ...cached])
      return data
    } catch (err) {
      console.warn('Supabase customer create fallback:', err)
      const customers = getLocalCustomers()
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
      saveLocalCustomers([newCust, ...customers])
      return newCust
    }
  },

  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      const cached = getLocalCustomers()
      saveLocalCustomers(cached.map(c => c.id === id ? { ...c, ...updates, ...data } : c))
      return data
    } catch (err) {
      console.warn('Supabase customer update fallback:', err)
      const customers = getLocalCustomers()
      let updatedCust = null
      const updatedList = customers.map(c => {
        if (c.id === id) {
          updatedCust = { ...c, ...updates }
          return updatedCust
        }
        return c
      })
      saveLocalCustomers(updatedList)
      return updatedCust || updates
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      console.warn('Supabase customer delete fallback:', err)
    }
    const customers = getLocalCustomers()
    saveLocalCustomers(customers.filter(c => c.id !== id))
  },
}
