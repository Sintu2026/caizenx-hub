'use client'

import React, { useState } from 'react'
import { useCRM } from '@/lib/crm/store'
import { currency, dateShort } from '@/lib/crm/format'
import { Contract, ContractStatus } from '@/lib/crm/types'
import {
  Card, PageHeader, StatusBadge, Button, Modal, Field, inputCls, EmptyState, Badge,
} from '@/components/ui'

export default function ContractsPage() {
  const crm = useCRM()
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const current = crm.contracts.find((k) => k.id === selected) || null

  const lookup = (k: Contract) => ({
    contact: crm.contacts.find((c) => c.id === k.contactId),
    unit: crm.units.find((u) => u.id === k.unitId),
    project: crm.projects.find((p) => p.id === k.projectId),
    rep: crm.reps.find((r) => r.id === k.salesRepId),
  })

  return (
    <>
      <PageHeader
        title="Contracts & e-Sign"
        subtitle="Draft, send, sign and execute purchase agreements"
        actions={<Button onClick={() => setShowNew(true)}>+ New Contract</Button>}
      />

      {crm.contracts.length === 0 ? (
        <EmptyState title="No contracts yet" hint="Create a contract for a buyer and a unit." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Deposit</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {crm.contracts.map((k) => {
                  const { contact, unit, project } = lookup(k)
                  return (
                    <tr key={k.id} onClick={() => setSelected(k.id)} className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{contact?.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{unit?.unitNumber} · {project?.name}</td>
                      <td className="px-4 py-3 text-slate-600">{currency(k.amount)}</td>
                      <td className="px-4 py-3 text-slate-600">{currency(k.deposit)}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{dateShort(k.createdAt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showNew && <NewContractModal onClose={() => setShowNew(false)} onCreated={(id) => { setShowNew(false); setSelected(id) }} />}
      {current && <ContractDetail contract={current} onClose={() => setSelected(null)} />}
    </>
  )
}

function NewContractModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const crm = useCRM()
  const [contactId, setContactId] = useState('')
  const [unitId, setUnitId] = useState('')
  const availableUnits = crm.units.filter((u) => u.status === 'Available' || u.buyerContactId === contactId)
  const unit = crm.units.find((u) => u.id === unitId)
  const contact = crm.contacts.find((c) => c.id === contactId)

  const create = () => {
    if (!unit || !contact) return
    const id = crm.addContract({
      contactId, unitId, projectId: unit.projectId, amount: unit.price,
      salesRepId: contact.assignedTo,
    })
    onCreated(id)
  }

  return (
    <Modal open onClose={onClose} title="New Purchase Contract"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={create} disabled={!contactId || !unitId}>Create Draft</Button></>}>
      <div className="space-y-4">
        <Field label="Buyer (contact)">
          <select className={inputCls} value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">— Select contact —</option>
            {crm.contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Unit">
          <select className={inputCls} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            <option value="">— Select unit —</option>
            {availableUnits.map((u) => {
              const p = crm.projects.find((x) => x.id === u.projectId)
              return <option key={u.id} value={u.id}>{p?.name} · {u.unitNumber} · {currency(u.price)}</option>
            })}
          </select>
        </Field>
        {unit && (
          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Purchase price</span><span className="font-semibold">{currency(unit.price)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Deposit (15%)</span><span className="font-semibold">{currency(Math.round(unit.price * 0.15))}</span></div>
          </div>
        )}
      </div>
    </Modal>
  )
}

const FLOW: ContractStatus[] = ['Draft', 'Sent', 'Viewed', 'Signed', 'Countersigned', 'Executed']

function ContractDetail({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const crm = useCRM()
  const [signature, setSignature] = useState('')
  const contact = crm.contacts.find((c) => c.id === contract.contactId)
  const unit = crm.units.find((u) => u.id === contract.unitId)
  const project = crm.projects.find((p) => p.id === contract.projectId)
  const rep = crm.reps.find((r) => r.id === contract.salesRepId)

  const stepIndex = FLOW.indexOf(contract.status)

  const advance = (status: ContractStatus, sig?: string) => crm.updateContractStatus(contract.id, status, sig)

  return (
    <Modal open onClose={onClose} wide title="Purchase Agreement">
      {/* Document preview */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-lg font-bold text-slate-900">Caizenx Homes Ltd.</p>
            <p className="text-sm text-slate-500">Agreement of Purchase and Sale</p>
          </div>
          <StatusBadge status={contract.status} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-slate-400">Purchaser</p><p className="font-medium text-slate-800">{contact?.name}</p></div>
          <div><p className="text-slate-400">Property</p><p className="font-medium text-slate-800">{project?.name} · Unit {unit?.unitNumber}</p></div>
          <div><p className="text-slate-400">Purchase price</p><p className="font-medium text-slate-800">{currency(contract.amount)}</p></div>
          <div><p className="text-slate-400">Deposit</p><p className="font-medium text-slate-800">{currency(contract.deposit)}</p></div>
          <div><p className="text-slate-400">Sales advisor</p><p className="font-medium text-slate-800">{rep?.name || '—'}</p></div>
          <div><p className="text-slate-400">Created</p><p className="font-medium text-slate-800">{dateShort(contract.createdAt)}</p></div>
        </div>

        {/* signature block */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-slate-400">Purchaser signature</p>
            {contract.signature ? (
              <p className="mt-1 font-[cursive] text-xl text-indigo-700">{contract.signature}</p>
            ) : (
              <p className="mt-1 text-sm italic text-slate-300">Awaiting signature</p>
            )}
            {contract.signedAt && <p className="text-xs text-slate-400">Signed {dateShort(contract.signedAt)}</p>}
          </div>
          <div>
            <p className="text-xs text-slate-400">Vendor (Caizenx Homes)</p>
            {['Countersigned', 'Executed'].includes(contract.status)
              ? <p className="mt-1 font-[cursive] text-xl text-slate-700">Caizenx Homes Ltd.</p>
              : <p className="mt-1 text-sm italic text-slate-300">Pending</p>}
          </div>
        </div>
      </div>

      {/* progress tracker */}
      <div className="mt-5 flex items-center justify-between">
        {FLOW.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col items-center">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${i <= stepIndex ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{i + 1}</div>
            <span className={`mt-1 text-[10px] ${i <= stepIndex ? 'text-slate-700' : 'text-slate-400'}`}>{s}</span>
          </div>
        ))}
      </div>

      {/* actions */}
      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        {contract.status === 'Draft' && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Send this agreement to {contact?.name} for e-signature.</p>
            <Button onClick={() => advance('Sent')}>📧 Send for Signing</Button>
          </div>
        )}
        {contract.status === 'Sent' && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Sent to buyer. Mark as viewed when they open it.</p>
            <Button variant="secondary" onClick={() => advance('Viewed')}>Mark Viewed</Button>
          </div>
        )}
        {(contract.status === 'Sent' || contract.status === 'Viewed') && (
          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="mb-2 text-sm font-medium text-slate-700">Buyer e-signature</p>
            <div className="flex gap-2">
              <input className={inputCls} placeholder="Type full legal name to sign" value={signature} onChange={(e) => setSignature(e.target.value)} />
              <Button onClick={() => signature.trim() && advance('Signed', signature.trim())} disabled={!signature.trim()}>✍️ Sign</Button>
            </div>
          </div>
        )}
        {contract.status === 'Signed' && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Buyer signed. Countersign on behalf of Caizenx Homes.</p>
            <Button onClick={() => advance('Countersigned')}>Countersign</Button>
          </div>
        )}
        {contract.status === 'Countersigned' && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Fully signed. Execute to record the sale & generate commission.</p>
            <Button onClick={() => advance('Executed')}>✅ Execute & Record Sale</Button>
          </div>
        )}
        {contract.status === 'Executed' && (
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <Badge tone="green">Executed</Badge> Sale recorded · unit marked sold · commission generated.
          </div>
        )}
      </div>
    </Modal>
  )
}
