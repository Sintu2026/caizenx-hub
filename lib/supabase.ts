import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any

// Types for chat subjects and messages
export interface ChatSubject {
  id?: string
  created_at?: string
  updated_at?: string
  name: string
  description?: string
  user_email: string
  color?: string
  message_count?: number
  last_message_at?: string
}

export interface ChatMessage {
  id?: string
  created_at?: string
  subject_id: string
  user_email: string
  content: string
  sender_name?: string
}

// Types for our scenarios
export interface InvestmentScenario {
  id?: string
  created_at?: string
  updated_at?: string
  name: string
  user_email: string
  data: {
    sp500: {
      initial: number
      years: number
      returnRate: number
      dividendYield: number
      dividendTax: number
      capitalGainsTax: number
    }
    condo: {
      initial: number
      years: number
      cycleDuration: number
      multiplier: number
      taxRate: number
    }
    townhouse: {
      initial: number
      years: number
      cycleDuration: number
      multiplier: number
      taxRate: number
    }
    globalSettings: {
      inflationRate: number
      transactionCosts: number
    }
  }
}
