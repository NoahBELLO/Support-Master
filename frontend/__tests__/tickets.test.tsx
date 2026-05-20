import { render, screen, waitFor } from '@testing-library/react'
import Tickets from '@/app/tickets/page'
import * as api from '@/lib/api'
import * as AuthContext from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

jest.mock('@/lib/api', () => ({ getTickets: jest.fn() }))
jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

const mockTickets: api.Ticket[] = [
  {
    id: '1',
    title: 'Bug sur le dashboard',
    description: 'Le dashboard ne charge pas',
    priority: 'high',
    status: 'open',
    created_by: 'u1',
    assigned_to: null,
    created_at: '2026-05-20T10:00:00Z',
    updated_at: '2026-05-20T10:00:00Z',
    closed_at: null,
    creator_name: 'Alice Dupont',
    creator_email: 'alice@test.com',
    assignee_name: null,
    category_name: null,
  },
  {
    id: '2',
    title: 'Erreur 500 sur l\'API',
    description: 'L\'API retourne une erreur 500',
    priority: 'urgent',
    status: 'in_progress',
    created_by: 'u2',
    assigned_to: null,
    created_at: '2026-05-19T08:00:00Z',
    updated_at: '2026-05-19T08:00:00Z',
    closed_at: null,
    creator_name: 'Bob Martin',
    creator_email: 'bob@test.com',
    assignee_name: null,
    category_name: null,
  },
]

describe('Tickets page', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  it('redirige vers /login si non authentifié', async () => {
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({ token: null, user: null })
    render(<Tickets />)
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'))
  })

  it('affiche le chargement puis la liste des tickets', async () => {
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({ token: 'tok', user: null })
    ;(api.getTickets as jest.Mock).mockResolvedValue(mockTickets)
    render(<Tickets />)

    expect(screen.getByText('Chargement…')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Bug sur le dashboard')).toBeInTheDocument())
  })

  it('affiche le titre, le créateur et les badges de chaque ticket', async () => {
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({ token: 'tok', user: null })
    ;(api.getTickets as jest.Mock).mockResolvedValue(mockTickets)
    render(<Tickets />)

    await waitFor(() => {
      expect(screen.getByText('Bug sur le dashboard')).toBeInTheDocument()
      expect(screen.getByText('Alice Dupont')).toBeInTheDocument()
      expect(screen.getByText('Ouvert')).toBeInTheDocument()
      expect(screen.getByText('Haute')).toBeInTheDocument()

      expect(screen.getByText('Erreur 500 sur l\'API')).toBeInTheDocument()
      expect(screen.getByText('Bob Martin')).toBeInTheDocument()
      expect(screen.getByText('En cours')).toBeInTheDocument()
      expect(screen.getByText('Urgente')).toBeInTheDocument()

      expect(screen.getAllByText('Non assigné')).toHaveLength(2)
    })
  })

  it('affiche le nombre de tickets', async () => {
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({ token: 'tok', user: null })
    ;(api.getTickets as jest.Mock).mockResolvedValue(mockTickets)
    render(<Tickets />)

    await waitFor(() => expect(screen.getByText('2 tickets')).toBeInTheDocument())
  })

  it('affiche l\'état vide si aucun ticket', async () => {
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({ token: 'tok', user: null })
    ;(api.getTickets as jest.Mock).mockResolvedValue([])
    render(<Tickets />)

    await waitFor(() =>
      expect(screen.getByText('Aucun ticket pour le moment')).toBeInTheDocument()
    )
  })

  it("affiche l'assigné quand il existe", async () => {
    const withAssignee = [{ ...mockTickets[0], assignee_name: 'Charlie Agent' }]
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({ token: 'tok', user: null })
    ;(api.getTickets as jest.Mock).mockResolvedValue(withAssignee)
    render(<Tickets />)

    await waitFor(() => expect(screen.getByText('Charlie Agent')).toBeInTheDocument())
  })

  it("affiche un message d'erreur si l'API échoue", async () => {
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({ token: 'tok', user: null })
    ;(api.getTickets as jest.Mock).mockRejectedValue(new Error('Erreur serveur'))
    render(<Tickets />)

    expect(await screen.findByText('Erreur serveur')).toBeInTheDocument()
  })
})
