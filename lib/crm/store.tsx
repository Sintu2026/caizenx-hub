'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { seedState } from './seed'
import {
  CRMState, Lead, Contact, Contract, Unit, ChangeOrder, Commission,
  Campaign, SalesRep, Activity, PortalMessage, ContractStatus,
} from './types'

const STORAGE_KEY = 'caizenx-crm-v1'

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`
const nowISO = () => new Date().toISOString()

interface CRMContextValue extends CRMState {
  ready: boolean
  // generic
  reset: () => void
  // leads
  addLead: (lead: Partial<Lead>) => void
  updateLead: (id: string, patch: Partial<Lead>) => void
  logActivity: (entity: 'lead' | 'contact', id: string, activity: Partial<Activity>) => void
  convertLead: (leadId: string) => string | null
  // contacts
  updateContact: (id: string, patch: Partial<Contact>) => void
  // units
  updateUnit: (id: string, patch: Partial<Unit>) => void
  // contracts
  addContract: (k: Partial<Contract>) => string
  updateContractStatus: (id: string, status: ContractStatus, signature?: string) => void
  // change orders
  addChangeOrder: (co: Partial<ChangeOrder>) => void
  updateChangeOrder: (id: string, patch: Partial<ChangeOrder>) => void
  // commissions
  updateCommission: (id: string, patch: Partial<Commission>) => void
  // campaigns
  addCampaign: (c: Partial<Campaign>) => void
  updateCampaign: (id: string, patch: Partial<Campaign>) => void
  // reps
  addRep: (r: Partial<SalesRep>) => void
  // portal
  addMessage: (m: Partial<PortalMessage>) => void
}

const CRMContext = createContext<CRMContextValue | null>(null)

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CRMState>(seedState)
  const [ready, setReady] = useState(false)

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setState(JSON.parse(raw))
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

  // persist
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state, ready])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState(seedState)
  }, [])

  const addLead = useCallback((lead: Partial<Lead>) => {
    const id = uid('l')
    const newLead: Lead = {
      id, name: lead.name || 'Unnamed', email: lead.email || '', phone: lead.phone || '',
      source: lead.source || 'Website', status: lead.status || 'New', score: lead.score ?? 50,
      projectId: lead.projectId ?? null, budget: lead.budget ?? 0, assignedTo: lead.assignedTo ?? null,
      notes: lead.notes || '', createdAt: nowISO(), lastActivity: nowISO(),
      activities: [{ id: uid('act'), type: 'System', body: 'Lead created.', by: 'You', at: nowISO() }],
    }
    setState((s) => ({ ...s, leads: [newLead, ...s.leads] }))
  }, [])

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch, lastActivity: nowISO() } : l)),
    }))
  }, [])

  const logActivity = useCallback((entity: 'lead' | 'contact', id: string, a: Partial<Activity>) => {
    const activity: Activity = {
      id: uid('act'), type: a.type || 'Note', body: a.body || '', by: a.by || 'You', at: nowISO(),
    }
    setState((s) => {
      if (entity === 'lead') {
        return {
          ...s,
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, activities: [activity, ...l.activities], lastActivity: nowISO() } : l),
        }
      }
      return {
        ...s,
        contacts: s.contacts.map((c) =>
          c.id === id ? { ...c, activities: [activity, ...c.activities] } : c),
      }
    })
  }, [])

  const convertLead = useCallback((leadId: string): string | null => {
    let newId: string | null = null
    setState((s) => {
      const lead = s.leads.find((l) => l.id === leadId)
      if (!lead) return s
      newId = uid('c')
      const contact: Contact = {
        id: newId, leadId: lead.id, name: lead.name, email: lead.email, phone: lead.phone,
        address: '', stage: 'Prospect', assignedTo: lead.assignedTo, projectId: lead.projectId,
        createdAt: nowISO(),
        activities: [
          { id: uid('act'), type: 'System', body: 'Converted from lead.', by: 'You', at: nowISO() },
          ...lead.activities,
        ],
        documents: [],
      }
      return {
        ...s,
        contacts: [contact, ...s.contacts],
        leads: s.leads.map((l) => (l.id === leadId ? { ...l, status: 'Converted', lastActivity: nowISO() } : l)),
      }
    })
    return newId
  }, [])

  const updateContact = useCallback((id: string, patch: Partial<Contact>) => {
    setState((s) => ({ ...s, contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  }, [])

  const updateUnit = useCallback((id: string, patch: Partial<Unit>) => {
    setState((s) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, ...patch } : u)) }))
  }, [])

  const addContract = useCallback((k: Partial<Contract>): string => {
    const id = uid('k')
    const contract: Contract = {
      id, contactId: k.contactId!, unitId: k.unitId!, projectId: k.projectId!,
      amount: k.amount ?? 0, deposit: k.deposit ?? Math.round((k.amount ?? 0) * 0.15),
      status: 'Draft', createdAt: nowISO(), sentAt: null, signedAt: null, signature: null,
      salesRepId: k.salesRepId ?? null,
    }
    setState((s) => ({
      ...s,
      contracts: [contract, ...s.contracts],
      units: s.units.map((u) => (u.id === k.unitId ? { ...u, status: 'Held', buyerContactId: k.contactId! } : u)),
    }))
    return id
  }, [])

  const updateContractStatus = useCallback((id: string, status: ContractStatus, signature?: string) => {
    setState((s) => {
      const contract = s.contracts.find((k) => k.id === id)
      if (!contract) return s
      const patch: Partial<Contract> = { status }
      if (status === 'Sent') patch.sentAt = nowISO()
      if (status === 'Signed' || status === 'Executed') {
        patch.signedAt = nowISO()
        if (signature) patch.signature = signature
      }
      let units = s.units
      let commissions = s.commissions
      // when executed, mark unit sold and create commission if missing
      if (status === 'Executed') {
        units = s.units.map((u) => (u.id === contract.unitId ? { ...u, status: 'Sold' } : u))
        const exists = s.commissions.some((cm) => cm.contractId === id)
        if (!exists && contract.salesRepId) {
          const rep = s.reps.find((r) => r.id === contract.salesRepId)
          const rate = rep?.commissionRate ?? 2
          commissions = [
            {
              id: uid('cm'), salesRepId: contract.salesRepId, contractId: id,
              saleAmount: contract.amount, rate, amount: Math.round(contract.amount * (rate / 100)),
              status: 'Pending', createdAt: nowISO(),
            },
            ...s.commissions,
          ]
        }
      }
      if (status === 'Signed') {
        units = s.units.map((u) => (u.id === contract.unitId ? { ...u, status: 'Reserved' } : u))
      }
      return {
        ...s,
        contracts: s.contracts.map((k) => (k.id === id ? { ...k, ...patch } : k)),
        units,
        commissions,
      }
    })
  }, [])

  const addChangeOrder = useCallback((co: Partial<ChangeOrder>) => {
    const order: ChangeOrder = {
      id: uid('co'), unitId: co.unitId!, contractId: co.contractId ?? null, contactId: co.contactId!,
      title: co.title || 'Change request', description: co.description || '', amount: co.amount ?? 0,
      status: 'Requested', createdAt: nowISO(), requestedBy: co.requestedBy || 'Buyer',
    }
    setState((s) => ({ ...s, changeOrders: [order, ...s.changeOrders] }))
  }, [])

  const updateChangeOrder = useCallback((id: string, patch: Partial<ChangeOrder>) => {
    setState((s) => ({ ...s, changeOrders: s.changeOrders.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  }, [])

  const updateCommission = useCallback((id: string, patch: Partial<Commission>) => {
    setState((s) => ({ ...s, commissions: s.commissions.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  }, [])

  const addCampaign = useCallback((c: Partial<Campaign>) => {
    const campaign: Campaign = {
      id: uid('cp'), name: c.name || 'New Campaign', channel: c.channel || 'Facebook',
      projectId: c.projectId ?? null, budget: c.budget ?? 0, spent: 0, leadsGenerated: 0,
      status: 'Planned', startDate: nowISO(), endDate: c.endDate || nowISO(),
    }
    setState((s) => ({ ...s, campaigns: [campaign, ...s.campaigns] }))
  }, [])

  const updateCampaign = useCallback((id: string, patch: Partial<Campaign>) => {
    setState((s) => ({ ...s, campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  }, [])

  const addRep = useCallback((r: Partial<SalesRep>) => {
    const name = r.name || 'New Rep'
    const rep: SalesRep = {
      id: uid('rep'), name, email: r.email || '', phone: r.phone || '', title: r.title || 'Sales Advisor',
      commissionRate: r.commissionRate ?? 2, target: r.target ?? 8000000,
      initials: name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(),
      color: ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500'][Math.floor(Math.random() * 5)],
    }
    setState((s) => ({ ...s, reps: [...s.reps, rep] }))
  }, [])

  const addMessage = useCallback((m: Partial<PortalMessage>) => {
    const msg: PortalMessage = {
      id: uid('m'), contactId: m.contactId!, from: m.from || 'Buyer', body: m.body || '', at: nowISO(),
    }
    setState((s) => ({ ...s, messages: [...s.messages, msg] }))
  }, [])

  const value: CRMContextValue = {
    ...state, ready, reset,
    addLead, updateLead, logActivity, convertLead,
    updateContact, updateUnit,
    addContract, updateContractStatus,
    addChangeOrder, updateChangeOrder,
    updateCommission, addCampaign, updateCampaign, addRep, addMessage,
  }

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>
}

export function useCRM() {
  const ctx = useContext(CRMContext)
  if (!ctx) throw new Error('useCRM must be used within CRMProvider')
  return ctx
}
