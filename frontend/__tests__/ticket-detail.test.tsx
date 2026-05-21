import { render, screen, waitFor } from '@testing-library/react'
import TicketDetail from '@/app/tickets/[id]/page'
import * as api from '@/lib/api'
import * as AuthContext from '@/context/AuthContext'
import { useRouter, useParams } from 'next/navigation'

jest.mock('@/lib/api', () => ({ getTicketById: jest.fn(), getMessages: jest.fn() }))
jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('next/navigation', () => ({ useRouter: jest.fn(), useParams: jest.fn() }))

const mockTicket: api.Ticket = {
  id: '42',
  title: 'Bug critique',
  description: 'Le bouton ne fonctionne pas.',
  priority: 'urgent',
  status: 'open',
  created_by: 'u1',
  assigned_to: 'u2',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-16T12:00:00Z',
  closed_at: null,
  creator_name: 'Alice',
  creator_email: 'alice@test.com',
  assignee_name: 'Bob',
  category_name: 'Frontend',
}

describe('TicketDetail page', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useParams as jest.Mock).mockReturnValue({ id: '42' })
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({ token: 'tok', user: null })
    ;(api.getMessages as jest.Mock).mockResolvedValue([])
  })

  it('affiche le titre et les badges du ticket', async () => {
    ;(api.getTicketById as jest.Mock).mockResolvedValue(mockTicket)
    render(<TicketDetail />)

    expect(await screen.findByText('Bug critique')).toBeInTheDocument()
    expect(screen.getByText('Ouvert')).toBeInTheDocument()
    expect(screen.getByText('Urgente')).toBeInTheDocument()
  })

  it('affiche la description du ticket', async () => {
    ;(api.getTicketById as jest.Mock).mockResolvedValue(mockTicket)
    render(<TicketDetail />)

    expect(await screen.findByText('Le bouton ne fonctionne pas.')).toBeInTheDocument()
  })

  it('affiche les informations du créateur', async () => {
    ;(api.getTicketById as jest.Mock).mockResolvedValue(mockTicket)
    render(<TicketDetail />)

    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
  })

  it("affiche le nom de l'assigné", async () => {
    ;(api.getTicketById as jest.Mock).mockResolvedValue(mockTicket)
    render(<TicketDetail />)

    expect(await screen.findByText('Bob')).toBeInTheDocument()
  })

  it("affiche 'Non assigné' si aucun assigné", async () => {
    ;(api.getTicketById as jest.Mock).mockResolvedValue({ ...mockTicket, assignee_name: null })
    render(<TicketDetail />)

    expect(await screen.findByText('Non assigné')).toBeInTheDocument()
  })

  it('affiche la catégorie si présente', async () => {
    ;(api.getTicketById as jest.Mock).mockResolvedValue(mockTicket)
    render(<TicketDetail />)

    expect(await screen.findByText('Frontend')).toBeInTheDocument()
  })

  it("redirige vers /login si pas de token", async () => {
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({ token: null, user: null })
    render(<TicketDetail />)

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'))
  })

  it("affiche un message d'erreur si l'API échoue", async () => {
    ;(api.getTicketById as jest.Mock).mockRejectedValue(new Error('Ticket introuvable'))
    render(<TicketDetail />)

    expect(await screen.findByText('Ticket introuvable')).toBeInTheDocument()
  })

  it('appelle getTicketById avec le bon id', async () => {
    ;(api.getTicketById as jest.Mock).mockResolvedValue(mockTicket)
    render(<TicketDetail />)

    await waitFor(() =>
      expect(api.getTicketById).toHaveBeenCalledWith('tok', '42')
    )
  })
})
