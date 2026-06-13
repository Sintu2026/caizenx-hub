'use client'

import React, { useMemo, useState } from 'react'
import { useCRM } from '@/lib/crm/store'
import { currency, dateShort } from '@/lib/crm/format'
import { CommissionStatus } from '@/lib/crm/types'
import {
  Card, PageHeader, StatusBadge, Button, StatCard, Avatar, EmptyState,
} from '@/components/ui'

const NEXT: Record<CommissionStatus, CommissionStatus | null> = {
  Pending: 'Approved', Approved: 'Paid', Paid: null,
}

export default function CommissionsPage() {
  const crm = useCRM()
  const [filter, setFilter] = useState('All')

  const totals = useMemo(() => {
    const sum = (s: CommissionStatus) => crm.commissions.filter((c) => c.status === s).reduce((a, c) => a + c.amount, 0)
    return { pending: sum('Pending'), approved: sum('Approved'), paid: sum('Paid'), total: crm.commissions.reduce((a, c) => a + c.amount, 0) }
  }, [crm.commissions])

  const rows = crm.commissions.filter((c) => filter === 'All' || c.status === filter)

  return (
    <>
      <PageHeader title="Commissions" subtitle="Advisor commissions generated from executed contracts" />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending" value={currency(totals.pending)} accent="text-amber-600" />
        <StatCard label="Approved" value={currency(totals.approved)} accent="text-indigo-600" />
        <StatCard label="Paid" value={currency(totals.paid)} accent="text-emerald-600" />
        <StatCard label="Total earned" value={currency(totals.total)} accent="text-slate-700" />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {['All', 'Pending', 'Approved', 'Paid'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'}`}>
            {s}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No commissions yet" hint="Execute a contract to generate commission." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Advisor</th>
                  <th className="px-4 py-3 font-medium">Sale</th>
                  <th className="px-4 py-3 font-medium">Rate</th>
                  <th className="px-4 py-3 font-medium">Commission</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const rep = crm.reps.find((r) => r.id === c.salesRepId)
                  const contract = crm.contracts.find((k) => k.id === c.contractId)
                  const unit = crm.units.find((u) => u.id === contract?.unitId)
                  const next = NEXT[c.status]
                  return (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar initials={rep?.initials || '?'} color={rep?.color} size="sm" />
                          <span className="font-medium text-slate-700">{rep?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{unit?.unitNumber || '—'} · {currency(c.saleAmount, true)}</td>
                      <td className="px-4 py-3 text-slate-600">{c.rate}%</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{currency(c.amount)}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{dateShort(c.createdAt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-right">
                        {next && (
                          <Button size="sm" variant="secondary" onClick={() => crm.updateCommission(c.id, { status: next })}>
                            Mark {next}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
