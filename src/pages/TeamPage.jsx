import { useState, useEffect } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import { teamService, ROLES } from '../services/teamService'
import {
  UserCheck, Plus, Search, ShieldCheck, Mail, Phone,
  Trash2, Check, ChevronDown, MoreVertical, X, Users
} from 'lucide-react'

export default function TeamPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeRoleDropdownId, setActiveRoleDropdownId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')

  const [form, setForm] = useState({
    name: '',
    role: 'Staff',
    email: '',
    phone: '',
  })

  useEffect(() => {
    loadMembers()
  }, [])

  useEffect(() => {
    function handleClickOutside() {
      setActiveRoleDropdownId(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  async function loadMembers() {
    setLoading(true)
    try {
      const data = await teamService.getAll()
      setMembers(data)
    } catch (err) {
      console.error('Failed to load team members:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignRole(memberId, newRole) {
    try {
      const updated = await teamService.updateRole(memberId, newRole)
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      setActiveRoleDropdownId(null)
      showFeedback(`Assigned role: ${newRole}`)
    } catch (err) {
      alert('Failed to update role: ' + err.message)
    }
  }

  async function handleAddMember(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const created = await teamService.create(form)
      setMembers(prev => [created, ...prev])
      setShowAddModal(false)
      setForm({ name: '', role: 'Staff', email: '', phone: '' })
      showFeedback(`Added ${created.name} to team`)
    } catch (err) {
      alert('Failed to add team member: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteMember(memberId, memberName) {
    if (!window.confirm(`Remove ${memberName} from team?`)) return
    try {
      await teamService.delete(memberId)
      setMembers(prev => prev.filter(m => m.id !== memberId))
      showFeedback(`Removed ${memberName}`)
    } catch (err) {
      alert('Failed to delete member: ' + err.message)
    }
  }

  function showFeedback(msg) {
    setFeedbackMsg(msg)
    setTimeout(() => setFeedbackMsg(''), 3000)
  }

  const filteredMembers = members.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || (m.email && m.email.toLowerCase().includes(q))
  })

  return (
    <AppLayout>
      <Header
        title="Team"
        subtitle="Manage team members and assign roles"
        actions={
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus size={14} />
            Add Member
          </Button>
        }
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/60 p-4 sm:p-6 space-y-5">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Members</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{members.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Admins</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {members.filter(m => m.role === 'Admin').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Staff</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {members.filter(m => m.role === 'Staff').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Other</p>
            <p className="text-2xl font-bold text-gray-700 mt-1">
              {members.filter(m => m.role === 'Other').length}
            </p>
          </div>
        </div>

        {/* Members Management Card */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or role…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400"
              />
            </div>
            <div className="text-xs text-gray-400">
              {filteredMembers.length} active team members
            </div>
          </div>

          {/* Members Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Users size={36} className="mb-2 opacity-30" />
                <p className="text-sm font-medium">No team members found</p>
                <p className="text-xs mt-1">Click "Add Member" to add your first team colleague.</p>
              </div>
            ) : (
              <table className="w-full text-sm min-w-[650px]">
                <thead className="bg-gray-50/80 border-b border-gray-100 text-left">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Name</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3.5">Role</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3.5">Assign Role</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3.5">Contact</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3.5">Status</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMembers.map(member => {
                    const roleConfig = ROLES.find(r => r.id === member.role) || ROLES[1]
                    const initials = member.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'

                    return (
                      <tr key={member.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Name Column */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center shadow-xs">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-gray-900">{member.name}</p>
                              <p className="text-[11px] text-gray-400">{member.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role Column */}
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleConfig.color}`}>
                            <ShieldCheck size={12} />
                            {roleConfig.label}
                          </span>
                        </td>

                        {/* Assign Role Column */}
                        <td className="px-4 py-4 relative" onClick={e => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() => setActiveRoleDropdownId(activeRoleDropdownId === member.id ? null : member.id)}
                              className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200/80 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              <span>Change Role</span>
                              <ChevronDown size={12} className="text-gray-400" />
                            </button>

                            {activeRoleDropdownId === member.id && (
                              <div className="absolute left-0 top-full mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 min-w-[210px]">
                                <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                                  Assign New Role
                                </div>
                                {ROLES.map(role => (
                                  <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => handleAssignRole(member.id, role.id)}
                                    className={`w-full flex items-start justify-between px-3 py-2 text-left hover:bg-gray-50 text-xs transition-colors ${
                                      member.role === role.id ? 'bg-gray-50 font-semibold' : ''
                                    }`}
                                  >
                                    <div>
                                      <p className="font-medium text-gray-900">{role.label}</p>
                                      <p className="text-[10px] text-gray-400 mt-0.5">{role.desc}</p>
                                    </div>
                                    {member.role === role.id && (
                                      <Check size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-4 text-xs text-gray-500">
                          {member.phone || '—'}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {member.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <button
                            title="Remove member"
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Add Team Member</h3>
                <p className="text-xs text-gray-400 mt-0.5">Invite a team member and assign their role</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-4 sm:p-6 space-y-4">
              <Input
                label="Name"
                placeholder="Team member name"
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Assign Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 bg-white"
                >
                  {ROLES.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.label} — {r.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Email"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
                <Input
                  label="Phone"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={saving}>
                  Add Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating feedback toast */}
      {feedbackMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in">
          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            ✓
          </span>
          <span>{feedbackMsg}</span>
        </div>
      )}
    </AppLayout>
  )
}
