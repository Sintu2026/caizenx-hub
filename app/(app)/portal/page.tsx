'use client'

import React, { useMemo, useState } from 'react'
import { useCRM } from '@/lib/crm/store'
import { currency, dateShort, dateTime, initials as ini } from '@/lib/crm/format'
import {
  Card, PageHeader, StatusBadge, Button, Modal, Field, inputCls, Avatar, Badge, EmptyState,
} from '@/components/ui'

export default function BuyerPortalPage() {
  const crm = useCRM()
  const buyers = crm.contacts.filter((c) => ['Buyer', 'Owner'].includes(c.stage))
  const [buyerId, setBuyerId] = useState(buyers[0]?.id || '')
  const [showRequest, setShowRequest] = useState(false)
  const [message, setMessage] = useState('')

  const buyer = crm.contacts.find((c) => c.id === buyerId)
  const unit = crm.units.find((u) => u.buyerContactId === buyerId)
  const project = crm.projects.find((p) => p.id === unit?.projectId)
  const contracts = crm.contracts.filter((k) => k.contactId === buyerId)
  const changeOrders = crm.changeOrders.filter((co) => co.contactId === buyerId)
  const messages = useMemo(
    () => crm.messages.filter((m) => m.contactId === buyerId).sort((a, b) => +new Date(a.at) - +new Date(b.at)),
    [crm.messages, buyerId],
  )
  const rep = crm.reps.find((r) => r.id === buyer?.assignedTo)

  if (!buyer) return <EmptyState title="No buyers in portal yet" hint="Convert a lead and execute a contract first." />

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Buyer Portal Preview</p>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {buyer.name.split(' ')[0]} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Viewing as:</span>
          <select className={`${inputCls} max-w-[12rem]`} value={buyerId} onChange={(e) => setBuyerId(e.target.value)}>
            {buyers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* My home hero */}
      {unit && project && (
        <div className={`mb-6 overflow-hidden rounded-2xl bg-gradient-to-r ${project.accent} p-6 text-white`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/80">{project.name} · {project.location}</p>
              <h2 className="text-2xl font-bold">Unit {unit.unitNumber}</h2>
              <p className="mt-1 text-sm text-white/80">{unit.model} · {unit.beds} bed · {unit.baths} bath · {unit.sqft.toLocaleString()} sqft</p>
              <div className="mt-3"><StatusBadge status={unit.status} /></div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70">Purchase price</p>
              <p className="text-2xl font-bold">{currency(unit.price)}</p>
              <p className="mt-1 text-xs text-white/70">Est. completion {project.completion}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Contracts & paperwork */}
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-900">My Documents</h2>
            <div className="space-y-2">
              {contracts.map((k) => {
                const u = crm.units.find((x) => x.id === k.unitId)
                return (
                  <div key={k.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📄</span>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Purchase Agreement · Unit {u?.unitNumber}</p>
                        <p className="text-xs text-slate-400">{currency(k.amount)} · created {dateShort(k.createdAt)}</p>
                      </div>
                    </div>
                    <StatusBadge status={k.status} />
                  </div>
                )
              })}
              {buyer.documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📎</span>
                    <p className="text-sm font-medium text-slate-700">{d.name}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
              {contracts.length === 0 && buyer.documents.length === 0 && <p className="text-sm text-slate-400">No documents yet.</p>}
            </div>
          </Card>

          {/* Change orders */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">My Change Requests</h2>
              <Button size="sm" onClick={() => setShowRequest(true)}>+ Request a change</Button>
            </div>
            <div className="space-y-2">
              {changeOrders.length === 0 ? (
                <p className="text-sm text-slate-400">No change requests submitted.</p>
              ) : changeOrders.map((co) => (
                <div key={co.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{co.title}</p>
                    <p className="text-xs text-slate-400">{co.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">{currency(co.amount)}</p>
                    <StatusBadge status={co.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Communication + advisor */}
        <div className="space-y-6">
          {rep && (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold text-slate-900">Your Advisor</h2>
              <div className="flex items-center gap-3">
                <Avatar initials={rep.initials} color={rep.color} size="lg" />
                <div>
                  <p className="font-medium text-slate-800">{rep.name}</p>
                  <p className="text-xs text-slate-400">{rep.email}</p>
                  <p className="text-xs text-slate-400">{rep.phone}</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="flex h-[28rem] flex-col p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Messages</h2>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === 'Buyer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === 'Buyer' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    <p>{m.body}</p>
                    <p className={`mt-1 text-[10px] ${m.from === 'Buyer' ? 'text-indigo-200' : 'text-slate-400'}`}>{dateTime(m.at)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input className={inputCls} placeholder="Message your advisor…" value={message} onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && message.trim()) { crm.addMessage({ contactId: buyerId, from: 'Buyer', body: message }); setMessage('') } }} />
              <Button size="sm" onClick={() => { if (message.trim()) { crm.addMessage({ contactId: buyerId, from: 'Buyer', body: message }); setMessage('') } }}>Send</Button>
            </div>
          </Card>
        </div>
      </div>

      {showRequest && unit && <RequestChange buyerId={buyerId} unitId={unit.id} onClose={() => setShowRequest(false)} />}
    </>
  )
}

function RequestChange({ buyerId, unitId, onClose }: { buyerId: string; unitId: string; onClose: () => void }) {
  const crm = useCRM()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const buyer = crm.contacts.find((c) => c.id === buyerId)

  const submit = () => {
    if (!title.trim()) return
    const contract = crm.contracts.find((k) => k.unitId === unitId)
    crm.addChangeOrder({ contactId: buyerId, unitId, contractId: contract?.id || null, title, description, amount: 0, requestedBy: buyer?.name })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Request a Change"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={!title.trim()}>Submit Request</Button></>}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Tell us what you'd like to change. Our design team will review and send pricing.</p>
        <Field label="What would you like to change?"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Upgrade kitchen countertops" /></Field>
        <Field label="Details"><textarea className={inputCls} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      </div>
    </Modal>
  )
}
