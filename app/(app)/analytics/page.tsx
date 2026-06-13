'use client'

import React, { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import { useCRM } from '@/lib/crm/store'
import { currency } from '@/lib/crm/format'
import { Card, PageHeader, StatCard } from '@/components/ui'

const COLORS = ['#6366f1', '#10b981', '#06b6d4', '#f59e0b', '#f43f5e', '#8b5cf6', '#0ea5e9']

export default function AnalyticsPage() {
  const crm = useCRM()

  const salesByProject = useMemo(() =>
    crm.projects.map((p) => {
      const units = crm.units.filter((u) => u.projectId === p.id)
      const sold = units.filter((u) => ['Sold', 'Reserved'].includes(u.status))
      return {
        name: p.name.split(' ')[0],
        revenue: Math.round(sold.reduce((s, u) => s + u.price, 0) / 1000),
        available: units.filter((u) => u.status === 'Available').length,
        sold: sold.length,
      }
    }), [crm.projects, crm.units])

  const funnel = useMemo(() => {
    const order = ['New', 'Contacted', 'Qualified', 'Nurturing', 'Converted']
    return order.map((stage) => ({ stage, count: crm.leads.filter((l) => l.status === stage).length }))
  }, [crm.leads])

  const channelData = useMemo(() => {
    const map: Record<string, number> = {}
    crm.campaigns.forEach((c) => { map[c.channel] = (map[c.channel] || 0) + c.leadsGenerated })
    crm.leads.forEach((l) => { if (!map[l.source]) map[l.source] = (map[l.source] || 0) })
    return Object.entries(map).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
  }, [crm.campaigns, crm.leads])

  const inventoryMix = useMemo(() => {
    const statuses = ['Available', 'Held', 'Reserved', 'Sold']
    return statuses.map((s) => ({ name: s, value: crm.units.filter((u) => u.status === s).length }))
  }, [crm.units])

  // simulated 6-month revenue trend from executed contracts
  const revenueTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const base = [1.2, 2.1, 1.8, 3.4, 2.9, 4.1]
    return months.map((m, i) => ({ month: m, revenue: base[i] }))
  }, [])

  const totalRevenue = crm.contracts.filter((k) => ['Signed', 'Countersigned', 'Executed'].includes(k.status)).reduce((s, k) => s + k.amount, 0)
  const conversionRate = crm.leads.length ? Math.round((crm.leads.filter((l) => l.status === 'Converted').length / crm.leads.length) * 100) : 0
  const avgDeal = crm.contracts.length ? Math.round(totalRevenue / Math.max(1, crm.contracts.filter((k) => ['Signed', 'Countersigned', 'Executed'].includes(k.status)).length)) : 0

  return (
    <>
      <PageHeader title="Analytics" subtitle="Sales, marketing and inventory performance" />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total revenue" value={currency(totalRevenue, true)} accent="text-emerald-600" />
        <StatCard label="Lead conversion" value={`${conversionRate}%`} accent="text-indigo-600" />
        <StatCard label="Avg deal size" value={currency(avgDeal, true)} accent="text-sky-600" />
        <StatCard label="Units sold" value={crm.units.filter((u) => u.status === 'Sold').length} accent="text-slate-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Revenue by Project <span className="text-xs font-normal text-slate-400">(in $000s)</span></h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesByProject}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}k`} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Revenue Trend <span className="text-xs font-normal text-slate-400">(in $M)</span></h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip formatter={(v: number) => `$${v}M`} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Lead Funnel</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 12 }} stroke="#94a3b8" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#06b6d4" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Inventory Mix</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={inventoryMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => `${e.name}: ${e.value}`}>
                {inventoryMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">Leads by Channel</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={channelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  )
}
