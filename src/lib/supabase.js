import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hqorrlqhzvccuawegchc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zt9Z_u6buWvkD3x4Wjg6HQ_7AolYMh8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
