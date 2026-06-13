'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem { href: string; label: string; icon: string; group?: string }

const NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: '📊', group: 'Overview' },
  { href: '/analytics', label: 'Analytics', icon: '📈', group: 'Overview' },
  { href: '/leads', label: 'Leads', icon: '🎯', group: 'Sales Pipeline' },
  { href: '/contacts', label: 'Contacts', icon: '👤', group: 'Sales Pipeline' },
  { href: '/contracts', label: 'Contracts & e-Sign', icon: '✍️', group: 'Sales Pipeline' },
  { href: '/inventory', label: 'Inventory', icon: '🏢', group: 'Operations' },
  { href: '/change-orders', label: 'Change Orders', icon: '🔧', group: 'Operations' },
  { href: '/marketing', label: 'Marketing', icon: '📣', group: 'Operations' },
  { href: '/sales-team', label: 'Sales Team', icon: '🤝', group: 'Team' },
  { href: '/commissions', label: 'Commissions', icon: '💰', group: 'Team' },
  { href: '/portal', label: 'Buyer Portal', icon: '🔑', group: 'External' },
  { href: '/investment', label: 'Investment Model', icon: '🧮', group: 'External' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const groups = Array.from(new Set(NAV.map((n) => n.group)))
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">C</div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">Caizenx Hub</p>
          <p className="text-[11px] leading-tight text-slate-400">Real Estate CRM</p>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {groups.map((g) => (
          <div key={g}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{g}</p>
            <div className="space-y-0.5">
              {NAV.filter((n) => n.group === g).map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    isActive(n.href)
                      ? 'bg-indigo-600 font-medium text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-base">{n.icon}</span>
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-800 px-5 py-3 text-[11px] text-slate-500">
        Caizenx Homes Ltd. · Demo data
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-slate-900 lg:block">{SidebarContent}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900">{SidebarContent}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
          <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)}>☰</button>
          <div className="flex-1" />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-700">Manpreet (Admin)</p>
            <p className="text-xs text-slate-400">Caizenx Homes Ltd.</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white">MP</div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
