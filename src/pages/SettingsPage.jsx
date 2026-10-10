import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { supabase } from '../lib/supabase'
import { Settings, User, Building2, Lock } from 'lucide-react'

const TABS = ['Profile', 'Business', 'Security']

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('Profile')
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    business_name: profile?.business_name || '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  function update(field) {
    return e => setForm(p => ({ ...p, [field]: e.target.value }))
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    setError('')
    try {
      const { error: err } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: form.full_name, business_name: form.business_name })
      if (err) throw err
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (!form.new_password || form.new_password.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    setSaving(true)
    setSuccess('')
    setError('')
    try {
      const { error: err } = await supabase.auth.updateUser({ password: form.new_password })
      if (err) throw err
      setSuccess('Password changed successfully.')
      setForm(p => ({ ...p, current_password: '', new_password: '' }))
    } catch (err) {
      setError(err.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <Header title="Settings" subtitle="Manage your account and business settings" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-6">
          {/* Tab nav */}
          <div className="flex gap-1 border-b border-gray-200 mb-6">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSuccess(''); setError('') }}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{success}</div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          {tab === 'Profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 bg-white border border-gray-100 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  {(form.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{form.full_name || 'Your Name'}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
              <Input label="Full name" placeholder="Your full name"
                value={form.full_name} onChange={update('full_name')} />
              <Input label="Email" type="email" disabled value={form.email}
                className="opacity-60 cursor-not-allowed" />
              <p className="text-xs text-gray-400">Email cannot be changed here. Contact support to update your email.</p>
              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={saving}>Save profile</Button>
              </div>
            </form>
          )}

          {tab === 'Business' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 bg-white border border-gray-100 rounded-xl p-6">
              <Input label="Business name" placeholder="Your business name"
                value={form.business_name} onChange={update('business_name')} />
              <p className="text-xs text-gray-400">This name appears on your customer-facing forms and order pages.</p>
              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={saving}>Save business info</Button>
              </div>
            </form>
          )}

          {tab === 'Security' && (
            <form onSubmit={handleChangePassword} className="space-y-4 bg-white border border-gray-100 rounded-xl p-6">
              <Input label="New password" type="password" placeholder="At least 6 characters"
                value={form.new_password} onChange={update('new_password')} />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={saving}>Change password</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
