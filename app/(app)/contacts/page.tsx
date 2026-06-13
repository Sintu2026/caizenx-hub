'use client'

import React, { useState } from 'react'
import { useCRM } from '@/lib/crm/store'
import { dateShort, relativeTime, initials as ini } from '@/lib/crm/format'
import { Contact, ContactStage } from '@/lib/crm/types'
import {
  Card, PageHeader, StatusBadge, Button, Modal, Avatar, Badge, EmptyState, Field, inputCls,
} from '@/components/ui'

const STAGES: ContactStage[] = ['Prospect', 'Buyer', 'Owner', 'Past Client']

export default function ContactsPage() {
  const crm = useCRM()
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('All')
  const current = crm.contacts.find((c) => c.id === selected) || null

  const filtered = crm.contacts.filter((c) => filter === 'All' || c.stage === filter)

  return (
    <>
      <PageHeader title="Contacts" subtitle={`${crm.contacts.length} contacts converted from leads`} />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {['All', ...STAGES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'}`}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No contacts yet" hint="Convert a qualified lead to create a contact." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const rep = crm.reps.find((r) => r.id === c.assignedTo)
            const project = crm.projects.find((p) => p.id === c.projectId)
            return (
              <Card key={c.id} className="cursor-pointer p-5 transition hover:shadow-md" >
                <div onClick={() => setSelected(c.id)}>
                  <div className="flex items-center justify-between">
                    <Avatar initials={ini(c.name)} size="lg" color="bg-violet-500" />
                    <StatusBadge status={c.stage} />
                  </div>
                  <p className="mt-3 font-semibold text-slate-800">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.email}</p>
                  <div className="mt-3 space-y-1 text-xs text-slate-400">
                    <p>📞 {c.phone}</p>
                    <p>🏢 {project?.name || 'No project'}</p>
                    <p>🤝 {rep?.name || 'Unassigned'} · {c.documents.length} docs</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {current && <ContactDetail contact={current} onClose={() => setSelected(null)} />}
    </>
  )
}

function ContactDetail({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const crm = useCRM()
  const [note, setNote] = useState('')
  const rep = crm.reps.find((r) => r.id === contact.assignedTo)
  const project = crm.projects.find((p) => p.id === contact.projectId)
  const contracts = crm.contracts.filter((k) => k.contactId === contact.id)

  return (
    <Modal open onClose={onClose} wide title={contact.name}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar initials={ini(contact.name)} size="lg" color="bg-violet-500" />
            <div>
              <StatusBadge status={contact.stage} />
              <p className="mt-1 text-xs text-slate-400">Contact since {dateShort(contact.createdAt)}</p>
            </div>
          </div>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={contact.email} />
            <Row label="Phone" value={contact.phone} />
            <Row label="Address" value={contact.address || '—'} />
            <Row label="Project" value={project?.name || '—'} />
            <Row label="Advisor" value={rep?.name || 'Unassigned'} />
          </dl>
          <Field label="Stage">
            <select className={inputCls} value={contact.stage} onChange={(e) => crm.updateContact(contact.id, { stage: e.target.value as ContactStage })}>
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <div>
            <h4 className="mb-2 mt-2 text-sm font-semibold text-slate-700">Contracts</h4>
            {contracts.length === 0 ? (
              <p className="text-sm text-slate-400">No contracts yet — start one from the Contracts module.</p>
            ) : (
              <ul className="space-y-2">
                {contracts.map((k) => {
                  const unit = crm.units.find((u) => u.id === k.unitId)
                  return (
                    <li key={k.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <span className="text-slate-600">{unit?.unitNumber} · {project?.name}</span>
                      <StatusBadge status={k.status} />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">Paperwork ({contact.documents.length})</h4>
            <ul className="space-y-1.5">
              {contact.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-slate-600">📄 {d.name}</span>
                  <StatusBadge status={d.status} />
                </li>
              ))}
              {contact.documents.length === 0 && <p className="text-sm text-slate-400">No documents on file.</p>}
            </ul>
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Communication Log</h4>
          <div className="mb-3 flex gap-2">
            <input className={inputCls} placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && note.trim()) { crm.logActivity('contact', contact.id, { type: 'Note', body: note }); setNote('') } }} />
            <Button size="sm" onClick={() => { if (note.trim()) { crm.logActivity('contact', contact.id, { type: 'Note', body: note }); setNote('') } }}>Add</Button>
          </div>
          <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {contact.activities.map((a) => (
              <li key={a.id} className="border-l-2 border-slate-200 pl-3">
                <div className="flex items-center gap-2">
                  <Badge tone="purple">{a.type}</Badge>
                  <span className="text-xs text-slate-400">{relativeTime(a.at)} · {a.by}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{a.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-700">{value}</dd>
    </div>
  )
}
