import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const DEFAULT_OWNER_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'contact@djartsandcrafts.com',
  user_metadata: { full_name: 'DJ Arts & Crafts' },
}

const DEFAULT_OWNER_PROFILE = {
  id: '00000000-0000-0000-0000-000000000000',
  full_name: 'DJ Arts & Crafts',
  role: 'Store Owner',
  plan: 'Pro',
  business_name: 'DJ Arts & Crafts',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEFAULT_OWNER_USER)
  const [profile, setProfile] = useState(DEFAULT_OWNER_PROFILE)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Clear any outdated cached mock user with old names
    localStorage.removeItem('h4b_mock_user')
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(identifier, password) {
    // Demo admin support
    const idClean = identifier?.trim()?.toLowerCase()
    if ((idClean === 'admin' || idClean === 'admin@handforbrand.com' || idClean === 'admin@h4b.com') && password === 'admin123') {
      const demoUser = {
        id: 'admin-00000000-0000-0000-0000-000000000000',
        email: 'admin@handforbrand.com',
        user_metadata: { full_name: 'vinayak' },
      }
      const demoProfile = {
        id: demoUser.id,
        full_name: 'vinayak',
        role: 'Owner',
        plan: 'Free plan',
        business_name: 'pixelboxindia',
      }
      localStorage.setItem('h4b_mock_user', JSON.stringify({ user: demoUser, profile: demoProfile }))
      setUser(demoUser)
      setProfile(demoProfile)
      setLoading(false)
      return { user: demoUser }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: identifier, password })
    if (error) throw error
    return data
  }

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    localStorage.removeItem('h4b_mock_user')
    setUser(null)
    setProfile(null)
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Error during Supabase signout:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
