import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewTicket from '@/app/tickets/new/page'
import * as api from '@/lib/api'
import * as AuthContext from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

jest.mock('@/lib/api', () => ({ createTicket: jest.fn() }))
jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

const mockTicket: api.Ticket = {
  id: '1', title: 'Mon ticket', description: 'Une description suffisante', priority: 'medium',
  status: 'open', created_by: 'u1', assigned_to: null, created_at: '', updated_at: '',
  closed_at: null, creator_name: 'Alice', creator_email: 'alice@test.com',
  assignee_name: null, category_name: null,
}

describe('NewTicket page', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({ token: 'tok', user: null })
  })

  it('affiche le titre et les champs du formulaire', () => {
    render(<NewTicket />)
    expect(screen.getByRole('heading', { name: /nouveau ticket/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/titre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/priorité/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /créer le ticket/i })).toBeInTheDocument()
  })

  it("affiche la note d'assignation non modifiable", () => {
    render(<NewTicket />)
    expect(screen.getByText(/gérée par l.équipe support/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/assigné/i)).not.toBeInTheDocument()
  })

  it('appelle createTicket avec les bons arguments', async () => {
    const user = userEvent.setup()
    ;(api.createTicket as jest.Mock).mockResolvedValue(mockTicket)
    render(<NewTicket />)

    await user.type(screen.getByLabelText(/titre/i), 'Mon ticket test')
    await user.type(screen.getByLabelText(/description/i), 'Une description suffisante pour le ticket')
    await user.selectOptions(screen.getByLabelText(/priorité/i), 'medium')
    await user.click(screen.getByRole('button', { name: /créer le ticket/i }))

    await waitFor(() =>
      expect(api.createTicket).toHaveBeenCalledWith('tok', {
        title: 'Mon ticket test',
        description: 'Une description suffisante pour le ticket',
        priority: 'medium',
      })
    )
  })

  it('redirige vers /tickets après création réussie', async () => {
    const user = userEvent.setup()
    ;(api.createTicket as jest.Mock).mockResolvedValue(mockTicket)
    render(<NewTicket />)

    await user.type(screen.getByLabelText(/titre/i), 'Mon ticket test')
    await user.type(screen.getByLabelText(/description/i), 'Une description suffisante pour le ticket')
    await user.selectOptions(screen.getByLabelText(/priorité/i), 'high')
    await user.click(screen.getByRole('button', { name: /créer le ticket/i }))

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/tickets'))
  })

  it("affiche le message d'erreur retourné par l'API", async () => {
    const user = userEvent.setup()
    ;(api.createTicket as jest.Mock).mockRejectedValue(new Error('Titre trop court'))
    render(<NewTicket />)

    await user.type(screen.getByLabelText(/titre/i), 'Mon ticket test')
    await user.type(screen.getByLabelText(/description/i), 'Description ok')
    await user.selectOptions(screen.getByLabelText(/priorité/i), 'low')
    await user.click(screen.getByRole('button', { name: /créer le ticket/i }))

    expect(await screen.findByText('Titre trop court')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('désactive le bouton et affiche "Création…" pendant le chargement', async () => {
    const user = userEvent.setup()
    ;(api.createTicket as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<NewTicket />)

    await user.type(screen.getByLabelText(/titre/i), 'Mon ticket test')
    await user.type(screen.getByLabelText(/description/i), 'Description suffisante')
    await user.selectOptions(screen.getByLabelText(/priorité/i), 'urgent')
    await user.click(screen.getByRole('button', { name: /créer le ticket/i }))

    expect(screen.getByRole('button', { name: /création/i })).toBeDisabled()
  })
})
