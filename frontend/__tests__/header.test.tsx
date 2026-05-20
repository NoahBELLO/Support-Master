import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from '@/components/Header'
import * as AuthContext from '@/context/AuthContext'
import type { User } from '@/lib/api'
import { useRouter } from 'next/navigation'

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

const mockUser: User = {
  id: '1',
  email: 'alice@test.com',
  name: 'Alice Dupont',
  role: 'client',
  created_at: '',
}

describe('Header', () => {
  const mockLogout = jest.fn()
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  it('affiche "Se connecter" quand non authentifié', () => {
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({
      user: null,
      token: null,
      login: jest.fn(),
      logout: mockLogout,
    })
    render(<Header />)
    expect(screen.getByRole('link', { name: /se connecter/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /mon compte/i })).not.toBeInTheDocument()
  })

  it('affiche "Mon compte" et les initiales quand authentifié', () => {
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      token: 'tok',
      login: jest.fn(),
      logout: mockLogout,
    })
    render(<Header />)
    expect(screen.getByRole('button', { name: /mon compte/i })).toBeInTheDocument()
    expect(screen.getByText('AD')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /se connecter/i })).not.toBeInTheDocument()
  })

  it('ouvre le dropdown au clic sur "Mon compte"', async () => {
    const user = userEvent.setup()
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      token: 'tok',
      login: jest.fn(),
      logout: mockLogout,
    })
    render(<Header />)

    expect(screen.queryByText('alice@test.com')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /mon compte/i }))
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
  })

  it('appelle logout() et redirige vers / au clic sur "Se déconnecter"', async () => {
    const user = userEvent.setup()
    ;(AuthContext.useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      token: 'tok',
      login: jest.fn(),
      logout: mockLogout,
    })
    render(<Header />)

    await user.click(screen.getByRole('button', { name: /mon compte/i }))
    await user.click(screen.getByRole('button', { name: /se déconnecter/i }))

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})
