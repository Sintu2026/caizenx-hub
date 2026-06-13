import type { Metadata } from 'next'
import './globals.css'
import { CRMProvider } from '@/lib/crm/store'

export const metadata: Metadata = {
  title: 'Caizenx Hub - Real Estate CRM',
  description: 'CRM for real estate project marketing: leads, contracts, inventory, sales & buyer portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <CRMProvider>{children}</CRMProvider>
      </body>
    </html>
  )
}
