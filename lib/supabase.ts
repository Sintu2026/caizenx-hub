import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
