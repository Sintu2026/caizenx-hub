import { createClient } from '@supabase/supabase-js'

// Fall back to a harmless placeholder so the bundle can be built/prerendered
// without env vars present. Configure the real values in Vercel for live use.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
