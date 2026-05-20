const { test, expect } = require('@playwright/test');

// Parcours : contrôle d'accès — vérification des rôles et des restrictions
test.describe('Contrôle d\'accès par rôle', () => {
  const ts = Date.now();
  let clientAToken, clientBToken, ticketId;

  test.beforeAll(async ({ request }) => {
    const resA = await request.post('/api/auth/register', {
      data: { name: 'Client A', email: `client-a-${ts}@test.com`, password: 'Password123!' },
    });
    clientAToken = (await resA.json()).token;

    const resB = await request.post('/api/auth/register', {
      data: { name: 'Client B', email: `client-b-${ts}@test.com`, password: 'Password123!' },
    });
    clientBToken = (await resB.json()).token;

    // Client A crée un ticket
    const ticketRes = await request.post('/api/tickets', {
      headers: { Authorization: `Bearer ${clientAToken}` },
      data: {
        title: 'Ticket confidentiel du client A',
        description: 'Ce ticket appartient uniquement au client A.',
        priority: 'medium',
      },
    });
    ticketId = (await ticketRes.json()).id;
  });

  test('client B ne peut pas voir le ticket du client A → 403', async ({ request }) => {
    const res = await request.get(`/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${clientBToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('client B ne peut pas répondre sur le ticket du client A → 403', async ({ request }) => {
    const res = await request.post(`/api/tickets/${ticketId}/messages`, {
      headers: { Authorization: `Bearer ${clientBToken}` },
      data: { content: 'Message non autorisé' },
    });
    expect(res.status()).toBe(403);
  });

  test('client ne peut pas supprimer un ticket → 403', async ({ request }) => {
    const res = await request.delete(`/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${clientAToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('client ne peut pas accéder à /api/users → 403', async ({ request }) => {
    const res = await request.get('/api/users', {
      headers: { Authorization: `Bearer ${clientAToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('requête sans token → 401 sur route protégée', async ({ request }) => {
    const res = await request.get('/api/tickets');
    expect(res.status()).toBe(401);
  });

  test('token invalide → 401', async ({ request }) => {
    const res = await request.get('/api/tickets', {
      headers: { Authorization: 'Bearer token_bidon' },
    });
    expect(res.status()).toBe(401);
  });

  test('client ne peut pas modifier un ticket non ouvert', async ({ request }) => {
    // Mettre le ticket en "in_progress" via admin
    const adminRes = await request.post('/api/auth/login', {
      data: { email: 'admin@support.local', password: 'Admin1234!' },
    });
    const adminToken = (await adminRes.json()).token;
    await request.put(`/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: 'in_progress' },
    });

    // Client A tente de modifier → 400 (ticket non open)
    const res = await request.put(`/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${clientAToken}` },
      data: { title: 'Tentative de modification' },
    });
    expect(res.status()).toBe(400);
  });
});
