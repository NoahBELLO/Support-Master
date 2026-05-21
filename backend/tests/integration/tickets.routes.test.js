const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');

jest.mock('../../src/modules/tickets/ticket.repository');
jest.mock('../../src/modules/messages/message.repository');
jest.mock('jsonwebtoken');

const ticketRepo = require('../../src/modules/tickets/ticket.repository');

const mockAuth = (role, id = 'user-id') => {
  jwt.verify.mockReturnValue({ id, role });
  return 'mock_token';
};

describe('Tickets Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/tickets', () => {
    it('201 — crée un ticket (client)', async () => {
      ticketRepo.create.mockResolvedValue({ id: 'ticket-1', title: 'Bug critique', status: 'open' });

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${mockAuth('client')}`)
        .send({ title: 'Bug critique', description: 'Description détaillée du problème', priority: 'high' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('ticket-1');
    });

    it('400 — titre trop court', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${mockAuth('client')}`)
        .send({ title: 'Bug', description: 'ok', priority: 'low' });

      expect(res.status).toBe(400);
    });

    it('400 — description trop courte', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${mockAuth('client')}`)
        .send({ title: 'Titre valide', description: 'court' });

      expect(res.status).toBe(400);
    });

    it('401 — sans token', async () => {
      const res = await request(app).post('/api/tickets').send({ title: 'Test' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/tickets', () => {
    it('200 — retourne les tickets (admin)', async () => {
      ticketRepo.findAll.mockResolvedValue([{ id: 'ticket-1' }, { id: 'ticket-2' }]);

      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${mockAuth('admin')}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('401 — sans token', async () => {
      const res = await request(app).get('/api/tickets');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/tickets/:id', () => {
    it('200 — retourne un ticket par id', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'user-id' });

      const res = await request(app)
        .get('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('client')}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('ticket-1');
    });

    it('404 — ticket introuvable', async () => {
      ticketRepo.findById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/tickets/nonexistent')
        .set('Authorization', `Bearer ${mockAuth('admin')}`);

      expect(res.status).toBe(404);
    });

    it('403 — client accède au ticket d\'un autre', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'other-id' });

      const res = await request(app)
        .get('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('client')}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/tickets/:id', () => {
    it('200 — agent change le statut', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'c-id', status: 'open' });
      ticketRepo.update.mockResolvedValue({ id: 'ticket-1', status: 'in_progress' });

      const res = await request(app)
        .put('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('agent')}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
    });

    it('400 — statut invalide', async () => {
      const res = await request(app)
        .put('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('agent')}`)
        .send({ status: 'inexistant' });

      expect(res.status).toBe(400);
    });

    it('400 — body vide', async () => {
      const res = await request(app)
        .put('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('agent')}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/tickets/:id', () => {
    it('204 — admin supprime un ticket', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1' });
      ticketRepo.remove.mockResolvedValue();

      const res = await request(app)
        .delete('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('admin')}`);

      expect(res.status).toBe(204);
    });

    it('403 — client ne peut pas supprimer', async () => {
      const res = await request(app)
        .delete('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('client')}`);

      expect(res.status).toBe(403);
    });

    it('403 — agent ne peut pas supprimer', async () => {
      const res = await request(app)
        .delete('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('agent')}`);

      expect(res.status).toBe(403);
    });

    it('500 — erreur inattendue (couvre le catch du controller remove)', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1' });
      ticketRepo.remove.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .delete('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('admin')}`);

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/tickets/:id/claim', () => {
    it('200 — agent prend en charge un ticket non assigné', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', assigned_to: null, status: 'open' });
      ticketRepo.update.mockResolvedValue({ id: 'ticket-1', assigned_to: 'user-id', status: 'in_progress' });

      const res = await request(app)
        .post('/api/tickets/ticket-1/claim')
        .set('Authorization', `Bearer ${mockAuth('agent')}`);

      expect(res.status).toBe(200);
      expect(res.body.assigned_to).toBe('user-id');
    });

    it('404 — ticket introuvable', async () => {
      ticketRepo.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/tickets/ticket-1/claim')
        .set('Authorization', `Bearer ${mockAuth('agent')}`);

      expect(res.status).toBe(404);
    });

    it('409 — ticket déjà assigné', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', assigned_to: 'other-agent', status: 'in_progress' });

      const res = await request(app)
        .post('/api/tickets/ticket-1/claim')
        .set('Authorization', `Bearer ${mockAuth('agent')}`);

      expect(res.status).toBe(409);
    });

    it('400 — ticket fermé', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', assigned_to: null, status: 'closed' });

      const res = await request(app)
        .post('/api/tickets/ticket-1/claim')
        .set('Authorization', `Bearer ${mockAuth('agent')}`);

      expect(res.status).toBe(400);
    });

    it('403 — client ne peut pas prendre en charge', async () => {
      const res = await request(app)
        .post('/api/tickets/ticket-1/claim')
        .set('Authorization', `Bearer ${mockAuth('client')}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/tickets/:id — chemins client', () => {
    it('403 — client tente de modifier le ticket d\'un autre', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'other-id', status: 'open' });

      const res = await request(app)
        .put('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('client', 'user-id')}`)
        .send({ title: 'Nouveau titre valide' });

      expect(res.status).toBe(403);
    });

    it('400 — client tente de modifier un ticket non ouvert', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'user-id', status: 'in_progress' });

      const res = await request(app)
        .put('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('client', 'user-id')}`)
        .send({ title: 'Nouveau titre valide' });

      expect(res.status).toBe(400);
    });

    it('200 — client modifie son propre ticket ouvert', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'user-id', status: 'open' });
      ticketRepo.update.mockResolvedValue({ id: 'ticket-1', title: 'Nouveau titre valide', status: 'open' });

      const res = await request(app)
        .put('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('client', 'user-id')}`)
        .send({ title: 'Nouveau titre valide' });

      expect(res.status).toBe(200);
    });

    it('200 — agent change le statut en closed (définit closed_at)', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'c-id', status: 'open' });
      ticketRepo.update.mockResolvedValue({ id: 'ticket-1', status: 'closed', closed_at: new Date().toISOString() });

      const res = await request(app)
        .put('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('agent')}`)
        .send({ status: 'closed' });

      expect(res.status).toBe(200);
      expect(ticketRepo.update).toHaveBeenCalledWith('ticket-1', expect.objectContaining({ closed_at: expect.any(String) }));
    });

    it('200 — agent change le statut en resolved (définit closed_at)', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'c-id', status: 'open' });
      ticketRepo.update.mockResolvedValue({ id: 'ticket-1', status: 'resolved', closed_at: new Date().toISOString() });

      const res = await request(app)
        .put('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('agent')}`)
        .send({ status: 'resolved' });

      expect(res.status).toBe(200);
      expect(ticketRepo.update).toHaveBeenCalledWith('ticket-1', expect.objectContaining({ closed_at: expect.any(String) }));
    });

    it('500 — erreur inattendue (couvre le catch du controller update)', async () => {
      ticketRepo.findById.mockRejectedValue(new Error('DB crash'));

      const res = await request(app)
        .put('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${mockAuth('agent')}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(500);
    });
  });

  describe('Erreurs inattendues — controller create et list', () => {
    it('500 — erreur inattendue lors de la création (couvre le catch du controller create)', async () => {
      ticketRepo.create.mockRejectedValue(new Error('DB crash'));

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${mockAuth('client')}`)
        .send({ title: 'Titre valide', description: 'Description suffisante', priority: 'low' });

      expect(res.status).toBe(500);
    });

    it('500 — erreur inattendue lors du listing (couvre le catch du controller list)', async () => {
      ticketRepo.findAll.mockRejectedValue(new Error('DB crash'));

      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${mockAuth('admin')}`);

      expect(res.status).toBe(500);
    });
  });
});
