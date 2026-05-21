'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getTickets, claimTicket, updateTicket, type Ticket } from '@/lib/api'

const STATUS_LABELS: Record<Ticket['status'], string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
}

const PRIORITY_LABELS: Record<Ticket['priority'], string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
}

const PRIORITY_BADGE: Record<Ticket['priority'], string> = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

type StatusFilter = 'all' | Ticket['status']

const FILTER_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'open', label: 'Ouverts' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'resolved', label: 'Résolus' },
  { value: 'closed', label: 'Fermés' },
]

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export default function SupportDashboard() {
  const { token, user } = useAuth()
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [updating, setUpdating] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (token === null) { router.push('/login'); return }
    if (user?.role === 'client') { router.push('/'); return }

    async function fetchTickets() {
      try {
        const data = await getTickets(token!)
        setTickets(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchTickets()
  }, [token, user, router])

  function toggleUpdating(id: string, on: boolean) {
    setUpdating(prev => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function handleClaim(id: string) {
    toggleUpdating(id, true)
    try {
      const updated = await claimTicket(token!, id)
      setTickets(prev => prev.map(t => t.id === id ? updated : t))
    } catch {
      // ticket already claimed or closed — refetch to sync state
      const fresh = await getTickets(token!).catch(() => null)
      if (fresh) setTickets(fresh)
    } finally {
      toggleUpdating(id, false)
    }
  }

  async function handleStatusChange(id: string, status: Ticket['status']) {
    toggleUpdating(id, true)
    try {
      const updated = await updateTicket(token!, id, { status })
      setTickets(prev => prev.map(t => t.id === id ? updated : t))
    } catch {
      // revert to server state
      const fresh = await getTickets(token!).catch(() => null)
      if (fresh) setTickets(fresh)
    } finally {
      toggleUpdating(id, false)
    }
  }

  async function handlePriorityChange(id: string, priority: Ticket['priority']) {
    toggleUpdating(id, true)
    try {
      const updated = await updateTicket(token!, id, { priority })
      setTickets(prev => prev.map(t => t.id === id ? updated : t))
    } catch {
      const fresh = await getTickets(token!).catch(() => null)
      if (fresh) setTickets(fresh)
    } finally {
      toggleUpdating(id, false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-400">Chargement…</p>
      </div>
    )
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  const countByStatus = (s: Ticket['status']) => tickets.filter(t => t.status === s).length

  const stats = [
    { label: 'Total', value: tickets.length, color: 'text-zinc-900 dark:text-zinc-50' },
    { label: 'Ouverts', value: countByStatus('open'), color: 'text-blue-600 dark:text-blue-400' },
    { label: 'En cours', value: countByStatus('in_progress'), color: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'Résolus', value: countByStatus('resolved'), color: 'text-green-600 dark:text-green-400' },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Tableau de bord support
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Gérez et traitez les demandes de support
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          </div>
        ))}
      </div>

      {error && (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/50">
        {FILTER_TABS.map(({ value, label }) => {
          const count = value === 'all' ? tickets.length : countByStatus(value as Ticket['status'])
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  filter === value
                    ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                    : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 py-16 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucun ticket dans cette catégorie</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left dark:border-zinc-800 dark:bg-zinc-900/50">
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Ticket</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Assigné à</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Statut</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Priorité</th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Créé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
              {filtered.map((ticket) => {
                const busy = updating.has(ticket.id)
                return (
                  <tr
                    key={ticket.id}
                    className={`transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 ${busy ? 'opacity-50' : ''}`}
                  >
                    {/* Title + creator */}
                    <td className="max-w-xs px-4 py-3">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-zinc-900 hover:underline underline-offset-4 dark:text-zinc-50"
                      >
                        {ticket.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                        par {ticket.creator_name}
                      </p>
                    </td>

                    {/* Assignee */}
                    <td className="px-4 py-3">
                      {ticket.assignee_name ? (
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {ticket.assignee_name}
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">Non assigné</span>
                          {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                            <button
                              onClick={() => handleClaim(ticket.id)}
                              disabled={busy}
                              className="w-fit rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                              Prendre en charge
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <select
                        value={ticket.status}
                        disabled={busy}
                        onChange={e => handleStatusChange(ticket.id, e.target.value as Ticket['status'])}
                        className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:focus:border-zinc-500"
                        aria-label="Modifier le statut"
                      >
                        {(Object.entries(STATUS_LABELS) as [Ticket['status'], string][]).map(([s, label]) => (
                          <option key={s} value={s}>{label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[ticket.priority]}`}>
                          {PRIORITY_LABELS[ticket.priority]}
                        </span>
                        <select
                          value={ticket.priority}
                          disabled={busy}
                          onChange={e => handlePriorityChange(ticket.id, e.target.value as Ticket['priority'])}
                          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:focus:border-zinc-500"
                          aria-label="Modifier la priorité"
                        >
                          {(Object.entries(PRIORITY_LABELS) as [Ticket['priority'], string][]).map(([p, label]) => (
                            <option key={p} value={p}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                      {formatDate(ticket.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
