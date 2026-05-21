const request = require('supertest');
const app = require('../../src/app');

describe('App — routes utilitaires', () => {
  describe('GET /api/health', () => {
    it('200 — retourne ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('GET /metrics', () => {
    it('200 — retourne les métriques Prometheus', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/plain/);
    });
  });
});
