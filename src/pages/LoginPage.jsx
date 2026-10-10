import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Alert from '../components/ui/Alert'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', businessName: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    const errs = {}
    if (!formData.email) {
      errs.email = mode === 'login' ? 'Username or email is required' : 'Email is required'
    } else if (mode === 'signup' && !/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Invalid email address'
    }
    if (!formData.password) errs.password = 'Password is required'
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (mode === 'signup' && !formData.fullName) errs.fullName = 'Full name is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(formData.email, formData.password)
        navigate('/dashboard')
      } else {
        await signUp(formData.email, formData.password, formData.fullName)
        setApiError('')
        // After signup, redirect to dashboard (Supabase may require email confirmation)
        navigate('/dashboard')
      }
    } catch (err) {
      setApiError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function update(field) {
    return (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl font-bold text-gray-900">H4B.</span>
          <p className="text-gray-500 mt-2 text-sm">HandForBrand Dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {mode === 'login'
              ? 'Welcome back! Enter your credentials to continue.'
              : 'Get started with your free account.'}
          </p>

          {apiError && (
            <Alert type="error" message={apiError} onDismiss={() => setApiError('')} className="mb-4" />
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'signup' && (
              <Input
                label="Full name"
                required
                placeholder="Full name"
                value={formData.fullName}
                onChange={update('fullName')}
                error={errors.fullName}
              />
            )}

            <Input
              label={mode === 'login' ? 'Username or Email' : 'Email'}
              type={mode === 'login' ? 'text' : 'email'}
              required
              placeholder={mode === 'login' ? 'Username or email' : 'Email address'}
              value={formData.email}
              onChange={update('email')}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={update('password')}
              error={errors.password}
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>

            {mode === 'login' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ email: 'admin', password: 'admin123', fullName: '', businessName: '' })
                    setErrors({})
                    setApiError('')
                  }}
                  className="w-full text-xs text-gray-500 hover:text-gray-900 border border-dashed border-gray-300 rounded-lg py-2 transition-colors flex items-center justify-center gap-1.5 bg-gray-50/50 hover:bg-gray-50"
                >
                  <span>Quick demo login:</span>
                  <span className="font-mono font-medium text-gray-800">admin / admin123</span>
                </button>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErrors({}); setApiError('') }}
              className="text-gray-900 font-medium hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
