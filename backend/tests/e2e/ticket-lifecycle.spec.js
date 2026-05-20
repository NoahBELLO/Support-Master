const { test, expect } = require('@playwright/test');

// Parcours complet : cycle de vie d'un ticket
// client crée → agent prend en charge → agent résout → admin supprime
test.describe('Cycle de vie d\'un ticket', () => {
  const ts = Date.now();
  const clientData = { name: 'Client E2E', email: `client-${ts}@test.com`, password: 'Password123!' };
  const agentData = { name: 'Agent E2E', email: `agent-${ts}@test.com`, password: 'Password123!' };

  let clientToken, agentToken, adminToken, ticketId;

  test.beforeAll(async ({ request }) => {
    // Créer client
    const clientRes = await request.post('/api/auth/register', { data: clientData });
    clientToken = (await clientRes.json()).token;

    // Créer agent (inscription puis promotion via admin)
    const agentRes = await request.post('/api/auth/register', { data: agentData });
    agentToken = (await agentRes.json()).token;

    // Connexion admin (compte créé par init.sql)
    const adminRes = await request.post('/api/auth/login', {
      data: { email: 'admin@support.local', password: 'Admin1234!' },
    });
    adminToken = (await adminRes.json()).token;

    // Promouvoir l'agent
    const agentProfile = (await (await request.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${agentToken}` },
    })).json());
    await request.put(`/api/users/${agentProfile.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { role: 'agent' },
    });

    // Re-connexion agent pour avoir un token avec le bon rôle
    const reLogin = await request.post('/api/auth/login', { data: { email: agentData.email, password: agentData.password } });
    agentToken = (await reLogin.json()).token;
  });

  test('1. client crée un ticket → 201', async ({ request }) => {
    const res = await request.post('/api/tickets', {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: {
        title: 'Problème de connexion au compte',
        description: 'Je ne parviens plus à me connecter depuis ce matin, le message d\'erreur est 500.',
        priority: 'high',
      },
    });

    expect(res.status()).toBe(201);
    const ticket = await res.json();
    expect(ticket.status).toBe('open');
    expect(ticket.priority).toBe('high');
    ticketId = ticket.id;
  });

  test('2. client voit son ticket dans la liste', async ({ request }) => {
    const res = await request.get('/api/tickets', {
      headers: { Authorization: `Bearer ${clientToken}` },
    });

    expect(res.status()).toBe(200);
    const tickets = await res.json();
    expect(tickets.some((t) => t.id === ticketId)).toBe(true);
  });

  test('3. agent voit le ticket dans sa liste', async ({ request }) => {
    const res = await request.get('/api/tickets', {
      headers: { Authorization: `Bearer ${agentToken}` },
    });

    expect(res.status()).toBe(200);
    const tickets = await res.json();
    expect(tickets.some((t) => t.id === ticketId)).toBe(true);
  });

  test('4. agent passe le ticket en "in_progress"', async ({ request }) => {
    const res = await request.put(`/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${agentToken}` },
      data: { status: 'in_progress' },
    });

    expect(res.status()).toBe(200);
    expect((await res.json()).status).toBe('in_progress');
  });

  test('5. agent ajoute une note interne (invisible pour le client)', async ({ request }) => {
    const res = await request.post(`/api/tickets/${ticketId}/messages`, {
      headers: { Authorization: `Bearer ${agentToken}` },
      data: { content: 'Problème identifié côté serveur auth.', isInternal: true },
    });

    expect(res.status()).toBe(201);
    expect((await res.json()).is_internal).toBe(true);
  });

  test('6. agent répond au client (message public)', async ({ request }) => {
    const res = await request.post(`/api/tickets/${ticketId}/messages`, {
      headers: { Authorization: `Bearer ${agentToken}` },
      data: { content: 'Nous avons identifié le problème et travaillons à sa résolution.' },
    });

    expect(res.status()).toBe(201);
    expect((await res.json()).is_internal).toBe(false);
  });

  test('7. client répond (ne voit pas la note interne)', async ({ request }) => {
    const msgRes = await request.post(`/api/tickets/${ticketId}/messages`, {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: { content: 'Merci pour le retour, j\'attends la résolution.' },
    });
    expect(msgRes.status()).toBe(201);

    const listRes = await request.get(`/api/tickets/${ticketId}/messages`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    const messages = await listRes.json();
    expect(messages.every((m) => m.is_internal === false)).toBe(true);
  });

  test('8. agent résout le ticket → statut "resolved"', async ({ request }) => {
    const res = await request.put(`/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${agentToken}` },
      data: { status: 'resolved' },
    });

    expect(res.status()).toBe(200);
    const ticket = await res.json();
    expect(ticket.status).toBe('resolved');
    expect(ticket.closed_at).not.toBeNull();
  });

  test('9. client ne peut plus envoyer de message sur un ticket fermé', async ({ request }) => {
    // Fermer le ticket
    await request.put(`/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${agentToken}` },
      data: { status: 'closed' },
    });

    const res = await request.post(`/api/tickets/${ticketId}/messages`, {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: { content: 'Un autre message' },
    });
    expect(res.status()).toBe(400);
  });

  test('10. admin supprime le ticket → 204', async ({ request }) => {
    const res = await request.delete(`/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(204);
  });

  test('11. ticket supprimé → 404', async ({ request }) => {
    const res = await request.get(`/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(404);
  });
});
