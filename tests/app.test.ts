import request from 'supertest';
import app from "../src/index";



describe('Application root', () => {
  it('should return welcome message', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Hello, TypeScript and Express');
  });
});
