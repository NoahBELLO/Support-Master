import { loginUser, registerUser, getMe, getTickets, createTicket } from '@/lib/api'

function mockFetch(ok: boolean, data: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(data),
  } as Response)
}

describe('loginUser', () => {
  afterEach(() => { (global.fetch as jest.Mock).mockReset() })

  it('retourne token et user en cas de succès', async () => {
    const payload = {
      token: 'tok',
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'client', created_at: '' },
    }
    mockFetch(true, payload)

    const result = await loginUser('a@b.com', 'pass')
    expect(result).toEqual(payload)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'pass' }),
      })
    )
  })

  it('lève une erreur avec le message de l\'API en cas d\'échec', async () => {
    mockFetch(false, { message: 'Identifiants invalides' })
    await expect(loginUser('a@b.com', 'wrong')).rejects.toThrow('Identifiants invalides')
  })

  it('lève une erreur par défaut si aucun message n\'est retourné', async () => {
    mockFetch(false, {})
    await expect(loginUser('a@b.com', 'wrong')).rejects.toThrow('Identifiants invalides')
  })
})

describe('registerUser', () => {
  afterEach(() => { (global.fetch as jest.Mock).mockReset() })

  it('retourne token et user en cas de succès', async () => {
    const payload = {
      token: 'tok',
      user: { id: '2', email: 'b@c.com', name: 'B', role: 'client', created_at: '' },
    }
    mockFetch(true, payload)

    const result = await registerUser('B', 'b@c.com', 'password123')
    expect(result).toEqual(payload)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'B', email: 'b@c.com', password: 'password123' }),
      })
    )
  })

  it('lève une erreur si l\'email est déjà utilisé', async () => {
    mockFetch(false, { message: 'Email already in use' })
    await expect(registerUser('B', 'exists@c.com', 'pass')).rejects.toThrow(
      'Email already in use'
    )
  })
})

describe('getMe', () => {
  afterEach(() => { (global.fetch as jest.Mock).mockReset() })

  it('retourne le profil utilisateur avec un token valide', async () => {
    const user = { id: '1', email: 'a@b.com', name: 'A', role: 'client', created_at: '' }
    mockFetch(true, user)

    const result = await getMe('valid-token')
    expect(result).toEqual(user)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/me',
      expect.objectContaining({
        headers: { Authorization: 'Bearer valid-token' },
      })
    )
  })

  it('lève une erreur si le token est invalide', async () => {
    mockFetch(false, { message: 'Session expirée' })
    await expect(getMe('bad-token')).rejects.toThrow('Session expirée')
  })
})

describe('getTickets', () => {
  afterEach(() => { (global.fetch as jest.Mock).mockReset() })

  it('retourne la liste des tickets avec un token valide', async () => {
    const tickets = [
      { id: '1', title: 'Bug login', priority: 'high', status: 'open', creator_name: 'Alice', created_at: '' },
    ]
    mockFetch(true, tickets)

    const result = await getTickets('tok')
    expect(result).toEqual(tickets)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/tickets',
      expect.objectContaining({ headers: { Authorization: 'Bearer tok' } })
    )
  })

  it('lève une erreur si le token est invalide', async () => {
    mockFetch(false, { message: 'Session expirée' })
    await expect(getTickets('bad')).rejects.toThrow('Session expirée')
  })
})

describe('createTicket', () => {
  afterEach(() => { (global.fetch as jest.Mock).mockReset() })

  it('retourne le ticket créé en cas de succès', async () => {
    const ticket = { id: '1', title: 'Bug', description: 'Desc', priority: 'medium', status: 'open' }
    mockFetch(true, ticket)

    const result = await createTicket('tok', { title: 'Bug', description: 'Desc', priority: 'medium' })
    expect(result).toEqual(ticket)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/tickets',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Bug', description: 'Desc', priority: 'medium' }),
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      })
    )
  })

  it('lève une erreur en cas d\'échec', async () => {
    mockFetch(false, { message: 'Titre trop court' })
    await expect(createTicket('tok', { title: 'Bug', description: 'Desc', priority: 'low' })).rejects.toThrow('Titre trop court')
  })
})
