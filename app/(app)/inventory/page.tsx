'use client'

import React, { useMemo, useState } from 'react'
import { useCRM } from '@/lib/crm/store'
import { currency } from '@/lib/crm/format'
import { Unit, UnitStatus } from '@/lib/crm/types'
import {
  Card, PageHeader, StatusBadge, Button, Modal, Field, inputCls, EmptyState, StatCard, Badge,
} from '@/components/ui'

const UNIT_STATUSES: UnitStatus[] = ['Available', 'Held', 'Reserved', 'Sold']

export default function InventoryPage() {
  const crm = useCRM()
  const [activeProject, setActiveProject] = useState<string>(crm.projects[0]?.id || '')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selected, setSelected] = useState<Unit | null>(null)

  const project = crm.projects.find((p) => p.id === activeProject)
  const units = useMemo(
    () => crm.units.filter((u) => u.projectId === activeProject && (statusFilter === 'All' || u.status === statusFilter)),
    [crm.units, activeProject, statusFilter],
  )

  const summary = useMemo(() => {
    const all = crm.units.filter((u) => u.projectId === activeProject)
    const byStatus = (s: UnitStatus) => all.filter((u) => u.status === s).length
    const inventoryValue = all.reduce((s, u) => s + u.price, 0)
    const soldValue = all.filter((u) => ['Sold', 'Reserved'].includes(u.status)).reduce((s, u) => s + u.price, 0)
    return { total: all.length, available: byStatus('Available'), reserved: byStatus('Reserved') + byStatus('Held'), sold: byStatus('Sold'), inventoryValue, soldValue }
  }, [crm.units, activeProject])

  const current = selected ? crm.units.find((u) => u.id === selected.id) || null : null

  return (
    <>
      <PageHeader title="Inventory" subtitle="Unit availability and pricing across projects" />

      <div className="mb-5 flex flex-wrap gap-2">
        {crm.projects.map((p) => (
          <button key={p.id} onClick={() => setActiveProject(p.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${activeProject === p.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'}`}>
            {p.name}
          </button>
        ))}
      </div>

      {project && (
        <div className={`mb-6 rounded-2xl bg-gradient-to-r ${project.accent} p-6 text-white`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{project.name}</h2>
              <p className="text-sm text-white/80">{project.location} · {project.type} · Completion {project.completion}</p>
              <p className="mt-2 max-w-xl text-sm text-white/80">{project.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70">Total inventory value</p>
              <p className="text-2xl font-bold">{currency(summary.inventoryValue, true)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Available" value={summary.available} accent="text-emerald-600" />
        <StatCard label="Held / Reserved" value={summary.reserved} accent="text-amber-600" />
        <StatCard label="Sold" value={summary.sold} accent="text-slate-700" />
        <StatCard label="Sold value" value={currency(summary.soldValue, true)} accent="text-indigo-600" />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {['All', ...UNIT_STATUSES].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'}`}>
            {s}
          </button>
        ))}
      </div>

      {units.length === 0 ? (
        <EmptyState title="No units match this filter" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((u) => {
            const buyer = crm.contacts.find((c) => c.id === u.buyerContactId)
            return (
              <Card key={u.id} className="cursor-pointer p-5 transition hover:shadow-md" >
                <div onClick={() => setSelected(u)}>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-slate-800">{u.unitNumber}</p>
                    <StatusBadge status={u.status} />
                  </div>
                  <p className="text-sm text-slate-500">{u.model} · Floor {u.floor}</p>
                  <div className="mt-3 flex gap-3 text-sm text-slate-600">
                    <span>🛏 {u.beds} bd</span>
                    <span>🛁 {u.baths} ba</span>
                    <span>📐 {u.sqft.toLocaleString()} sf</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <p className="text-xl font-bold text-slate-900">{currency(u.price)}</p>
                    {buyer && <span className="text-xs text-slate-400">{buyer.name}</span>}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {current && <UnitDetail unit={current} onClose={() => setSelected(null)} />}
    </>
  )
}

function UnitDetail({ unit, onClose }: { unit: Unit; onClose: () => void }) {
  const crm = useCRM()
  const [form, setForm] = useState({ price: unit.price, status: unit.status, buyerContactId: unit.buyerContactId || '' })
  const project = crm.projects.find((p) => p.id === unit.projectId)

  const save = () => {
    crm.updateUnit(unit.id, {
      price: form.price,
      status: form.status as UnitStatus,
      buyerContactId: form.buyerContactId || null,
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={`Unit ${unit.unitNumber} · ${project?.name}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {unit.model} · Floor {unit.floor} · {unit.beds} bed / {unit.baths} bath · {unit.sqft.toLocaleString()} sqft
        </div>
        <Field label="List price"><input type="number" className={inputCls} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: +e.target.value }))} /></Field>
        <Field label="Status">
          <select className={inputCls} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as UnitStatus }))}>
            {UNIT_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <div className="col-span-2">
          <Field label="Assigned buyer">
            <select className={inputCls} value={form.buyerContactId} onChange={(e) => setForm((f) => ({ ...f, buyerContactId: e.target.value }))}>
              <option value="">— None —</option>
              {crm.contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  )
}
