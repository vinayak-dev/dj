import { supabase } from '../lib/supabase'

export const dashboardService = {
  async getStats(userId, months = 6) {
    if (userId?.startsWith('admin-') || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      const storedOrders = localStorage.getItem('h4b_mock_orders')
      let orders = []
      if (storedOrders) {
        try { orders = JSON.parse(storedOrders) } catch (e) {}
      }

      const today = new Date().toDateString()
      const todaysOrders = orders.filter(o => o.created_at && new Date(o.created_at).toDateString() === today)
      const activeOrders = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.progress))
      
      let totalRevenue = 0
      let netPayout = 0
      let pendingPayments = 0

      orders.forEach(o => {
        const base = Number(o.payment?.base_price ?? o.order_items?.reduce((s, i) => s + (Number(i.qty) * Number(i.unit_price) || 0), 0) ?? 0)
        const advance = Number(o.payment?.advance_collected ?? (o.payment?.is_full_paid ? base : 0))
        totalRevenue += base
        netPayout += advance
        const due = base - advance
        if (due > 0) {
          pendingPayments += due
        }
      })

      const storedCusts = localStorage.getItem('h4b_mock_customers')
      let customerCount = 1
      if (storedCusts) {
        try { customerCount = JSON.parse(storedCusts).length } catch (e) {}
      }

      return {
        totalRevenue,
        todaysOrders: todaysOrders.length,
        activeOrders: activeOrders.length,
        pendingPayments,
        netPayout,
        addOnRevenue: 0,
        totalCustomers: customerCount,
      }
    }

    const since = new Date()
    since.setMonth(since.getMonth() - months)
    const sinceStr = since.toISOString()

    const [ordersRes, paymentsRes, customersRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id, created_at, progress, due_date')
        .eq('user_id', userId)
        .gte('created_at', sinceStr),
      supabase
        .from('payments')
        .select('base_price, advance_collected, is_full_paid, order_id')
        .in(
          'order_id',
          (await supabase
            .from('orders')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', sinceStr)
            .then(r => (r.data || []).map(o => o.id)))
        ),
      supabase
        .from('customers')
        .select('id')
        .eq('user_id', userId),
    ])

    const orders = ordersRes.data || []
    const payments = paymentsRes.data || []

    const today = new Date().toDateString()
    const todaysOrders = orders.filter(o => new Date(o.created_at).toDateString() === today)
    const activeOrders = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.progress))
    const totalRevenue = payments.reduce((sum, p) => sum + (p.base_price || 0), 0)
    const advanceCollected = payments.reduce((sum, p) => sum + (p.advance_collected || 0), 0)
    const pendingPayments = payments.reduce((sum, p) => {
      const bal = (p.base_price || 0) - (p.advance_collected || 0)
      return sum + (bal > 0 ? bal : 0)
    }, 0)

    return {
      totalRevenue,
      todaysOrders: todaysOrders.length,
      activeOrders: activeOrders.length,
      pendingPayments,
      netPayout: advanceCollected,
      addOnRevenue: 0,
      totalCustomers: (customersRes.data || []).length,
    }
  },
}
