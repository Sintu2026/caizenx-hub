'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Investment Model' },
    { href: '/chats', label: 'Chats' },
  ]

  return (
    <nav className="bg-gray-950 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 flex items-center h-12 gap-6">
        <span className="text-sm font-bold text-blue-400 mr-2">Caizenx Hub</span>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium transition ${
              pathname === link.href
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
