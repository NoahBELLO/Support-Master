import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '@/app/register/page'
import * as api from '@/lib/api'
import * as AuthContext from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

jest.mock('@/lib/api', () => ({ registerUser: jest.fn() }))
jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

const mockUser: api.User = {
  id: '1',
  email: 'new@test.com',
  name: 'Jean Dupont',
  role: 'client',
  created_at: '',
}

describe('Register page', () => {
  const mockLogin = jest.fn()
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({
      user: null,
      token: null,
      login: mockLogin,
      logout: jest.fn(),
    })
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  it('affiche le titre et tous les champs du formulaire', () => {
    render(<Register />)
    expect(screen.getByRole('heading', { name: /créer un compte/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Nom complet')).toBeInTheDocument()
    expect(screen.getByLabelText('Adresse e-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmer le mot de passe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /créer mon compte/i })).toBeInTheDocument()
  })

  it('affiche un lien vers la page login', () => {
    render(<Register />)
    expect(screen.getByRole('link', { name: /se connecter/i })).toHaveAttribute('href', '/login')
  })

  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    const user = userEvent.setup()
    render(<Register />)

    await user.type(screen.getByLabelText('Nom complet'), 'Jean Dupont')
    await user.type(screen.getByLabelText('Adresse e-mail'), 'new@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password123')
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'different')
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    expect(
      screen.getByText('Les mots de passe ne correspondent pas')
    ).toBeInTheDocument()
    expect(api.registerUser).not.toHaveBeenCalled()
  })

  it('appelle registerUser avec les bons arguments', async () => {
    const user = userEvent.setup()
    ;(api.registerUser as jest.Mock).mockResolvedValue({ token: 'tok', user: mockUser })
    render(<Register />)

    await user.type(screen.getByLabelText('Nom complet'), 'Jean Dupont')
    await user.type(screen.getByLabelText('Adresse e-mail'), 'new@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password123')
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'password123')
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    await waitFor(() =>
      expect(api.registerUser).toHaveBeenCalledWith('Jean Dupont', 'new@test.com', 'password123')
    )
  })

  it('appelle login() du contexte et redirige vers /tickets après succès', async () => {
    const user = userEvent.setup()
    ;(api.registerUser as jest.Mock).mockResolvedValue({ token: 'tok', user: mockUser })
    render(<Register />)

    await user.type(screen.getByLabelText('Nom complet'), 'Jean Dupont')
    await user.type(screen.getByLabelText('Adresse e-mail'), 'new@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password123')
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'password123')
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('tok', mockUser)
      expect(mockPush).toHaveBeenCalledWith('/tickets')
    })
  })

  it("affiche le message d'erreur retourné par l'API", async () => {
    const user = userEvent.setup()
    ;(api.registerUser as jest.Mock).mockRejectedValue(new Error('Email déjà utilisé'))
    render(<Register />)

    await user.type(screen.getByLabelText('Nom complet'), 'Jean Dupont')
    await user.type(screen.getByLabelText('Adresse e-mail'), 'exists@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password123')
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'password123')
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    expect(await screen.findByText('Email déjà utilisé')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('désactive le bouton et affiche "Création…" pendant le chargement', async () => {
    const user = userEvent.setup()
    ;(api.registerUser as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<Register />)

    await user.type(screen.getByLabelText('Nom complet'), 'Jean Dupont')
    await user.type(screen.getByLabelText('Adresse e-mail'), 'new@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password123')
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'password123')
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    const btn = screen.getByRole('button', { name: /création/i })
    expect(btn).toBeDisabled()
  })
})
