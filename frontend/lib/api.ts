const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api'

export type User = {
  id: string
  email: string
  name: string
  role: string
  created_at: string
}

export type AuthResponse = {
  token: string
  user: User
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Identifiants invalides')
  return data
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Erreur lors de la création du compte')
  return data
}

export type Ticket = {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_by: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
  creator_name: string
  creator_email: string
  assignee_name: string | null
  category_name: string | null
}

export async function getTickets(token: string): Promise<Ticket[]> {
  const res = await fetch(`${API_URL}/tickets`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Erreur lors du chargement des tickets')
  return data
}

export async function createTicket(
  token: string,
  payload: { title: string; description: string; priority: string; categoryId?: number }
): Promise<Ticket> {
  const res = await fetch(`${API_URL}/tickets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Erreur lors de la création du ticket')
  return data
}

export async function getTicketById(token: string, id: string): Promise<Ticket> {
  const res = await fetch(`${API_URL}/tickets/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Ticket introuvable')
  return data
}

export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Session expirée')
  return data
}

export type Message = {
  id: string
  ticket_id: string
  user_id: string
  content: string
  is_internal: boolean
  created_at: string
  user_name: string
  user_role: string
}

export async function getMessages(token: string, ticketId: string): Promise<Message[]> {
  const res = await fetch(`${API_URL}/tickets/${ticketId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Erreur lors du chargement des messages')
  return json
}

export async function createMessage(
  token: string,
  ticketId: string,
  payload: { content: string; isInternal?: boolean }
): Promise<Message> {
  const res = await fetch(`${API_URL}/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Erreur lors de l\'envoi du message')
  return json
}

export type TicketUpdate = {
  title?: string
  description?: string
  status?: Ticket['status']
  priority?: Ticket['priority']
  assignedTo?: string | null
  categoryId?: number | null
}

export async function updateTicket(token: string, id: string, payload: TicketUpdate): Promise<Ticket> {
  const res = await fetch(`${API_URL}/tickets/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Erreur lors de la mise à jour')
  return json
}

export async function claimTicket(token: string, id: string): Promise<Ticket> {
  const res = await fetch(`${API_URL}/tickets/${id}/claim`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Erreur lors de la prise en charge')
  return json
}

export async function getUsers(token: string): Promise<User[]> {
  const res = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Erreur lors du chargement des utilisateurs')
  return data
}

export async function updateUser(
  token: string,
  id: string,
  payload: { name?: string; role?: string }
): Promise<User> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Erreur lors de la mise à jour')
  return data
}

export async function deleteUser(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.message ?? 'Erreur lors de la suppression')
  }
}

export type Category = {
  id: number
  name: string
  description: string | null
}

export async function getCategories(token: string): Promise<Category[]> {
  const res = await fetch(`${API_URL}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Erreur lors du chargement des catégories')
  return data
}

export async function createCategory(
  token: string,
  payload: { name: string; description?: string }
): Promise<Category> {
  const res = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Erreur lors de la création')
  return data
}

export async function updateCategory(
  token: string,
  id: number,
  payload: { name?: string; description?: string }
): Promise<Category> {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Erreur lors de la mise à jour')
  return data
}

export async function deleteCategory(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.message ?? 'Erreur lors de la suppression')
  }
}
