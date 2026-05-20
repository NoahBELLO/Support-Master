const { test, expect } = require('@playwright/test');

// Parcours : inscription → connexion → consultation du profil
test.describe('Parcours authentification', () => {
  const user = {
    name: 'Client Test E2E',
    email: `e2e-auth-${Date.now()}@test.com`,
    password: 'Password123!',
  };
  let token;

  test('1. inscription avec données valides → 201', async ({ request }) => {
    const res = await request.post('/api/auth/register', { data: user });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe(user.email);
    expect(body.user.role).toBe('client');
    expect(body.user.password).toBeUndefined();
    token = body.token;
  });

  test('2. inscription avec email déjà utilisé → 409', async ({ request }) => {
    const res = await request.post('/api/auth/register', { data: user });
    expect(res.status()).toBe(409);
  });

  test('3. inscription avec mot de passe trop court → 400', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { name: 'Test', email: 'short@test.com', password: '123' },
    });
    expect(res.status()).toBe(400);
  });

  test('4. connexion avec bons identifiants → 200 + token', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: user.email, password: user.password },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
    token = body.token;
  });

  test('5. connexion avec mauvais mot de passe → 401', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: user.email, password: 'mauvais' },
    });
    expect(res.status()).toBe(401);
  });

  test('6. GET /auth/me avec token valide → profil', async ({ request }) => {
    const res = await request.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.email).toBe(user.email);
    expect(body.password).toBeUndefined();
  });

  test('7. GET /auth/me sans token → 401', async ({ request }) => {
    const res = await request.get('/api/auth/me');
    expect(res.status()).toBe(401);
  });
});
