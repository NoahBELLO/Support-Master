const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');

jest.mock('../../src/modules/messages/message.repository');
jest.mock('../../src/modules/tickets/ticket.repository');
jest.mock('jsonwebtoken');

const messageRepo = require('../../src/modules/messages/message.repository');
const ticketRepo = require('../../src/modules/tickets/ticket.repository');

const mockAuth = (role, id = 'user-id') => {
  jwt.verify.mockReturnValue({ id, role });
  return 'mock_token';
};

describe('Messages Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/tickets/:ticketId/messages', () => {
    it('201 — ajoute un message dans un ticket ouvert', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'user-id', status: 'open' });
      messageRepo.create.mockResolvedValue({ id: 'msg-1', content: 'Hello', is_internal: false });

      const res = await request(app)
        .post('/api/tickets/ticket-1/messages')
        .set('Authorization', `Bearer ${mockAuth('client')}`)
        .send({ content: 'Hello' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('msg-1');
    });

    it('400 — ticket fermé', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'user-id', status: 'closed' });

      const res = await request(app)
        .post('/api/tickets/ticket-1/messages')
        .set('Authorization', `Bearer ${mockAuth('client')}`)
        .send({ content: 'Hello' });

      expect(res.status).toBe(400);
    });

    it('400 — contenu vide', async () => {
      const res = await request(app)
        .post('/api/tickets/ticket-1/messages')
        .set('Authorization', `Bearer ${mockAuth('client')}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
    });

    it('401 — sans token', async () => {
      const res = await request(app)
        .post('/api/tickets/ticket-1/messages')
        .send({ content: 'Hello' });

      expect(res.status).toBe(401);
    });

    it('403 — client répond sur le ticket d\'un autre', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'other-id', status: 'open' });

      const res = await request(app)
        .post('/api/tickets/ticket-1/messages')
        .set('Authorization', `Bearer ${mockAuth('client')}`)
        .send({ content: 'Hello' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/tickets/:ticketId/messages', () => {
    it('200 — liste les messages (agent)', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'c-id', status: 'open' });
      messageRepo.findByTicket.mockResolvedValue([{ id: 'msg-1' }, { id: 'msg-2' }]);

      const res = await request(app)
        .get('/api/tickets/ticket-1/messages')
        .set('Authorization', `Bearer ${mockAuth('agent')}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('401 — sans token', async () => {
      const res = await request(app).get('/api/tickets/ticket-1/messages');
      expect(res.status).toBe(401);
    });
  });
});
