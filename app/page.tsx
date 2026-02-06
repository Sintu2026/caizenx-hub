'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { supabase, InvestmentScenario } from '@/lib/supabase'

export default function InvestmentComparison() {
  // User state
  const [userEmail, setUserEmail] = useState('')
  const [scenarioName, setScenarioName] = useState('My Scenario')
  const [savedScenarios, setSavedScenarios] = useState<InvestmentScenario[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // S&P 500 Settings
  const [sp500Initial, setSp500Initial] = useState(1000000)
  const [sp500Years, setSp500Years] = useState(20)
  const [sp500Return, setSp500Return] = useState(11)
  const [sp500DividendYield, setSp500DividendYield] = useState(1.5)
  const [sp500DividendTax, setSp500DividendTax] = useState(25)
  const [sp500CapGainsTax, setSp500CapGainsTax] = useState(26)

  // Condo Settings
  const [condoInitial, setCondoInitial] = useState(1000000)
  const [condoYears, setCondoYears] = useState(20)
  const [condoCycle, setCondoCycle] = useState(4)
  const [condoMultiplier, setCondoMultiplier] = useState(2)
  const [condoTaxRate, setCondoTaxRate] = useState(26)

  // Townhouse Settings
  const [townhouseInitial, setTownhouseInitial] = useState(1000000)
  const [townhouseYears, setTownhouseYears] = useState(20)
  const [townhouseCycle, setTownhouseCycle] = useState(3)
  const [townhouseMultiplier, setTownhouseMultiplier] = useState(2)
  const [townhouseTaxRate, setTownhouseTaxRate] = useState(26)

  // Global Settings
  const [inflationRate, setInflationRate] = useState(2.5)
  const [transactionCosts, setTransactionCosts] = useState(2)

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview')

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    }
    return `$${value.toLocaleString()}`
  }

  // Calculate S&P 500 growth
  const sp500Data = useMemo(() => {
    const results = []
    let value = sp500Initial
    let totalDividendTax = 0

    for (let year = 0; year <= sp500Years; year++) {
      if (year > 0) {
        // Capital appreciation
        const appreciation = value * (sp500Return / 100)
        // Dividends (taxed annually)
        const dividends = value * (sp500DividendYield / 100)
        const dividendTax = dividends * (sp500DividendTax / 100)
        totalDividendTax += dividendTax
        // Reinvest after-tax dividends
        value = value + appreciation + dividends - dividendTax
      }

      results.push({
        year,
        value: Math.round(value),
        totalDividendTax: Math.round(totalDividendTax)
      })
    }

    // Calculate final after capital gains tax
    const finalValue = results[results.length - 1].value
    const capitalGain = finalValue - sp500Initial
    const capitalGainsTax = capitalGain * (sp500CapGainsTax / 100)
    const afterTaxValue = finalValue - capitalGainsTax

    return {
      yearly: results,
      finalPreTax: finalValue,
      finalAfterTax: Math.round(afterTaxValue),
      totalTaxPaid: Math.round(totalDividendTax + capitalGainsTax),
      totalReturn: ((afterTaxValue / sp500Initial - 1) * 100).toFixed(1),
      cagr: ((Math.pow(afterTaxValue / sp500Initial, 1 / sp500Years) - 1) * 100).toFixed(2)
    }
  }, [sp500Initial, sp500Years, sp500Return, sp500DividendYield, sp500DividendTax, sp500CapGainsTax])

  // Calculate Condo growth (tax paid after each cycle)
  const condoData = useMemo(() => {
    const results = []
    let value = condoInitial
    let totalTaxPaid = 0
    const cycleResults = []

    for (let year = 0; year <= condoYears; year++) {
      // Check if a cycle just completed
      if (year > 0 && year % condoCycle === 0) {
        const previousValue = value
        const grossValue = previousValue * condoMultiplier
        const gain = grossValue - previousValue
        const tax = gain * (condoTaxRate / 100)
        totalTaxPaid += tax
        value = grossValue - tax

        cycleResults.push({
          cycle: cycleResults.length + 1,
          year,
          grossValue: Math.round(grossValue),
          gain: Math.round(gain),
          tax: Math.round(tax),
          netValue: Math.round(value)
        })
      }

      results.push({
        year,
        value: Math.round(value),
        totalTaxPaid: Math.round(totalTaxPaid)
      })
    }

    return {
      yearly: results,
      cycles: cycleResults,
      finalValue: Math.round(value),
      totalTaxPaid: Math.round(totalTaxPaid),
      totalReturn: ((value / condoInitial - 1) * 100).toFixed(1),
      cagr: ((Math.pow(value / condoInitial, 1 / condoYears) - 1) * 100).toFixed(2),
      effectiveMultiplier: (condoMultiplier - (condoMultiplier - 1) * (condoTaxRate / 100)).toFixed(3)
    }
  }, [condoInitial, condoYears, condoCycle, condoMultiplier, condoTaxRate])

  // Calculate Townhouse growth (tax paid after each cycle)
  const townhouseData = useMemo(() => {
    const results = []
    let value = townhouseInitial
    let totalTaxPaid = 0
    const cycleResults = []

    for (let year = 0; year <= townhouseYears; year++) {
      // Check if a cycle just completed
      if (year > 0 && year % townhouseCycle === 0) {
        const previousValue = value
        const grossValue = previousValue * townhouseMultiplier
        const gain = grossValue - previousValue
        const tax = gain * (townhouseTaxRate / 100)
        totalTaxPaid += tax
        value = grossValue - tax

        cycleResults.push({
          cycle: cycleResults.length + 1,
          year,
          grossValue: Math.round(grossValue),
          gain: Math.round(gain),
          tax: Math.round(tax),
          netValue: Math.round(value)
        })
      }

      results.push({
        year,
        value: Math.round(value),
        totalTaxPaid: Math.round(totalTaxPaid)
      })
    }

    return {
      yearly: results,
      cycles: cycleResults,
      finalValue: Math.round(value),
      totalTaxPaid: Math.round(totalTaxPaid),
      totalReturn: ((value / townhouseInitial - 1) * 100).toFixed(1),
      cagr: ((Math.pow(value / townhouseInitial, 1 / townhouseYears) - 1) * 100).toFixed(2),
      effectiveMultiplier: (townhouseMultiplier - (townhouseMultiplier - 1) * (townhouseTaxRate / 100)).toFixed(3)
    }
  }, [townhouseInitial, townhouseYears, townhouseCycle, townhouseMultiplier, townhouseTaxRate])

  // Combined chart data
  const chartData = useMemo(() => {
    const maxYears = Math.max(sp500Years, condoYears, townhouseYears)
    const data = []

    for (let year = 0; year <= maxYears; year++) {
      data.push({
        year,
        sp500: sp500Data.yearly[year]?.value || null,
        condo: condoData.yearly[year]?.value || null,
        townhouse: townhouseData.yearly[year]?.value || null
      })
    }

    return data
  }, [sp500Data, condoData, townhouseData, sp500Years, condoYears, townhouseYears])

  // Save scenario to Supabase
  const saveScenario = async () => {
    if (!userEmail) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }
    if (!scenarioName) {
      setMessage({ type: 'error', text: 'Please enter a scenario name' })
      return
    }

    setIsSaving(true)
    setMessage({ type: '', text: '' })

    const scenarioData: InvestmentScenario = {
      name: scenarioName,
      user_email: userEmail,
      data: {
        sp500: {
          initial: sp500Initial,
          years: sp500Years,
          returnRate: sp500Return,
          dividendYield: sp500DividendYield,
          dividendTax: sp500DividendTax,
          capitalGainsTax: sp500CapGainsTax
        },
        condo: {
          initial: condoInitial,
          years: condoYears,
          cycleDuration: condoCycle,
          multiplier: condoMultiplier,
          taxRate: condoTaxRate
        },
        townhouse: {
          initial: townhouseInitial,
          years: townhouseYears,
          cycleDuration: townhouseCycle,
          multiplier: townhouseMultiplier,
          taxRate: townhouseTaxRate
        },
        globalSettings: {
          inflationRate,
          transactionCosts
        }
      }
    }

    try {
      const { data, error } = await supabase
        .from('scenarios')
        .insert([scenarioData])
        .select()

      if (error) throw error

      setMessage({ type: 'success', text: 'Scenario saved successfully!' })
      setShowSaveModal(false)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save scenario' })
    } finally {
      setIsSaving(false)
    }
  }

  // Load scenarios from Supabase
  const loadScenarios = async () => {
    if (!userEmail) {
      setMessage({ type: 'error', text: 'Please enter your email to load scenarios' })
      return
    }

    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSavedScenarios(data || [])
      setShowLoadModal(true)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to load scenarios' })
    } finally {
      setIsLoading(false)
    }
  }

  // Apply loaded scenario
  const applyScenario = (scenario: InvestmentScenario) => {
    const { data } = scenario

    // S&P 500
    setSp500Initial(data.sp500.initial)
    setSp500Years(data.sp500.years)
    setSp500Return(data.sp500.returnRate)
    setSp500DividendYield(data.sp500.dividendYield)
    setSp500DividendTax(data.sp500.dividendTax)
    setSp500CapGainsTax(data.sp500.capitalGainsTax)

    // Condo
    setCondoInitial(data.condo.initial)
    setCondoYears(data.condo.years)
    setCondoCycle(data.condo.cycleDuration)
    setCondoMultiplier(data.condo.multiplier)
    setCondoTaxRate(data.condo.taxRate)

    // Townhouse
    setTownhouseInitial(data.townhouse.initial)
    setTownhouseYears(data.townhouse.years)
    setTownhouseCycle(data.townhouse.cycleDuration)
    setTownhouseMultiplier(data.townhouse.multiplier)
    setTownhouseTaxRate(data.townhouse.taxRate)

    // Global
    setInflationRate(data.globalSettings.inflationRate)
    setTransactionCosts(data.globalSettings.transactionCosts)

    setScenarioName(scenario.name)
    setShowLoadModal(false)
    setMessage({ type: 'success', text: `Loaded: ${scenario.name}` })
  }

  // Delete scenario
  const deleteScenario = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSavedScenarios(savedScenarios.filter(s => s.id !== id))
      setMessage({ type: 'success', text: 'Scenario deleted' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete' })
    }
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setSp500Initial(1000000)
    setSp500Years(20)
    setSp500Return(11)
    setSp500DividendYield(1.5)
    setSp500DividendTax(25)
    setSp500CapGainsTax(26)
    setCondoInitial(1000000)
    setCondoYears(20)
    setCondoCycle(4)
    setCondoMultiplier(2)
    setCondoTaxRate(26)
    setTownhouseInitial(1000000)
    setTownhouseYears(20)
    setTownhouseCycle(3)
    setTownhouseMultiplier(2)
    setTownhouseTaxRate(26)
    setInflationRate(2.5)
    setTransactionCosts(2)
    setScenarioName('My Scenario')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 py-6 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Investment Comparison Model</h1>
              <p className="text-blue-200 text-sm mt-1">S&P 500 vs Real Estate (Condo & Townhouse) • Caizenx Hub</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/credit-card-statement"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
              >
                CC Statement Parser
              </Link>
              <input
                type="email"
                placeholder="Your email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm w-48"
              />
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition"
              >
                💾 Save
              </button>
              <button
                onClick={loadScenarios}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                📂 Load
              </button>
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
              >
                ↺ Reset
              </button>
            </div>
          </div>
          {message.text && (
            <div className={`mt-3 px-4 py-2 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
              {message.text}
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex overflow-x-auto">
            {['overview', 'sp500', 'condo', 'townhouse', 'analysis'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab === 'overview' && '📊 Overview'}
                {tab === 'sp500' && '📈 S&P 500'}
                {tab === 'condo' && '🏢 Condo'}
                {tab === 'townhouse' && '🏘️ Townhouse'}
                {tab === 'analysis' && '📋 Analysis'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* S&P 500 Card */}
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-6 border border-blue-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📈</span>
                  <h3 className="text-lg font-semibold">S&P 500</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Initial:</span>
                    <span>{formatCurrency(sp500Initial)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Final (after tax):</span>
                    <span className="text-blue-400 font-semibold">{formatCurrency(sp500Data.finalAfterTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Return:</span>
                    <span className="text-green-400">{sp500Data.totalReturn}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CAGR:</span>
                    <span>{sp500Data.cagr}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax Paid:</span>
                    <span className="text-red-400">{formatCurrency(sp500Data.totalTaxPaid)}</span>
                  </div>
                </div>
              </div>

              {/* Condo Card */}
              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-6 border border-purple-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🏢</span>
                  <h3 className="text-lg font-semibold">Condo Construction</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Initial:</span>
                    <span>{formatCurrency(condoInitial)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Final (after tax):</span>
                    <span className="text-purple-400 font-semibold">{formatCurrency(condoData.finalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Return:</span>
                    <span className="text-green-400">{condoData.totalReturn}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CAGR:</span>
                    <span>{condoData.cagr}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax Paid:</span>
                    <span className="text-red-400">{formatCurrency(condoData.totalTaxPaid)}</span>
                  </div>
                </div>
              </div>

              {/* Townhouse Card */}
              <div className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 rounded-xl p-6 border border-amber-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🏘️</span>
                  <h3 className="text-lg font-semibold">Townhouse Construction</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Initial:</span>
                    <span>{formatCurrency(townhouseInitial)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Final (after tax):</span>
                    <span className="text-amber-400 font-semibold">{formatCurrency(townhouseData.finalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Return:</span>
                    <span className="text-green-400">{townhouseData.totalReturn}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CAGR:</span>
                    <span>{townhouseData.cagr}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax Paid:</span>
                    <span className="text-red-400">{formatCurrency(townhouseData.totalTaxPaid)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Investment Growth Comparison</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="year" stroke="#9ca3af" label={{ value: 'Years', position: 'bottom', fill: '#9ca3af' }} />
                    <YAxis 
                      stroke="#9ca3af" 
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="sp500" stroke="#3b82f6" strokeWidth={2} name="S&P 500" dot={false} />
                    <Line type="stepAfter" dataKey="condo" stroke="#a855f7" strokeWidth={2} name="Condo" dot={false} />
                    <Line type="stepAfter" dataKey="townhouse" stroke="#f59e0b" strokeWidth={2} name="Townhouse" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* S&P 500 Tab */}
        {activeTab === 'sp500' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-6">S&P 500 Settings</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Initial Investment</label>
                <input
                  type="number"
                  value={sp500Initial}
                  onChange={(e) => setSp500Initial(Number(e.target.value) || 0)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                />
                <span className="text-xs text-gray-500">{formatCurrency(sp500Initial)}</span>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Investment Period: {sp500Years} years</label>
                <input
                  type="range" min="5" max="40" value={sp500Years}
                  onChange={(e) => setSp500Years(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Annual Return: {sp500Return}%</label>
                <input
                  type="range" min="5" max="15" step="0.5" value={sp500Return}
                  onChange={(e) => setSp500Return(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Dividend Yield: {sp500DividendYield}%</label>
                <input
                  type="range" min="0" max="5" step="0.1" value={sp500DividendYield}
                  onChange={(e) => setSp500DividendYield(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Dividend Tax Rate: {sp500DividendTax}%</label>
                <input
                  type="range" min="0" max="50" value={sp500DividendTax}
                  onChange={(e) => setSp500DividendTax(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Capital Gains Tax: {sp500CapGainsTax}%</label>
                <input
                  type="range" min="0" max="50" value={sp500CapGainsTax}
                  onChange={(e) => setSp500CapGainsTax(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Condo Tab */}
        {activeTab === 'condo' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-6">Condo Construction Settings</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Initial Investment</label>
                  <input
                    type="number"
                    value={condoInitial}
                    onChange={(e) => setCondoInitial(Number(e.target.value) || 0)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  />
                  <span className="text-xs text-gray-500">{formatCurrency(condoInitial)}</span>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Investment Period: {condoYears} years</label>
                  <input
                    type="range" min="5" max="40" value={condoYears}
                    onChange={(e) => setCondoYears(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Cycle Duration: {condoCycle} years</label>
                  <input
                    type="range" min="2" max="6" value={condoCycle}
                    onChange={(e) => setCondoCycle(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Multiplier: {condoMultiplier}x</label>
                  <input
                    type="range" min="1.5" max="3" step="0.1" value={condoMultiplier}
                    onChange={(e) => setCondoMultiplier(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tax Rate: {condoTaxRate}%</label>
                  <input
                    type="range" min="0" max="50" value={condoTaxRate}
                    onChange={(e) => setCondoTaxRate(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="bg-purple-900/30 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Effective Multiplier (after tax)</p>
                  <p className="text-2xl font-bold text-purple-400">{condoData.effectiveMultiplier}x</p>
                </div>
              </div>
            </div>

            {/* Condo Cycle Table */}
            {condoData.cycles.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Condo Cycle Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-3 text-gray-400">Cycle</th>
                        <th className="text-left py-2 px-3 text-gray-400">Year</th>
                        <th className="text-right py-2 px-3 text-gray-400">Gross Value</th>
                        <th className="text-right py-2 px-3 text-gray-400">Gain</th>
                        <th className="text-right py-2 px-3 text-gray-400">Tax</th>
                        <th className="text-right py-2 px-3 text-gray-400">Net Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {condoData.cycles.map((cycle) => (
                        <tr key={cycle.cycle} className="border-b border-gray-700/50">
                          <td className="py-2 px-3">{cycle.cycle}</td>
                          <td className="py-2 px-3">{cycle.year}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(cycle.grossValue)}</td>
                          <td className="py-2 px-3 text-right text-green-400">{formatCurrency(cycle.gain)}</td>
                          <td className="py-2 px-3 text-right text-red-400">{formatCurrency(cycle.tax)}</td>
                          <td className="py-2 px-3 text-right font-semibold">{formatCurrency(cycle.netValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Townhouse Tab */}
        {activeTab === 'townhouse' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-6">Townhouse Construction Settings</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Initial Investment</label>
                  <input
                    type="number"
                    value={townhouseInitial}
                    onChange={(e) => setTownhouseInitial(Number(e.target.value) || 0)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  />
                  <span className="text-xs text-gray-500">{formatCurrency(townhouseInitial)}</span>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Investment Period: {townhouseYears} years</label>
                  <input
                    type="range" min="5" max="40" value={townhouseYears}
                    onChange={(e) => setTownhouseYears(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Cycle Duration: {townhouseCycle} years</label>
                  <input
                    type="range" min="2" max="6" value={townhouseCycle}
                    onChange={(e) => setTownhouseCycle(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Multiplier: {townhouseMultiplier}x</label>
                  <input
                    type="range" min="1.5" max="3" step="0.1" value={townhouseMultiplier}
                    onChange={(e) => setTownhouseMultiplier(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tax Rate: {townhouseTaxRate}%</label>
                  <input
                    type="range" min="0" max="50" value={townhouseTaxRate}
                    onChange={(e) => setTownhouseTaxRate(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="bg-amber-900/30 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Effective Multiplier (after tax)</p>
                  <p className="text-2xl font-bold text-amber-400">{townhouseData.effectiveMultiplier}x</p>
                </div>
              </div>
            </div>

            {/* Townhouse Cycle Table */}
            {townhouseData.cycles.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Townhouse Cycle Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-3 text-gray-400">Cycle</th>
                        <th className="text-left py-2 px-3 text-gray-400">Year</th>
                        <th className="text-right py-2 px-3 text-gray-400">Gross Value</th>
                        <th className="text-right py-2 px-3 text-gray-400">Gain</th>
                        <th className="text-right py-2 px-3 text-gray-400">Tax</th>
                        <th className="text-right py-2 px-3 text-gray-400">Net Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {townhouseData.cycles.map((cycle) => (
                        <tr key={cycle.cycle} className="border-b border-gray-700/50">
                          <td className="py-2 px-3">{cycle.cycle}</td>
                          <td className="py-2 px-3">{cycle.year}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(cycle.grossValue)}</td>
                          <td className="py-2 px-3 text-right text-green-400">{formatCurrency(cycle.gain)}</td>
                          <td className="py-2 px-3 text-right text-red-400">{formatCurrency(cycle.tax)}</td>
                          <td className="py-2 px-3 text-right font-semibold">{formatCurrency(cycle.netValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Comparison Table */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Investment Comparison Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400">Metric</th>
                      <th className="text-right py-3 px-4 text-blue-400">S&P 500</th>
                      <th className="text-right py-3 px-4 text-purple-400">Condo</th>
                      <th className="text-right py-3 px-4 text-amber-400">Townhouse</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-gray-400">Initial Investment</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(sp500Initial)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(condoInitial)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(townhouseInitial)}</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-gray-400">Investment Period</td>
                      <td className="py-3 px-4 text-right">{sp500Years} years</td>
                      <td className="py-3 px-4 text-right">{condoYears} years</td>
                      <td className="py-3 px-4 text-right">{townhouseYears} years</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-gray-400">Final Value (After Tax)</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(sp500Data.finalAfterTax)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(condoData.finalValue)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(townhouseData.finalValue)}</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-gray-400">Total Return</td>
                      <td className="py-3 px-4 text-right text-green-400">{sp500Data.totalReturn}%</td>
                      <td className="py-3 px-4 text-right text-green-400">{condoData.totalReturn}%</td>
                      <td className="py-3 px-4 text-right text-green-400">{townhouseData.totalReturn}%</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-gray-400">CAGR (After Tax)</td>
                      <td className="py-3 px-4 text-right">{sp500Data.cagr}%</td>
                      <td className="py-3 px-4 text-right">{condoData.cagr}%</td>
                      <td className="py-3 px-4 text-right">{townhouseData.cagr}%</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-3 px-4 text-gray-400">Total Tax Paid</td>
                      <td className="py-3 px-4 text-right text-red-400">{formatCurrency(sp500Data.totalTaxPaid)}</td>
                      <td className="py-3 px-4 text-right text-red-400">{formatCurrency(condoData.totalTaxPaid)}</td>
                      <td className="py-3 px-4 text-right text-red-400">{formatCurrency(townhouseData.totalTaxPaid)}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-400">Cycles Completed</td>
                      <td className="py-3 px-4 text-right">—</td>
                      <td className="py-3 px-4 text-right">{condoData.cycles.length}</td>
                      <td className="py-3 px-4 text-right">{townhouseData.cycles.length}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Best Performer</p>
                  <p className="text-xl font-bold">
                    {Math.max(sp500Data.finalAfterTax, condoData.finalValue, townhouseData.finalValue) === sp500Data.finalAfterTax && (
                      <span className="text-blue-400">📈 S&P 500</span>
                    )}
                    {Math.max(sp500Data.finalAfterTax, condoData.finalValue, townhouseData.finalValue) === condoData.finalValue && (
                      <span className="text-purple-400">🏢 Condo</span>
                    )}
                    {Math.max(sp500Data.finalAfterTax, condoData.finalValue, townhouseData.finalValue) === townhouseData.finalValue && (
                      <span className="text-amber-400">🏘️ Townhouse</span>
                    )}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Highest CAGR</p>
                  <p className="text-xl font-bold">
                    {Math.max(parseFloat(sp500Data.cagr), parseFloat(condoData.cagr), parseFloat(townhouseData.cagr)).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Most Tax Efficient</p>
                  <p className="text-xl font-bold">
                    {Math.min(sp500Data.totalTaxPaid, condoData.totalTaxPaid, townhouseData.totalTaxPaid) === sp500Data.totalTaxPaid && (
                      <span className="text-blue-400">📈 S&P 500</span>
                    )}
                    {Math.min(sp500Data.totalTaxPaid, condoData.totalTaxPaid, townhouseData.totalTaxPaid) === condoData.totalTaxPaid && (
                      <span className="text-purple-400">🏢 Condo</span>
                    )}
                    {Math.min(sp500Data.totalTaxPaid, condoData.totalTaxPaid, townhouseData.totalTaxPaid) === townhouseData.totalTaxPaid && (
                      <span className="text-amber-400">🏘️ Townhouse</span>
                    )}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Total Tax Across All</p>
                  <p className="text-xl font-bold text-red-400">
                    {formatCurrency(sp500Data.totalTaxPaid + condoData.totalTaxPaid + townhouseData.totalTaxPaid)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Save Scenario</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Scenario Name</label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  placeholder="e.g., Conservative 20-year plan"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Your Email</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={saveScenario}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Load Scenario</h3>
            {savedScenarios.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No saved scenarios found for {userEmail}</p>
            ) : (
              <div className="space-y-3">
                {savedScenarios.map((scenario) => (
                  <div key={scenario.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{scenario.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(scenario.created_at!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => applyScenario(scenario)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteScenario(scenario.id!)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowLoadModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-4 px-6 mt-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>Caizenx Hub • Investment Comparison Model • Caizenx Homes Ltd.</p>
        </div>
      </footer>
    </div>
  )
}
