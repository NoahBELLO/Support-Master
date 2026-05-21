'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getUsers, updateUser, deleteUser, type User } from '@/lib/api'

const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  agent: 'Agent',
  admin: 'Administrateur',
}

const ROLE_STYLES: Record<string, string> = {
  client: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  agent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export default function AdminUsersPage() {
  const { token, user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    getUsers(token)
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  async function handleRoleChange(userId: string, newRole: string) {
    if (!token) return
    setSaving(userId)
    try {
      const updated = await updateUser(token, userId, { role: newRole })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)))
      setEditingRole(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la mise à jour')
    } finally {
      setSaving(null)
    }
  }

  async function handleDelete(userId: string) {
    if (!token || !confirm('Supprimer cet utilisateur définitivement ?')) return
    setDeleting(userId)
    try {
      await deleteUser(token, userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-zinc-400">
            <Link href="/admin/categories" className="hover:text-zinc-600 dark:hover:text-zinc-200">
              Catégories
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Utilisateurs
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {users.length} compte{users.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Chargement…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Nom
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Rôle
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Inscrit le
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id
                const isEditing = editingRole === u.id
                return (
                  <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {u.name}
                      {isSelf && (
                        <span className="ml-2 text-xs text-zinc-400">(vous)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{u.email}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={u.role}
                            disabled={saving === u.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          >
                            <option value="client">Client</option>
                            <option value="agent">Agent</option>
                            <option value="admin">Administrateur</option>
                          </select>
                          <button
                            onClick={() => setEditingRole(null)}
                            className="text-xs text-zinc-400 hover:text-zinc-600"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => !isSelf && setEditingRole(u.id)}
                          disabled={isSelf}
                          title={isSelf ? 'Vous ne pouvez pas modifier votre propre rôle' : 'Modifier le rôle'}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity ${ROLE_STYLES[u.role]} ${!isSelf ? 'cursor-pointer hover:opacity-70' : 'cursor-default'}`}
                        >
                          {ROLE_LABELS[u.role] ?? u.role}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isSelf && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deleting === u.id}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-950/40"
                        >
                          {deleting === u.id ? 'Suppression…' : 'Supprimer'}
                        </button>
                      )}
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
