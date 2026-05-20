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
  payload: { title: string; description: string; priority: string }
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

export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Session expirée')
  return data
}
