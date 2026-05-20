'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getTicketById, type Ticket } from '@/lib/api'

const PRIORITY_LABELS: Record<Ticket['priority'], string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
}

const PRIORITY_STYLES: Record<Ticket['priority'], string> = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_LABELS: Record<Ticket['status'], string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
}

const STATUS_STYLES: Record<Ticket['status'], string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function TicketDetail() {
  const { token } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token === null) { router.push('/login'); return }
    async function fetchTicket() {
      try {
        const data = await getTicketById(token!, id)
        setTicket(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchTicket()
  }, [token, id, router])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-400">Chargement…</p>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <Link href="/tickets" className="mb-6 flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Retour aux tickets
        </Link>
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error ?? 'Ticket introuvable'}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href="/tickets"
        className="mb-6 flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Retour aux tickets
      </Link>

      <div className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[ticket.status]}`}>
              {STATUS_LABELS[ticket.status]}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[ticket.priority]}`}>
              {PRIORITY_LABELS[ticket.priority]}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {ticket.title}
          </h1>
        </div>

        <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap dark:bg-zinc-800 dark:text-zinc-300">
          {ticket.description}
        </div>

        <div className="grid gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Créé par</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{ticket.creator_name}</span>
            <span className="text-xs text-zinc-400">{ticket.creator_email}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Assigné à</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {ticket.assignee_name ?? 'Non assigné'}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Créé le</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-300">{formatDate(ticket.created_at)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Dernière mise à jour</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-300">{formatDate(ticket.updated_at)}</span>
          </div>

          {ticket.category_name && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Catégorie</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">{ticket.category_name}</span>
            </div>
          )}

          {ticket.closed_at && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Fermé le</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">{formatDate(ticket.closed_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
