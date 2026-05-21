'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from '@/lib/api'

export default function AdminCategoriesPage() {
  const { token } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<Category | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    getCategories(token)
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  function startEdit(cat: Category) {
    setEditing(cat)
    setEditName(cat.name)
    setEditDesc(cat.description ?? '')
  }

  async function handleUpdate() {
    if (!token || !editing) return
    setSaving(true)
    try {
      const updated = await updateCategory(token, editing.id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      })
      setCategories((prev) => prev.map((c) => (c.id === editing.id ? updated : c)))
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !newName.trim()) return
    setCreating(true)
    try {
      const created = await createCategory(token, {
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      })
      setCategories((prev) => [...prev, created])
      setNewName('')
      setNewDesc('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: number) {
    if (!token || !confirm('Supprimer cette catégorie définitivement ?')) return
    setDeleting(id)
    try {
      await deleteCategory(token, id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2 text-xs text-zinc-400">
          <Link href="/admin/users" className="hover:text-zinc-600 dark:hover:text-zinc-200">
            Utilisateurs
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Catégories
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          {categories.length} catégorie{categories.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      <form
        onSubmit={handleCreate}
        className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Nouvelle catégorie
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Nom *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <input
            type="text"
            placeholder="Description (optionnelle)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {creating ? 'Création…' : 'Créer'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-zinc-400">Chargement…</p>
      ) : (
        <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {categories.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-zinc-400">
              Aucune catégorie pour le moment
            </p>
          ) : (
            categories.map((cat) => {
              const isEditing = editing?.id === cat.id
              return (
                <div key={cat.id} className="px-5 py-4">
                  {isEditing ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Description"
                          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdate}
                          disabled={saving || !editName.trim()}
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
                        >
                          {saving ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">{cat.name}</p>
                        {cat.description && (
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {cat.description}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => startEdit(cat)}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={deleting === cat.id}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-950/40"
                        >
                          {deleting === cat.id ? 'Suppression…' : 'Supprimer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
