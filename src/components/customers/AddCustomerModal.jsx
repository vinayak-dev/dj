import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { customersService } from '../../services/customersService'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { X } from 'lucide-react'

export default function AddCustomerModal({ isOpen, onClose, onCreated }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  if (!isOpen) return null

  function update(field) {
    return e => {
      setForm(p => ({ ...p, [field]: e.target.value }))
      setErrors(p => ({ ...p, [field]: undefined }))
    }
  }

  function validate() {
    return {}
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setApiError('')
    try {
      await customersService.create(user.id, {
        name: form.name.trim() || 'New Customer',
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,
        source: 'Manual',
      })
      setForm({ name: '', phone: '', email: '', notes: '' })
      onCreated()
    } catch (err) {
      setApiError(err.message || 'Failed to add customer')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setForm({ name: '', phone: '', email: '', notes: '' })
    setErrors({})
    setApiError('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.currentTarget === e.target) handleClose() }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add customer</h2>
          <button onClick={handleClose} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-5 space-y-4" noValidate>
          {apiError && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
          )}

          <Input
            label="Name"
            placeholder="Customer name"
            value={form.name}
            onChange={update('name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone"
              type="tel"
              placeholder="Phone number"
              value={form.phone}
              onChange={update('phone')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={update('email')}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Notes</label>
            <textarea
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 resize-none"
              rows={3}
              placeholder="Notes / instructions…"
              value={form.notes}
              onChange={update('notes')}
            />
          </div>

          <p className="text-xs text-gray-400">
            Source will be set to <span className="text-blue-600 font-medium">Manual</span>.
          </p>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="primary" loading={loading}>Add customer</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
