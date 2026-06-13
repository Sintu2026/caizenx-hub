'use client'

import React, { useMemo, useState } from 'react'
import { useCRM } from '@/lib/crm/store'
import { currency, relativeTime, initials as ini } from '@/lib/crm/format'
import { Lead, LeadStatus, LeadSource } from '@/lib/crm/types'
import {
  Card, PageHeader, StatusBadge, Button, Modal, Field, inputCls, Avatar, EmptyState, Badge,
} from '@/components/ui'

const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Nurturing', 'Converted', 'Lost']
const SOURCES: LeadSource[] = ['Website', 'Walk-in', 'Referral', 'Facebook', 'Instagram', 'Google Ads', 'Realtor', 'Event']

export default function LeadsPage() {
  const crm = useCRM()
  const [filter, setFilter] = useState<string>('All')
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Lead | null>(null)

  const filtered = useMemo(() => {
    return crm.leads.filter((l) => {
      if (filter !== 'All' && l.status !== filter) return false
      if (query && !`${l.name} ${l.email}`.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [crm.leads, filter, query])

  const repName = (id: string | null) => crm.reps.find((r) => r.id === id)?.name || 'Unassigned'
  const projName = (id: string | null) => crm.projects.find((p) => p.id === id)?.name || '—'
  const current = selected ? crm.leads.find((l) => l.id === selected.id) || null : null

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle={`${crm.leads.length} leads · ${crm.leads.filter((l) => !['Converted', 'Lost'].includes(l.status)).length} active`}
        actions={<Button onClick={() => setShowAdd(true)}>+ Add Lead</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input className={`${inputCls} sm:max-w-xs`} placeholder="Search leads…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {['All', ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div className="p-6"><EmptyState title="No leads match your filters" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Budget</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} onClick={() => setSelected(l)} className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={ini(l.name)} size="sm" color="bg-indigo-400" />
                        <div>
                          <p className="font-medium text-slate-800">{l.name}</p>
                          <p className="text-xs text-slate-400">{l.source}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{projName(l.projectId)}</td>
                    <td className="px-4 py-3 text-slate-600">{currency(l.budget, true)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${l.score >= 75 ? 'bg-emerald-500' : l.score >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${l.score}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{l.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{repName(l.assignedTo)}</td>
                    <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{relativeTime(l.lastActivity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} />}
      {current && <LeadDetail lead={current} onClose={() => setSelected(null)} />}
    </>
  )
}

function AddLeadModal({ onClose }: { onClose: () => void }) {
  const crm = useCRM()
  const [form, setForm] = useState<Partial<Lead>>({ source: 'Website', status: 'New', score: 50, budget: 700000 })
  const set = (k: keyof Lead, v: any) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Lead"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { crm.addLead(form); onClose() }} disabled={!form.name}>Save Lead</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name"><input className={inputCls} value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Email"><input className={inputCls} value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Phone"><input className={inputCls} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Budget"><input type="number" className={inputCls} value={form.budget || 0} onChange={(e) => set('budget', +e.target.value)} /></Field>
        <Field label="Source">
          <select className={inputCls} value={form.source} onChange={(e) => set('source', e.target.value)}>
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Project interest">
          <select className={inputCls} value={form.projectId || ''} onChange={(e) => set('projectId', e.target.value || null)}>
            <option value="">— None —</option>
            {crm.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Assign to">
          <select className={inputCls} value={form.assignedTo || ''} onChange={(e) => set('assignedTo', e.target.value || null)}>
            <option value="">— Unassigned —</option>
            {crm.reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <Field label="Lead score"><input type="number" min={0} max={100} className={inputCls} value={form.score || 0} onChange={(e) => set('score', +e.target.value)} /></Field>
        <div className="sm:col-span-2">
          <Field label="Notes"><textarea className={inputCls} rows={2} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} /></Field>
        </div>
      </div>
    </Modal>
  )
}

function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const crm = useCRM()
  const [note, setNote] = useState('')
  const [noteType, setNoteType] = useState<'Note' | 'Call' | 'Email' | 'Meeting'>('Note')
  const rep = crm.reps.find((r) => r.id === lead.assignedTo)
  const project = crm.projects.find((p) => p.id === lead.projectId)

  const addNote = () => {
    if (!note.trim()) return
    crm.logActivity('lead', lead.id, { type: noteType, body: note })
    setNote('')
  }

  return (
    <Modal open onClose={onClose} wide title={lead.name}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar initials={ini(lead.name)} size="lg" color="bg-indigo-500" />
            <div>
              <StatusBadge status={lead.status} />
              <p className="mt-1 text-sm text-slate-500">{lead.source} lead · score {lead.score}</p>
            </div>
          </div>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={lead.email} />
            <Row label="Phone" value={lead.phone} />
            <Row label="Budget" value={currency(lead.budget)} />
            <Row label="Project" value={project?.name || '—'} />
            <Row label="Owner" value={rep?.name || 'Unassigned'} />
          </dl>
          {lead.notes && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{lead.notes}</p>}

          <div className="flex flex-wrap gap-2 pt-2">
            <select className={`${inputCls} max-w-[10rem]`} value={lead.status} onChange={(e) => crm.updateLead(lead.id, { status: e.target.value as LeadStatus })}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {lead.status !== 'Converted' ? (
              <Button onClick={() => { crm.convertLead(lead.id); onClose() }}>Convert to Contact →</Button>
            ) : (
              <Badge>Converted</Badge>
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Activity & Communication</h4>
          <div className="mb-3 flex gap-2">
            <select className={`${inputCls} max-w-[7rem]`} value={noteType} onChange={(e) => setNoteType(e.target.value as any)}>
              {['Note', 'Call', 'Email', 'Meeting'].map((t) => <option key={t}>{t}</option>)}
            </select>
            <input className={inputCls} placeholder="Log an interaction…" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} />
            <Button size="sm" onClick={addNote}>Log</Button>
          </div>
          <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {lead.activities.map((a) => (
              <li key={a.id} className="border-l-2 border-slate-200 pl-3">
                <div className="flex items-center gap-2">
                  <Badge tone="indigo">{a.type}</Badge>
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
