'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getTicketById, updateTicket, getMessages, createMessage, getCategories, type Ticket, type Message, type Category } from '@/lib/api'

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
  const { token, user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [categoryUpdating, setCategoryUpdating] = useState(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [msgContent, setMsgContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [msgError, setMsgError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const canEditStatus = user?.role === 'agent' || user?.role === 'admin'
  const canPostInternal = user?.role === 'agent' || user?.role === 'admin'

  async function handleStatusChange(status: Ticket['status']) {
    if (!ticket || !token) return
    setStatusUpdating(true)
    try {
      const updated = await updateTicket(token, id, { status })
      setTicket(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    } finally {
      setStatusUpdating(false)
    }
  }

  async function handleCategoryChange(categoryId: number | null) {
    if (!ticket || !token) return
    setCategoryUpdating(true)
    try {
      const updated = await updateTicket(token, id, { categoryId })
      setTicket(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    } finally {
      setCategoryUpdating(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !msgContent.trim()) return
    setSending(true)
    setMsgError(null)
    try {
      const msg = await createMessage(token, id, { content: msgContent.trim(), isInternal })
      setMessages(prev => [...prev, msg])
      setMsgContent('')
      setIsInternal(false)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (err) {
      setMsgError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (token === null) { router.push('/login'); return }
    async function fetchAll() {
      try {
        const [ticketData, msgData, catData] = await Promise.all([
          getTicketById(token!, id),
          getMessages(token!, id),
          getCategories(token!),
        ])
        setTicket(ticketData)
        setMessages(msgData)
        setCategories(catData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
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
            {canEditStatus ? (
              <select
                value={ticket.status}
                disabled={statusUpdating}
                onChange={e => handleStatusChange(e.target.value as Ticket['status'])}
                aria-label="Modifier le statut"
                className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-700 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {(Object.entries(STATUS_LABELS) as [Ticket['status'], string][]).map(([s, label]) => (
                  <option key={s} value={s}>{label}</option>
                ))}
              </select>
            ) : (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[ticket.status]}`}>
                {STATUS_LABELS[ticket.status]}
              </span>
            )}
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

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Catégorie</span>
            {canEditStatus && categories.length > 0 ? (
              <select
                value={ticket.category_name
                  ? (categories.find(c => c.name === ticket.category_name)?.id ?? '')
                  : ''}
                disabled={categoryUpdating}
                onChange={e => handleCategoryChange(e.target.value ? Number(e.target.value) : null)}
                aria-label="Modifier la catégorie"
                className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-700 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <option value="">Sans catégorie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                {ticket.category_name ?? '—'}
              </span>
            )}
          </div>

          {ticket.closed_at && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Fermé le</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">{formatDate(ticket.closed_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="mt-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Messages
          {messages.length > 0 && (
            <span className="ml-2 text-sm font-normal text-zinc-400">({messages.length})</span>
          )}
        </h2>

        {messages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
            Aucun message pour le moment
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl border p-4 ${
                  msg.is_internal
                    ? 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20'
                    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {msg.user_name}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {msg.user_role}
                  </span>
                  {msg.is_internal && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Note interne
                    </span>
                  )}
                  <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">
                    {new Intl.DateTimeFormat('fr-FR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    }).format(new Date(msg.created_at))}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {msg.content}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Reply form */}
        {ticket.status !== 'closed' && (
          <form onSubmit={handleSendMessage} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <textarea
              value={msgContent}
              onChange={e => setMsgContent(e.target.value)}
              rows={3}
              placeholder="Écrire un message…"
              required
              className="resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
            />
            {msgError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                {msgError}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              {canPostInternal ? (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={e => setIsInternal(e.target.checked)}
                    className="rounded border-zinc-300 accent-amber-500 dark:border-zinc-600"
                  />
                  Note interne
                </label>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={sending || !msgContent.trim()}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {sending ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          </form>
        )}

        {ticket.status === 'closed' && (
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            Ce ticket est fermé — aucun nouveau message ne peut être ajouté.
          </p>
        )}
      </div>
    </div>
  )
}
