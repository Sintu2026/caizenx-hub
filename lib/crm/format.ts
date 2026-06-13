export const currency = (n: number, compact = false) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(n || 0)

export const dateShort = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

export const dateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'

export const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const day = 24 * 60 * 60 * 1000
  const days = Math.round(diff / day)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${Math.round(days / 365)}y ago`
}

export const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
