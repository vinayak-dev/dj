// DJ Arts & Crafts Team Service with persistence
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'h4b_mock_team_members_v2'

export const ROLES = [
  { id: 'Admin', label: 'Admin', desc: 'Full administration & store access', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'Staff', label: 'Staff', desc: 'Standard staff & operational access', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Other', label: 'Other', desc: 'Custom role or external collaborator', color: 'bg-gray-100 text-gray-700 border-gray-200' },
]

const DEFAULT_TEAM = [
  {
    id: 'team-1',
    name: 'DJ Arts Admin',
    role: 'Admin',
    email: 'admin@djartsandcrafts.com',
    phone: '+91 98765 00001',
    status: 'Active',
    assigned_orders: 14,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'team-2',
    name: 'Pooja Verma',
    role: 'Staff',
    email: 'pooja@djartsandcrafts.com',
    phone: '+91 98765 00002',
    status: 'Active',
    assigned_orders: 8,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'team-3',
    name: 'Aakash Singh',
    role: 'Staff',
    email: 'aakash@djartsandcrafts.com',
    phone: '+91 98765 00003',
    status: 'Active',
    assigned_orders: 6,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: 'team-4',
    name: 'Ravi Kumar',
    role: 'Other',
    email: 'ravi@djartsandcrafts.com',
    phone: '+91 98765 00004',
    status: 'Active',
    assigned_orders: 4,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
]

function normalizeRole(role) {
  if (role === 'Admin' || role === 'Owner' || role === 'Manager') return 'Admin'
  if (role === 'Other') return 'Other'
  return 'Staff'
}

function getStoredTeam() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(m => ({
          ...m,
          role: normalizeRole(m.role)
        }))
      }
    }
  } catch (e) {
    console.error('Failed reading team members from storage', e)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEAM))
  return DEFAULT_TEAM
}

function saveStoredTeam(team) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(team))
  } catch (e) {
    console.error('Failed saving team members to storage', e)
  }
}

export const teamService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('team')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        const formatted = data.map(m => ({ ...m, role: normalizeRole(m.role) }))
        saveStoredTeam(formatted)
        return formatted
      }

      // If empty in Supabase, seed defaults
      if (!error && (!data || data.length === 0)) {
        try {
          const seeds = DEFAULT_TEAM.map(m => ({
            name: m.name,
            role: m.role,
            email: m.email,
            phone: m.phone,
            status: m.status,
            assigned_orders: m.assigned_orders,
          }))
          const { data: inserted } = await supabase.from('team').insert(seeds).select()
          if (inserted?.length) {
            saveStoredTeam(inserted)
            return inserted
          }
        } catch (sErr) {}
      }
    } catch (err) {
      console.warn('Team fetch from Supabase fallback to local:', err)
    }

    return getStoredTeam()
  },

  async create(memberData) {
    const cleanRole = normalizeRole(memberData.role || 'Staff')
    try {
      const newMember = {
        name: memberData.name.trim(),
        role: cleanRole,
        email: memberData.email ? memberData.email.trim() : '',
        phone: memberData.phone ? memberData.phone.trim() : '',
        status: memberData.status || 'Active',
        assigned_orders: 0,
      }
      const { data, error } = await supabase.from('team').insert(newMember).select().single()
      if (!error && data) {
        const current = getStoredTeam()
        saveStoredTeam([data, ...current])
        return data
      }
    } catch (err) {
      console.warn('Create team member in Supabase fallback:', err)
    }

    const current = getStoredTeam()
    const newMember = {
      id: `team-${Date.now()}`,
      name: memberData.name.trim(),
      role: cleanRole,
      email: memberData.email ? memberData.email.trim() : '',
      phone: memberData.phone ? memberData.phone.trim() : '',
      status: memberData.status || 'Active',
      assigned_orders: 0,
      created_at: new Date().toISOString(),
    }
    const updated = [newMember, ...current]
    saveStoredTeam(updated)
    return newMember
  },

  async updateRole(id, newRole) {
    const cleanRole = normalizeRole(newRole)
    try {
      await supabase.from('team').update({ role: cleanRole }).eq('id', id)
    } catch (err) {}

    const current = getStoredTeam()
    let updatedMember = null
    const updated = current.map(m => {
      if (m.id === id) {
        updatedMember = { ...m, role: cleanRole }
        return updatedMember
      }
      return m
    })
    saveStoredTeam(updated)
    return updatedMember
  },

  async update(id, updates) {
    const cleanRole = updates.role ? normalizeRole(updates.role) : undefined
    const cleanUpdates = { ...updates, ...(cleanRole ? { role: cleanRole } : {}) }
    try {
      await supabase.from('team').update(cleanUpdates).eq('id', id)
    } catch (err) {}

    const current = getStoredTeam()
    let updatedMember = null
    const updated = current.map(m => {
      if (m.id === id) {
        updatedMember = {
          ...m,
          ...cleanUpdates,
        }
        return updatedMember
      }
      return m
    })
    saveStoredTeam(updated)
    return updatedMember
  },

  async delete(id) {
    try {
      await supabase.from('team').delete().eq('id', id)
    } catch (err) {}

    const current = getStoredTeam()
    const updated = current.filter(m => m.id !== id)
    saveStoredTeam(updated)
    return true
  },
}
