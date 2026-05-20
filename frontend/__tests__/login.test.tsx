import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '@/app/login/page'
import * as api from '@/lib/api'
import * as AuthContext from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

jest.mock('@/lib/api', () => ({ loginUser: jest.fn() }))
jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

const mockUser: api.User = {
  id: '1',
  email: 'test@test.com',
  name: 'Test User',
  role: 'client',
  created_at: '',
}

describe('Login page', () => {
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

  it('affiche le titre et les champs du formulaire', () => {
    render(<Login />)
    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Adresse e-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('affiche un lien vers la page register', () => {
    render(<Login />)
    expect(screen.getByRole('link', { name: /créer un compte/i })).toHaveAttribute(
      'href',
      '/register'
    )
  })

  it('appelle loginUser avec les bons arguments', async () => {
    const user = userEvent.setup()
    ;(api.loginUser as jest.Mock).mockResolvedValue({ token: 'tok', user: mockUser })
    render(<Login />)

    await user.type(screen.getByLabelText('Adresse e-mail'), 'test@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() =>
      expect(api.loginUser).toHaveBeenCalledWith('test@test.com', 'password123')
    )
  })

  it('appelle login() du contexte et redirige vers /tickets après succès', async () => {
    const user = userEvent.setup()
    ;(api.loginUser as jest.Mock).mockResolvedValue({ token: 'tok', user: mockUser })
    render(<Login />)

    await user.type(screen.getByLabelText('Adresse e-mail'), 'test@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('tok', mockUser)
      expect(mockPush).toHaveBeenCalledWith('/tickets')
    })
  })

  it("affiche le message d'erreur retourné par l'API", async () => {
    const user = userEvent.setup()
    ;(api.loginUser as jest.Mock).mockRejectedValue(new Error('Identifiants invalides'))
    render(<Login />)

    await user.type(screen.getByLabelText('Adresse e-mail'), 'test@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'wrong')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    expect(await screen.findByText('Identifiants invalides')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('désactive le bouton et affiche "Connexion…" pendant le chargement', async () => {
    const user = userEvent.setup()
    ;(api.loginUser as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<Login />)

    await user.type(screen.getByLabelText('Adresse e-mail'), 'test@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    const btn = screen.getByRole('button', { name: /connexion/i })
    expect(btn).toBeDisabled()
  })
})
