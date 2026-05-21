const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');

jest.mock('../../src/modules/auth/auth.repository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const userRepo = require('../../src/modules/auth/auth.repository');
const bcrypt = require('bcryptjs');

describe('Auth Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/auth/register', () => {
    it('201 avec données valides', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed');
      userRepo.create.mockResolvedValue({ id: 'uuid-1', email: 'new@test.com', name: 'New', role: 'client' });
      jwt.sign.mockReturnValue('token123');

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email: 'new@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.token).toBe('token123');
      expect(res.body.user.email).toBe('new@test.com');
    });

    it('400 si mot de passe trop court (< 8 caractères)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: '123' });

      expect(res.status).toBe(400);
    });

    it('400 si email invalide', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('400 si nom manquant', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('409 si email déjà utilisé', async () => {
      userRepo.findByEmail.mockResolvedValue({ id: 'existing' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'existing@test.com', password: 'password123' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('200 avec identifiants valides', async () => {
      userRepo.findByEmail.mockResolvedValue({
        id: 'uuid-1', email: 'test@test.com', password: 'hashed', role: 'client', name: 'Test',
      });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token123');

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
    });

    it('401 avec mauvais mot de passe', async () => {
      userRepo.findByEmail.mockResolvedValue({ id: 'uuid-1', password: 'hashed', role: 'client' });
      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('401 si utilisateur inexistant', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('401 sans token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('401 avec token invalide', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer bad_token');

      expect(res.status).toBe(401);
    });

    it('200 avec token valide', async () => {
      jwt.verify.mockReturnValue({ id: 'uuid-1', role: 'client' });
      userRepo.findById.mockResolvedValue({ id: 'uuid-1', email: 'test@test.com', name: 'Test', role: 'client' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid_token');

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('test@test.com');
    });

    it('404 — utilisateur introuvable', async () => {
      jwt.verify.mockReturnValue({ id: 'uuid-1', role: 'client' });
      userRepo.findById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid_token');

      expect(res.status).toBe(404);
    });
  });
});
