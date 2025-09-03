import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Market {
  id: string
  name: string
  city: string
  created_at: string
}

export interface Device {
  id: string
  market_id: string
  type: 'tv' | 'camera'
  name: string
  created_at: string
}

export interface Campaign {
  id: string
  name: string
  client: string
  start_date: string
  end_date: string
  created_at: string
}

export interface Playback {
  id: string
  campaign_id: string
  device_id: string
  date: string
  time: string
  duration: number
  created_at: string
}

export interface Audience {
  id: string
  device_id: string
  date: string
  time: string
  visitors: number
  impressions: number
  created_at: string
}

export interface Report {
  id: string
  campaign_id: string
  summary_json: Record<string, unknown>
  created_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role: 'admin' | 'client' | 'market'
  market_id?: string
  created_at: string
}
