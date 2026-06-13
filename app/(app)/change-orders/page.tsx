'use client'

import React, { useState } from 'react'
import { useCRM } from '@/lib/crm/store'
import { currency, dateShort } from '@/lib/crm/format'
import { ChangeOrder, ChangeOrderStatus } from '@/lib/crm/types'
import {
  Card, PageHeader, StatusBadge, Button, Modal, Field, inputCls, EmptyState, StatCard,
} from '@/components/ui'

const CO_STATUSES: ChangeOrderStatus[] = ['Requested', 'Under Review', 'Approved', 'Rejected', 'Completed']

export default function ChangeOrdersPage() {
  const crm = useCRM()
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter] = useState('All')

  const filtered = crm.changeOrders.filter((c) => filter === 'All' || c.status === filter)
  const totalValue = crm.changeOrders.filter((c) => ['Approved', 'Completed'].includes(c.status)).reduce((s, c) => s + c.amount, 0)
  const pending = crm.changeOrders.filter((c) => ['Requested', 'Under Review'].includes(c.status)).length

  return (
    <>
      <PageHeader
        title="Change Orders"
        subtitle="Buyer-requested upgrades and modifications"
        actions={<Button onClick={() => setShowNew(true)}>+ New Change Order</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Open requests" value={pending} accent="text-amber-600" />
        <StatCard label="Approved value" value={currency(totalValue)} accent="text-emerald-600" />
        <StatCard label="Total orders" value={crm.changeOrders.length} accent="text-slate-700" />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {['All', ...CO_STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'}`}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No change orders" />
      ) : (
        <div className="space-y-3">
          {filtered.map((co) => {
            const unit = crm.units.find((u) => u.id === co.unitId)
            const contact = crm.contacts.find((c) => c.id === co.contactId)
            const project = crm.projects.find((p) => p.id === unit?.projectId)
            return (
              <Card key={co.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{co.title}</p>
                      <StatusBadge status={co.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{co.description}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {project?.name} · Unit {unit?.unitNumber} · {contact?.name} · requested {dateShort(co.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-bold text-slate-900">{currency(co.amount)}</p>
                    <select
                      className={`${inputCls} max-w-[10rem] py-1.5 text-xs`}
                      value={co.status}
                      onChange={(e) => crm.updateChangeOrder(co.id, { status: e.target.value as ChangeOrderStatus })}
                    >
                      {CO_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {showNew && <NewChangeOrder onClose={() => setShowNew(false)} />}
    </>
  )
}

function NewChangeOrder({ onClose }: { onClose: () => void }) {
  const crm = useCRM()
  const [form, setForm] = useState<Partial<ChangeOrder>>({ amount: 0 })
  const set = (k: keyof ChangeOrder, v: any) => setForm((f) => ({ ...f, [k]: v }))
  const contact = crm.contacts.find((c) => c.id === form.contactId)

  const ownedUnits = crm.units.filter((u) => u.buyerContactId === form.contactId)

  const save = () => {
    if (!form.contactId || !form.unitId) return
    const contract = crm.contracts.find((k) => k.unitId === form.unitId)
    crm.addChangeOrder({ ...form, contractId: contract?.id || null, requestedBy: contact?.name || 'Buyer' })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="New Change Order"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!form.contactId || !form.unitId || !form.title}>Submit</Button></>}>
      <div className="space-y-4">
        <Field label="Buyer">
          <select className={inputCls} value={form.contactId || ''} onChange={(e) => { set('contactId', e.target.value); set('unitId', undefined) }}>
            <option value="">— Select buyer —</option>
            {crm.contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Unit">
          <select className={inputCls} value={form.unitId || ''} onChange={(e) => set('unitId', e.target.value)} disabled={!form.contactId}>
            <option value="">— Select unit —</option>
            {ownedUnits.map((u) => <option key={u.id} value={u.id}>{u.unitNumber} · {u.model}</option>)}
          </select>
        </Field>
        <Field label="Title"><input className={inputCls} value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Hardwood flooring upgrade" /></Field>
        <Field label="Description"><textarea className={inputCls} rows={3} value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></Field>
        <Field label="Cost ($)"><input type="number" className={inputCls} value={form.amount || 0} onChange={(e) => set('amount', +e.target.value)} /></Field>
      </div>
    </Modal>
  )
}
