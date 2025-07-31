const request = require('supertest');
const app = require('../../src/app');

describe('App 404 handler', () => {
  test('should return 404 and proper error message for unknown routes', async () => {
    const res = await request(app).get('/this-route-does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toHaveProperty('message', 'not found');
    expect(res.body.error).toHaveProperty('code', 404);
  });
});
