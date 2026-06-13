'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useCRM } from '@/lib/crm/store'
import { currency, relativeTime } from '@/lib/crm/format'
import { Card, StatCard, PageHeader, StatusBadge, Progress, Avatar } from '@/components/ui'

export default function Dashboard() {
  const crm = useCRM()

  const stats = useMemo(() => {
    const activeLeads = crm.leads.filter((l) => !['Converted', 'Lost'].includes(l.status))
    const soldUnits = crm.units.filter((u) => u.status === 'Sold')
    const availableUnits = crm.units.filter((u) => u.status === 'Available')
    const totalSalesValue = crm.contracts
      .filter((k) => ['Signed', 'Countersigned', 'Executed'].includes(k.status))
      .reduce((s, k) => s + k.amount, 0)
    const pipelineValue = crm.leads
      .filter((l) => !['Converted', 'Lost'].includes(l.status))
      .reduce((s, l) => s + l.budget, 0)
    const openContracts = crm.contracts.filter((k) => ['Draft', 'Sent', 'Viewed'].includes(k.status))
    return { activeLeads, soldUnits, availableUnits, totalSalesValue, pipelineValue, openContracts }
  }, [crm])

  const funnel = useMemo(() => {
    const order = ['New', 'Contacted', 'Qualified', 'Nurturing', 'Converted'] as const
    const total = crm.leads.length || 1
    return order.map((stage) => {
      const count = crm.leads.filter((l) => l.status === stage).length
      return { stage, count, pct: Math.round((count / total) * 100) }
    })
  }, [crm.leads])

  const recentActivity = useMemo(() => {
    const all = [
      ...crm.leads.flatMap((l) => l.activities.map((a) => ({ ...a, who: l.name, ctx: 'Lead' }))),
      ...crm.contacts.flatMap((c) => c.activities.map((a) => ({ ...a, who: c.name, ctx: 'Contact' }))),
    ]
    return all.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 6)
  }, [crm.leads, crm.contacts])

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Project marketing performance across Caizenx developments"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Leads" value={stats.activeLeads.length} sub={`${currency(stats.pipelineValue, true)} pipeline`} icon="🎯" accent="text-indigo-600" />
        <StatCard label="Sales Value" value={currency(stats.totalSalesValue, true)} sub={`${stats.soldUnits.length} units under contract`} icon="💵" accent="text-emerald-600" />
        <StatCard label="Available Units" value={stats.availableUnits.length} sub={`of ${crm.units.length} total`} icon="🏢" accent="text-sky-600" />
        <StatCard label="Open Contracts" value={stats.openContracts.length} sub="awaiting signature" icon="✍️" accent="text-amber-600" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pipeline funnel */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Lead Pipeline</h2>
            <Link href="/leads" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all →</Link>
          </div>
          <div className="space-y-3">
            {funnel.map((f) => (
              <div key={f.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{f.stage}</span>
                  <span className="text-slate-500">{f.count} leads</span>
                </div>
                <Progress value={f.pct} />
              </div>
            ))}
          </div>
        </Card>

        {/* Project occupancy */}
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Projects</h2>
          <div className="space-y-4">
            {crm.projects.map((p) => {
              const units = crm.units.filter((u) => u.projectId === p.id)
              const sold = units.filter((u) => u.status === 'Sold' || u.status === 'Reserved').length
              const pct = units.length ? Math.round((sold / units.length) * 100) : 0
              return (
                <div key={p.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{p.name}</span>
                    <span className="text-slate-500">{pct}% sold</span>
                  </div>
                  <Progress value={pct} tone={`bg-gradient-to-r ${p.accent}`} />
                  <p className="mt-0.5 text-xs text-slate-400">{p.location} · {units.length} units</p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">Recent Activity</h2>
          <ul className="space-y-3">
            {recentActivity.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <Avatar initials={a.who.split(' ').map((p) => p[0]).slice(0, 2).join('')} size="sm" color="bg-slate-300" />
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">{a.who}</span> · <span className="text-slate-400">{a.ctx}</span>
                  </p>
                  <p className="text-sm text-slate-500">{a.body}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-slate-400">{relativeTime(a.at)}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Quick links */}
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/leads', label: 'Add Lead', icon: '🎯' },
              { href: '/contracts', label: 'New Contract', icon: '✍️' },
              { href: '/inventory', label: 'Inventory', icon: '🏢' },
              { href: '/marketing', label: 'Campaigns', icon: '📣' },
              { href: '/change-orders', label: 'Change Orders', icon: '🔧' },
              { href: '/portal', label: 'Buyer Portal', icon: '🔑' },
            ].map((q) => (
              <Link key={q.href} href={q.href} className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 px-3 py-4 text-center transition hover:border-indigo-300 hover:bg-indigo-50">
                <span className="text-2xl">{q.icon}</span>
                <span className="text-xs font-medium text-slate-600">{q.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
