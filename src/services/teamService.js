// DJ Arts & Crafts Team Service with persistence

const STORAGE_KEY = 'h4b_mock_team_members'

export const ROLES = [
  { id: 'Owner', label: 'Owner', desc: 'Full store access & management', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'Manager', label: 'Store Manager', desc: 'Manage orders, customers & catalog', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Designer', label: 'Graphic Designer', desc: 'Personalization prints, preview approvals', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'Production', label: 'Production Specialist', desc: 'Laser engraving, manufacturing & QC', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'Dispatch', label: 'Packaging & Dispatch', desc: 'Packing, shipping labels & tracking', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
]

const DEFAULT_TEAM = [
  {
    id: 'team-1',
    name: 'DJ Arts Admin',
    role: 'Owner',
    email: 'admin@djartsandcrafts.com',
    phone: '+91 98765 00001',
    status: 'Active',
    assigned_orders: 14,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'team-2',
    name: 'Pooja Verma',
    role: 'Designer',
    email: 'pooja@djartsandcrafts.com',
    phone: '+91 98765 00002',
    status: 'Active',
    assigned_orders: 8,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'team-3',
    name: 'Aakash Singh',
    role: 'Production',
    email: 'aakash@djartsandcrafts.com',
    phone: '+91 98765 00003',
    status: 'Active',
    assigned_orders: 6,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: 'team-4',
    name: 'Ravi Kumar',
    role: 'Dispatch',
    email: 'ravi@djartsandcrafts.com',
    phone: '+91 98765 00004',
    status: 'Active',
    assigned_orders: 4,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
]

function getStoredTeam() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
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
    return getStoredTeam()
  },

  async create(memberData) {
    const current = getStoredTeam()
    const newMember = {
      id: `team-${Date.now()}`,
      name: memberData.name.trim(),
      role: memberData.role || 'Staff',
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
    const current = getStoredTeam()
    let updatedMember = null
    const updated = current.map(m => {
      if (m.id === id) {
        updatedMember = { ...m, role: newRole }
        return updatedMember
      }
      return m
    })
    saveStoredTeam(updated)
    return updatedMember
  },

  async update(id, updates) {
    const current = getStoredTeam()
    let updatedMember = null
    const updated = current.map(m => {
      if (m.id === id) {
        updatedMember = { ...m, ...updates }
        return updatedMember
      }
      return m
    })
    saveStoredTeam(updated)
    return updatedMember
  },

  async delete(id) {
    const current = getStoredTeam()
    const updated = current.filter(m => m.id !== id)
    saveStoredTeam(updated)
    return true
  },
}
