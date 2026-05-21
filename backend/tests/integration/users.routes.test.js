const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');

jest.mock('../../src/modules/users/user.repository');
jest.mock('jsonwebtoken');

const userRepo = require('../../src/modules/users/user.repository');

const mockAuth = (role, id = 'user-id') => {
  jwt.verify.mockReturnValue({ id, role });
  return 'mock_token';
};

describe('Users Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/users', () => {
    it('200 — liste tous les utilisateurs (admin)', async () => {
      userRepo.findAll.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${mockAuth('admin')}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('403 — client ne peut pas lister', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${mockAuth('client')}`);

      expect(res.status).toBe(403);
    });

    it('401 — sans token', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('200 — retourne un utilisateur', async () => {
      userRepo.findById.mockResolvedValue({ id: 'u1', name: 'Test', email: 'test@test.com', role: 'client' });

      const res = await request(app)
        .get('/api/users/u1')
        .set('Authorization', `Bearer ${mockAuth('admin')}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('u1');
    });

    it('404 — utilisateur introuvable', async () => {
      userRepo.findById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/users/nonexistent')
        .set('Authorization', `Bearer ${mockAuth('admin')}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('200 — met à jour le rôle d\'un utilisateur', async () => {
      userRepo.findById.mockResolvedValue({ id: 'u1', name: 'Test', role: 'client' });
      userRepo.update.mockResolvedValue({ id: 'u1', name: 'Test', role: 'agent' });

      const res = await request(app)
        .put('/api/users/u1')
        .set('Authorization', `Bearer ${mockAuth('admin')}`)
        .send({ role: 'agent' });

      expect(res.status).toBe(200);
    });

    it('404 — utilisateur introuvable', async () => {
      userRepo.findById.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/users/nonexistent')
        .set('Authorization', `Bearer ${mockAuth('admin')}`)
        .send({ role: 'agent' });

      expect(res.status).toBe(404);
    });

    it('400 — rôle invalide', async () => {
      const res = await request(app)
        .put('/api/users/u1')
        .set('Authorization', `Bearer ${mockAuth('admin')}`)
        .send({ role: 'superuser' });

      expect(res.status).toBe(400);
    });

    it('400 — body vide', async () => {
      const res = await request(app)
        .put('/api/users/u1')
        .set('Authorization', `Bearer ${mockAuth('admin')}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('204 — supprime un utilisateur', async () => {
      userRepo.findById.mockResolvedValue({ id: 'u1' });
      userRepo.remove.mockResolvedValue();

      const res = await request(app)
        .delete('/api/users/u1')
        .set('Authorization', `Bearer ${mockAuth('admin')}`);

      expect(res.status).toBe(204);
    });

    it('404 — utilisateur introuvable', async () => {
      userRepo.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/users/nonexistent')
        .set('Authorization', `Bearer ${mockAuth('admin')}`);

      expect(res.status).toBe(404);
    });
  });
});
