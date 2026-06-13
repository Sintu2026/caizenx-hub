'use client'

import React, { useMemo, useState } from 'react'
import { useCRM } from '@/lib/crm/store'
import { currency } from '@/lib/crm/format'
import { SalesRep } from '@/lib/crm/types'
import {
  Card, PageHeader, Button, Modal, Field, inputCls, Avatar, Progress, Badge,
} from '@/components/ui'

export default function SalesTeamPage() {
  const crm = useCRM()
  const [showNew, setShowNew] = useState(false)

  const repStats = useMemo(() => {
    return crm.reps.map((r) => {
      const closed = crm.contracts.filter((k) => k.salesRepId === r.id && ['Signed', 'Countersigned', 'Executed'].includes(k.status))
      const sales = closed.reduce((s, k) => s + k.amount, 0)
      const leads = crm.leads.filter((l) => l.assignedTo === r.id && !['Converted', 'Lost'].includes(l.status)).length
      const commission = crm.commissions.filter((c) => c.salesRepId === r.id).reduce((s, c) => s + c.amount, 0)
      const attainment = Math.round((sales / (r.target || 1)) * 100)
      return { rep: r, sales, leads, commission, deals: closed.length, attainment }
    }).sort((a, b) => b.sales - a.sales)
  }, [crm.reps, crm.contracts, crm.leads, crm.commissions])

  return (
    <>
      <PageHeader
        title="Sales Team"
        subtitle="Advisor performance, targets and pipeline"
        actions={<Button onClick={() => setShowNew(true)}>+ Add Advisor</Button>}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {repStats.map(({ rep, sales, leads, commission, deals, attainment }, i) => (
          <Card key={rep.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar initials={rep.initials} color={rep.color} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{rep.name}</p>
                    {i === 0 && <Badge tone="amber">🏆 Top performer</Badge>}
                  </div>
                  <p className="text-sm text-slate-500">{rep.title}</p>
                  <p className="text-xs text-slate-400">{rep.email} · {rep.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Commission rate</p>
                <p className="font-semibold text-slate-700">{rep.commissionRate}%</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-lg font-bold text-slate-800">{currency(sales, true)}</p>
                <p className="text-xs text-slate-400">Sales · {deals} deals</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-lg font-bold text-slate-800">{leads}</p>
                <p className="text-xs text-slate-400">Active leads</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-lg font-bold text-emerald-600">{currency(commission, true)}</p>
                <p className="text-xs text-slate-400">Commission</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>Target attainment</span>
                <span>{attainment}% of {currency(rep.target, true)}</span>
              </div>
              <Progress value={attainment} tone={attainment >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'} />
            </div>
          </Card>
        ))}
      </div>

      {showNew && <NewRep onClose={() => setShowNew(false)} />}
    </>
  )
}

function NewRep({ onClose }: { onClose: () => void }) {
  const crm = useCRM()
  const [form, setForm] = useState<Partial<SalesRep>>({ commissionRate: 2, target: 8000000, title: 'Sales Advisor' })
  const set = (k: keyof SalesRep, v: any) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal open onClose={onClose} title="Add Sales Advisor"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { crm.addRep(form); onClose() }} disabled={!form.name}>Add</Button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name"><input className={inputCls} value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Title"><input className={inputCls} value={form.title || ''} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="Email"><input className={inputCls} value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Phone"><input className={inputCls} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Commission rate (%)"><input type="number" step="0.1" className={inputCls} value={form.commissionRate || 0} onChange={(e) => set('commissionRate', +e.target.value)} /></Field>
        <Field label="Annual target ($)"><input type="number" className={inputCls} value={form.target || 0} onChange={(e) => set('target', +e.target.value)} /></Field>
      </div>
    </Modal>
  )
}
