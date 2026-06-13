'use client'

import React, { useMemo, useState } from 'react'
import { useCRM } from '@/lib/crm/store'
import { currency, dateShort } from '@/lib/crm/format'
import { Campaign, CampaignChannel } from '@/lib/crm/types'
import {
  Card, PageHeader, StatusBadge, Button, Modal, Field, inputCls, StatCard, Progress, EmptyState,
} from '@/components/ui'

const CHANNELS: CampaignChannel[] = ['Facebook', 'Instagram', 'Google Ads', 'Email', 'Billboard', 'Event', 'Realtor Network']

export default function MarketingPage() {
  const crm = useCRM()
  const [showNew, setShowNew] = useState(false)

  const totals = useMemo(() => {
    const budget = crm.campaigns.reduce((s, c) => s + c.budget, 0)
    const spent = crm.campaigns.reduce((s, c) => s + c.spent, 0)
    const leads = crm.campaigns.reduce((s, c) => s + c.leadsGenerated, 0)
    const cpl = leads ? Math.round(spent / leads) : 0
    return { budget, spent, leads, cpl }
  }, [crm.campaigns])

  // leads by source (attribution)
  const bySource = useMemo(() => {
    const map: Record<string, number> = {}
    crm.leads.forEach((l) => { map[l.source] = (map[l.source] || 0) + 1 })
    const max = Math.max(1, ...Object.values(map))
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([source, count]) => ({ source, count, pct: Math.round((count / max) * 100) }))
  }, [crm.leads])

  return (
    <>
      <PageHeader
        title="Marketing"
        subtitle="Campaign performance and lead attribution"
        actions={<Button onClick={() => setShowNew(true)}>+ New Campaign</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total budget" value={currency(totals.budget, true)} accent="text-slate-700" />
        <StatCard label="Spent" value={currency(totals.spent, true)} sub={`${Math.round((totals.spent / (totals.budget || 1)) * 100)}% utilized`} accent="text-indigo-600" />
        <StatCard label="Leads generated" value={totals.leads} accent="text-emerald-600" />
        <StatCard label="Cost per lead" value={currency(totals.cpl)} accent="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {crm.campaigns.length === 0 ? <EmptyState title="No campaigns yet" /> : crm.campaigns.map((c) => {
            const project = crm.projects.find((p) => p.id === c.projectId)
            const util = Math.round((c.spent / (c.budget || 1)) * 100)
            const cpl = c.leadsGenerated ? Math.round(c.spent / c.leadsGenerated) : 0
            return (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{c.name}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{c.channel} · {project?.name || 'All projects'} · {dateShort(c.startDate)} → {dateShort(c.endDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">{c.leadsGenerated} leads</p>
                    <p className="text-xs text-slate-400">{currency(cpl)}/lead</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>{currency(c.spent)} of {currency(c.budget)}</span>
                    <span>{util}%</span>
                  </div>
                  <Progress value={util} tone={util > 90 ? 'bg-rose-500' : 'bg-indigo-500'} />
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Lead Attribution</h2>
          <div className="space-y-3">
            {bySource.map((s) => (
              <div key={s.source}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-600">{s.source}</span>
                  <span className="text-slate-400">{s.count}</span>
                </div>
                <Progress value={s.pct} tone="bg-gradient-to-r from-indigo-400 to-violet-500" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {showNew && <NewCampaign onClose={() => setShowNew(false)} />}
    </>
  )
}

function NewCampaign({ onClose }: { onClose: () => void }) {
  const crm = useCRM()
  const [form, setForm] = useState<Partial<Campaign>>({ channel: 'Facebook', budget: 10000 })
  const set = (k: keyof Campaign, v: any) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal open onClose={onClose} title="New Campaign"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { crm.addCampaign(form); onClose() }} disabled={!form.name}>Create</Button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Campaign name"><input className={inputCls} value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field></div>
        <Field label="Channel">
          <select className={inputCls} value={form.channel} onChange={(e) => set('channel', e.target.value)}>
            {CHANNELS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Project">
          <select className={inputCls} value={form.projectId || ''} onChange={(e) => set('projectId', e.target.value || null)}>
            <option value="">All projects</option>
            {crm.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Budget ($)"><input type="number" className={inputCls} value={form.budget || 0} onChange={(e) => set('budget', +e.target.value)} /></Field>
        <Field label="End date"><input type="date" className={inputCls} onChange={(e) => set('endDate', new Date(e.target.value).toISOString())} /></Field>
      </div>
    </Modal>
  )
}
