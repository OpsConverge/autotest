import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Import your Express app (you'll need to export it from your backend)
// For now, we'll test against the running server
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:4000';

describe('Authentication Integration Tests', () => {
  let authToken;

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('User registered successfully');
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123'
      };

      await request(BASE_URL)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should return 400 for missing password', async () => {
      const userData = {
        email: 'test@example.com'
      };

      await request(BASE_URL)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');

      authToken = response.body.token;
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await request(BASE_URL)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(BASE_URL)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      if (!authToken) {
        // Skip if we don't have a token
        return;
      }

      const response = await request(BASE_URL)
        .get('/api/protected-route')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should reject access without token', async () => {
      await request(BASE_URL)
        .get('/api/protected-route')
        .expect(401);
    });
  });
});
